"""marketplace — requests (the RFP) and proposals.

Business rules, and the ONLY public surface of this module.

One deliberate departure from the prototype, per the schema plan: the request
row stores only the states its OWNER can produce — draft, published, accepted,
cancelled. Everything after award is DERIVED from the contract, and
"proposals_received" from the proposal count. The prototype mutated
request.status and contract.status in lockstep from the same actions, which is
a duplicated state machine waiting to drift, and half those writes belonged to
orgs RLS rightly stops from touching a client's request row.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.config import settings
from sourcehub.modules.audit import service as audit
from sourcehub.modules.marketplace.models import Proposal, Request, RequestSample
from sourcehub.modules.notify import service as notifier


class MarketplaceError(Exception):
    pass


# ---------------------------------------------------------------------------
# Sample files — pointers to object storage, never bytes
# ---------------------------------------------------------------------------

MAX_SAMPLE_BYTES = 25 * 1024 * 1024
MAX_SAMPLES_PER_REQUEST = 5

# Content-type is advisory (browsers lie); the extension is what we gate on.
_SAMPLE_EXTENSIONS = {
    ".csv", ".tsv", ".json", ".jsonl", ".xml", ".txt", ".md", ".pdf",
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".mp3", ".wav",
    ".zip", ".xlsx", ".docx", ".parquet",
}


def _safe_filename(name: str) -> str:
    # basename only — a path in a filename is someone probing the key scheme
    name = name.replace("\\", "/").rsplit("/", 1)[-1]
    name = "".join(c for c in name if c.isprintable() and c not in '<>:"|?*').strip()
    if len(name) > 200:
        stem, _, ext = name.rpartition(".")
        name = stem[: 200 - len(ext) - 1] + "." + ext if ext else name[:200]
    if not name or "." not in name:
        raise MarketplaceError("Sample files need a real filename with an extension.")
    ext = "." + name.rsplit(".", 1)[-1].lower()
    if ext not in _SAMPLE_EXTENSIONS:
        raise MarketplaceError(f"Sample files of type {ext} are not accepted.")
    return name


# ---------------------------------------------------------------------------
# Derived status
# ---------------------------------------------------------------------------

_CONTRACT_TO_REQUEST = {
    "active": "in_progress",
    "in_qa": "in_progress",
    "delivered": "delivered",
    "completed": "completed",
    "disputed": "in_progress",
    "cancelled": "accepted",
}


async def _status_maps(
    session: AsyncSession, request_ids: list[uuid.UUID]
) -> tuple[dict[uuid.UUID, str], dict[uuid.UUID, int]]:
    """(contract status by request, proposal count by request)."""
    if not request_ids:
        return {}, {}
    contracts = (
        await session.execute(
            text(
                "SELECT request_id, status, "
                "  (SELECT count(*) FROM task t WHERE t.contract_id = contract.id "
                "     AND t.deleted_at IS NULL) AS task_count "
                "FROM contract WHERE request_id = ANY(:ids) AND deleted_at IS NULL"
            ),
            {"ids": request_ids},
        )
    ).mappings().all()
    cmap: dict[uuid.UUID, str] = {}
    for row in contracts:
        derived = _CONTRACT_TO_REQUEST[row["status"]]
        if row["status"] == "active" and row["task_count"] == 0:
            derived = "accepted"  # awarded, work not yet broken down
        cmap[row["request_id"]] = derived
    counts = (
        await session.execute(
            select(Proposal.request_id, func.count())
            .where(Proposal.request_id.in_(request_ids), Proposal.deleted_at.is_(None))
            .group_by(Proposal.request_id)
        )
    ).all()
    return cmap, dict(counts)


def _effective(stored: str, derived: str | None, proposal_count: int) -> str:
    if derived:
        return derived
    if stored == "published" and proposal_count > 0:
        return "proposals_received"
    return stored


def _row(r: Request, effective: str, proposal_count: int) -> dict[str, Any]:
    return {
        "id": r.id,
        "reference_code": r.reference_code,
        "client_org_id": r.client_org_id,
        "title": r.title,
        "category": r.category,
        "status": effective,
        "stored_status": r.status,
        "proposal_count": proposal_count,
        "geography": r.geography,
        "compliance_notes": r.compliance_notes,
        "spec": {"format": r.spec_format, "quantity": r.spec_quantity, "quality": r.spec_quality},
        "acceptance": r.acceptance,
        "people": {
            "headcount": r.people_headcount,
            "training": r.people_training,
            "experience": r.people_experience,
            "certification": r.people_certification,
        },
        "budget_min": r.budget_min,
        "budget_max": r.budget_max,
        "currency": r.currency,
        "starts_on": r.starts_on,
        "delivery_due_on": r.delivery_due_on,
        "published_at": r.published_at,
        "created_at": r.created_at,
    }


def _sample_row(s: RequestSample) -> dict[str, Any]:
    return {
        "id": s.id,
        "request_id": s.request_id,
        "filename": s.filename,
        "content_type": s.content_type,
        "size_bytes": s.size_bytes,
        "uploaded_at": s.uploaded_at,
    }


async def presign_sample_upload(
    session: AsyncSession, claims: AccessClaims,
    filename: str, content_type: str | None, size_bytes: int,
) -> dict[str, Any]:
    """Mint a one-object upload URL under the caller's own org prefix.

    The key is server-generated — the client never chooses where bytes land —
    and the request row need not exist yet: the wizard uploads first and the
    final POST /requests attaches the keys.
    """
    from sourcehub.platform.storage import minio_store

    if size_bytes > MAX_SAMPLE_BYTES:
        raise MarketplaceError("Sample files are capped at 25 MB each.")
    safe = _safe_filename(filename)
    key = f"rfp-samples/{claims.org_id}/{uuid.uuid4()}/{safe}"
    url = await minio_store.presign_put(settings.storage_bucket_documents, key)
    return {
        "storage_key": key,
        "url": url,
        "filename": safe,
        "content_type": content_type,
        "expires_in": settings.storage_presign_ttl_seconds,
    }


async def _attach_samples(
    session: AsyncSession, claims: AccessClaims, r: Request, samples: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Record the uploaded objects as child rows, inside create_request's
    transaction. The MinIO stat is the real size enforcement — a presigned PUT
    cannot cap what was uploaded, so the recorded size comes from storage."""
    from sourcehub.platform.storage import minio_store

    if len(samples) > MAX_SAMPLES_PER_REQUEST:
        raise MarketplaceError(f"At most {MAX_SAMPLES_PER_REQUEST} sample files per request.")
    keys = [s["storage_key"] for s in samples]
    if len(set(keys)) != len(keys):
        raise MarketplaceError("Duplicate sample files in the request.")
    own_prefix = f"rfp-samples/{claims.org_id}/"
    out: list[RequestSample] = []
    for s in samples:
        key: str = s["storage_key"]
        if not key.startswith(own_prefix):
            raise MarketplaceError("Sample file does not belong to your organisation.")
        safe = _safe_filename(s["filename"])
        try:
            size, stored_ct = await minio_store.stat(settings.storage_bucket_documents, key)
        except LookupError:
            raise MarketplaceError(f"Sample file {safe} was never uploaded.") from None
        if size <= 0 or size > MAX_SAMPLE_BYTES:
            raise MarketplaceError(f"Sample file {safe} exceeds the 25 MB cap.")
        row = RequestSample(
            request_id=r.id,
            filename=safe,
            storage_key=key,
            content_type=s.get("content_type") or stored_ct,
            size_bytes=size,
            uploaded_by=claims.user_id,
        )
        session.add(row)
        out.append(row)
    await session.flush()
    await audit.log(
        session, "request.samples_attached",
        f"Attached {len(out)} sample file(s) to {r.reference_code}",
        [r.id, claims.org_id],
    )
    return [_sample_row(s) for s in out]


async def list_samples(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> list[dict[str, Any]]:
    """RLS filters: whoever can see the request sees its samples."""
    rows = (
        await session.execute(
            select(RequestSample)
            .where(RequestSample.request_id == request_id)
            .order_by(RequestSample.uploaded_at)
        )
    ).scalars().all()
    return [_sample_row(s) for s in rows]


async def sample_download_url(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID, sample_id: uuid.UUID
) -> dict[str, Any]:
    """A short-TTL download URL. The RLS'd select is the whole access check."""
    from sourcehub.platform.storage import minio_store

    s = (
        await session.execute(
            select(RequestSample).where(
                RequestSample.id == sample_id, RequestSample.request_id == request_id
            )
        )
    ).scalar_one_or_none()
    if s is None:
        raise LookupError("sample not found")
    url = await minio_store.presign_get(
        settings.storage_bucket_documents, s.storage_key, s.filename
    )
    return {"url": url, "filename": s.filename,
            "expires_in": settings.storage_presign_ttl_seconds}


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

_DEFAULTS = {
    "spec_format": "To be agreed",
    "spec_quantity": "To be agreed",
    "spec_quality": "Standard acceptance applies",
    "people_training": "None specified",
    "people_experience": "None specified",
    "people_certification": "None",
    "geography": "Not specified",
    "acceptance": "Client review on delivery",
    "compliance_notes": "None specified",
}


async def create_request(
    session: AsyncSession, claims: AccessClaims, data: dict[str, Any], publish: bool,
    samples: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    ref = (
        await session.execute(text("SELECT next_reference_code('RFP','seq_ref_request', 4)"))
    ).scalar_one()
    # the prototype applies honest defaults on save rather than storing blanks
    fields = {k: (data.get(k) or v) for k, v in _DEFAULTS.items()}
    r = Request(
        reference_code=ref,
        client_org_id=claims.org_id,
        title=data["title"],
        category=data["category"],
        status="published" if publish else "draft",
        people_headcount=int(data.get("people_headcount") or 0),
        budget_min=data.get("budget_min"),
        budget_max=data.get("budget_max"),
        starts_on=data.get("starts_on"),
        delivery_due_on=data.get("delivery_due_on"),
        residency_region=data.get("residency_region"),
        published_at=dt.datetime.now(dt.timezone.utc) if publish else None,
        created_by=claims.user_id,
        **fields,
    )
    session.add(r)
    await session.flush()
    sample_rows = await _attach_samples(session, claims, r, samples) if samples else []
    if publish:
        await _announce_publish(session, claims, r)
    else:
        await audit.log(session, "request.drafted", f"Drafted {r.reference_code}, {r.title}",
                        [r.id, claims.org_id])
    out = _row(r, r.status, 0)
    out["samples"] = sample_rows
    return out


async def update_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID,
    data: dict[str, Any], samples: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Edit a draft. Only a draft — once published, partners are pricing
    against these words and changing them under a live bid is a different
    feature with a different name.
    """
    r = (
        await session.execute(
            select(Request).where(Request.id == request_id, Request.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    if r.client_org_id != claims.org_id:
        raise MarketplaceError("Only the client that raised a request may edit it.")
    if r.status != "draft":
        raise MarketplaceError("Only a draft can be edited.")

    fields = {k: (data.get(k) or v) for k, v in _DEFAULTS.items()}
    for k, v in fields.items():
        setattr(r, k, v)
    r.title = data["title"]
    r.category = data["category"]
    r.people_headcount = int(data.get("people_headcount") or 0)
    r.budget_min = data.get("budget_min")
    r.budget_max = data.get("budget_max")
    r.starts_on = data.get("starts_on")
    r.delivery_due_on = data.get("delivery_due_on")
    r.residency_region = data.get("residency_region")
    r.updated_by = claims.user_id
    await session.flush()

    sample_rows = await _attach_samples(session, claims, r, samples) if samples else []
    await audit.log(session, "request.edited", f"Edited draft {r.reference_code}, {r.title}",
                    [r.id, claims.org_id])
    out = _row(r, r.status, 0)
    out["samples"] = sample_rows
    return out


async def _announce_publish(session: AsyncSession, claims: AccessClaims, r: Request) -> None:
    await audit.log(
        session, "request.published",
        f"Published {r.reference_code}, {r.title}", [r.id, claims.org_id],
    )
    # every active tenant hears about a new opportunity, as in the prototype
    tenants = (
        await session.execute(
            text("SELECT id FROM organisation WHERE kind = 'tenant' AND status = 'active' "
                 "AND deleted_at IS NULL")
        )
    ).scalars().all()
    for tid in tenants:
        await notifier.notify(
            session, tid,
            f"{r.title} is open for proposals.",
            "opportunities", {"id": str(r.id)},
        )


async def publish_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> dict[str, Any]:
    r = await _get_owned(session, request_id)
    if r.status != "draft":
        raise MarketplaceError(f"A {r.status} request cannot be published.")
    r.status = "published"
    r.published_at = dt.datetime.now(dt.timezone.utc)
    r.updated_by = claims.user_id
    await _announce_publish(session, claims, r)
    return _row(r, "published", 0)


async def _get_owned(session: AsyncSession, request_id: uuid.UUID) -> Request:
    r = (
        await session.execute(
            select(Request).where(Request.id == request_id, Request.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    return r


async def list_requests(
    session: AsyncSession, claims: AccessClaims, open_only: bool = False
) -> list[dict[str, Any]]:
    """A client sees its own; a tenant the open marketplace (RLS enforces the
    split — open_only merely narrows the tenant's view to what it can bid on)."""
    stmt = select(Request).where(Request.deleted_at.is_(None)).order_by(Request.created_at.desc())
    if open_only:
        stmt = stmt.where(Request.status == "published")
    rows = (await session.execute(stmt)).scalars().all()
    cmap, counts = await _status_maps(session, [r.id for r in rows])
    out = []
    for r in rows:
        eff = _effective(r.status, cmap.get(r.id), counts.get(r.id, 0))
        if open_only and eff not in ("published", "proposals_received"):
            continue  # awarded work is no longer an opportunity
        out.append(_row(r, eff, counts.get(r.id, 0)))
    return out


async def get_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> dict[str, Any] | None:
    r = (
        await session.execute(
            select(Request).where(Request.id == request_id, Request.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if r is None:
        return None
    cmap, counts = await _status_maps(session, [r.id])
    out = _row(r, _effective(r.status, cmap.get(r.id), counts.get(r.id, 0)), counts.get(r.id, 0))
    out["proposals"] = await list_proposals(session, claims, request_id)
    out["samples"] = await list_samples(session, claims, request_id)
    return out


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------

def _proposal_row(p: Proposal, partner_name: str | None = None,
                  qa_pass_rate: int | None = None) -> dict[str, Any]:
    return {
        "id": p.id,
        "reference_code": p.reference_code,
        "request_id": p.request_id,
        "partner_org_id": p.partner_org_id,
        "partner_name": partner_name,
        "partner_qa_pass_rate": qa_pass_rate,
        "price": p.price,
        "currency": p.currency,
        "duration_days": p.duration_days,
        "methodology": p.methodology,
        "notes": p.notes,
        "status": p.status,
        "submitted_at": p.submitted_at,
    }


async def submit_proposal(
    session: AsyncSession,
    claims: AccessClaims,
    request_id: uuid.UUID,
    price: Decimal,
    duration_days: int,
    methodology: str,
    notes: str | None,
) -> dict[str, Any]:
    r = (
        await session.execute(select(Request).where(Request.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    cmap, counts = await _status_maps(session, [request_id])
    eff = _effective(r.status, cmap.get(request_id), counts.get(request_id, 0))
    if eff not in ("published", "proposals_received"):
        raise MarketplaceError("This request is no longer open for proposals.")
    existing = (
        await session.execute(
            select(Proposal).where(
                Proposal.request_id == request_id,
                Proposal.partner_org_id == claims.org_id,
                Proposal.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise MarketplaceError("You have already proposed on this request.")

    ref = (
        await session.execute(text("SELECT next_reference_code('PRO','seq_ref_proposal')"))
    ).scalar_one()
    p = Proposal(
        reference_code=ref,
        request_id=request_id,
        partner_org_id=claims.org_id,
        price=price,
        duration_days=duration_days,
        methodology=methodology,
        notes=notes,
        created_by=claims.user_id,
    )
    session.add(p)
    await session.flush()
    await notifier.notify(
        session, r.client_org_id,
        f"A proposal arrived on {r.title}.",
        "requestDetail", {"id": str(r.id)},
    )
    await audit.log(
        session, "proposal.submitted",
        f"Submitted {ref} on {r.reference_code} at {p.currency} {price}",
        [p.id, r.id, claims.org_id, r.client_org_id],
    )
    return _proposal_row(p)


async def withdraw_proposal(
    session: AsyncSession, claims: AccessClaims, proposal_id: uuid.UUID
) -> dict[str, Any]:
    p = (
        await session.execute(select(Proposal).where(Proposal.id == proposal_id))
    ).scalar_one_or_none()
    if p is None:
        raise LookupError("proposal not found")
    if p.status != "submitted":
        raise MarketplaceError(f"A {p.status} proposal cannot be withdrawn.")
    p.status = "withdrawn"
    p.decided_at = dt.datetime.now(dt.timezone.utc)
    p.updated_by = claims.user_id
    await audit.log(session, "proposal.withdrawn",
                    f"Withdrew {p.reference_code}", [p.id, p.request_id, claims.org_id])
    return _proposal_row(p)


async def list_proposals(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID | None = None
) -> list[dict[str, Any]]:
    """RLS: a partner sees only its own bids; the client every bid on its
    request — competitors never see each other."""
    q = text(
        "SELECT p.*, o.name AS partner_name, tp.qa_pass_rate "
        "FROM proposal p "
        "JOIN organisation o ON o.id = p.partner_org_id "
        "LEFT JOIN tenant_profile tp ON tp.org_id = p.partner_org_id "
        "WHERE p.deleted_at IS NULL "
        + ("AND p.request_id = :rid " if request_id else "")
        + "ORDER BY p.submitted_at DESC"
    )
    rows = (
        await session.execute(q, {"rid": request_id} if request_id else {})
    ).mappings().all()
    return [
        {
            "id": r["id"],
            "reference_code": r["reference_code"],
            "request_id": r["request_id"],
            "partner_org_id": r["partner_org_id"],
            "partner_name": r["partner_name"],
            "partner_qa_pass_rate": r["qa_pass_rate"],
            "price": r["price"],
            "currency": r["currency"],
            "duration_days": r["duration_days"],
            "methodology": r["methodology"],
            "notes": r["notes"],
            "status": r["status"],
            "submitted_at": r["submitted_at"],
        }
        for r in rows
    ]


async def my_proposals(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                # The client join is an ordinary RLS-scoped one: it resolves
                # because Fix 9 (db/110_auth_functions.sql) makes the buyer
                # visible to the partner that bid to it. LEFT, so a policy
                # change can never silently drop a partner's own proposals.
                "SELECT p.*, r.title AS request_title, r.reference_code AS request_ref, "
                "       r.client_org_id, o.name AS client_name "
                "FROM proposal p JOIN request r ON r.id = p.request_id "
                "LEFT JOIN organisation o ON o.id = r.client_org_id "
                "WHERE p.partner_org_id = :org AND p.deleted_at IS NULL "
                "ORDER BY p.submitted_at DESC"
            ),
            {"org": claims.org_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Award — the transaction the whole marketplace exists for
# ---------------------------------------------------------------------------

async def award(
    session: AsyncSession, claims: AccessClaims, proposal_id: uuid.UUID
) -> dict[str, Any]:
    """Winner accepted, every sibling auto-rejected and told, contract created,
    milestone 1 invoiced into escrow. One transaction, mirroring confirmAward().
    """
    from sourcehub.modules.delivery import service as delivery

    p = (
        await session.execute(select(Proposal).where(Proposal.id == proposal_id))
    ).scalar_one_or_none()
    if p is None:
        raise LookupError("proposal not found")
    if p.status != "submitted":
        raise MarketplaceError(f"A {p.status} proposal cannot be awarded.")

    r = await _get_owned(session, p.request_id)
    if r.client_org_id != claims.org_id:
        raise MarketplaceError("Only the requesting client can award.")
    cmap, _ = await _status_maps(session, [r.id])
    if cmap.get(r.id):
        raise MarketplaceError("This request already has a contract.")

    now = dt.datetime.now(dt.timezone.utc)
    p.status = "accepted"
    p.decided_at = now
    p.updated_by = claims.user_id

    siblings = (
        await session.execute(
            select(Proposal).where(
                Proposal.request_id == r.id,
                Proposal.id != p.id,
                Proposal.status == "submitted",
            )
        )
    ).scalars().all()
    for s in siblings:
        s.status = "rejected"
        s.decided_at = now
        await notifier.notify(
            session, s.partner_org_id,
            f"{r.title} was awarded to another partner.",
            "proposals", {},
        )

    r.status = "accepted"
    r.updated_by = claims.user_id

    contract = await delivery.create_contract_from_award(
        session, claims,
        request_id=r.id, request_ref=r.reference_code, request_title=r.title,
        proposal_id=p.id, client_org_id=r.client_org_id,
        partner_org_id=p.partner_org_id, value=p.price,
        acceptance=r.acceptance, compliance=r.compliance_notes,
    )

    await notifier.notify(
        session, p.partner_org_id,
        f"You won {r.title}. Break the contract into tasks to begin.",
        "contracts", {"id": str(contract["id"])},
    )
    await audit.log(
        session, "contract.awarded",
        f"Awarded {contract['reference_code']} to the winning partner for "
        f"{p.currency} {p.price}",
        [contract["id"], r.id, r.client_org_id, p.partner_org_id],
    )
    return contract
