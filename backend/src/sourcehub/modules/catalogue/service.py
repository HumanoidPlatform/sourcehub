"""catalogue — datasets for sale, and what selling one involves.

Business rules, and the ONLY public surface of this module.

Beside the RFP marketplace, where a client orders data that does not exist
yet, the catalogue lists data that does (db/390, reshaped by db/420). Two ways
a listing comes to exist:

  * its owner creates it — a delivery partner's own data,
    or a client's exclusive data it now wants to sell — saying how many files
    it holds and uploading a few samples;
  * the client approves a contract whose request was not exclusive, and the
    delivery partner chooses to list it: the count comes from the accepted
    captures, and the partner picks some of them as samples.

Either way the owner describes it and submits it; operations publish it or
send it back. A buyer asks for a quote and the two sides agree, in the deal's
chat, how many files and at what price; the seller quotes, the buyer accepts,
and the seller marks the deal paid and then delivered. The files change hands
outside the platform: it keeps nothing of a dataset but its samples.

What the database guarantees, so this module cannot get it wrong (db/420):
only operations publish or reject; what a listing says, its count included,
is fixed once in review; samples change only while the listing is a draft; a
deal's seller comes from the listing, never the caller; the agreed terms are
fixed once accepted; and the transition triggers allow each move to one party
only. Moves here are one conditional UPDATE each, and a trigger's refusal
leaves as a CatalogueError.

Samples live in SourceHub's own storage (platform_target), never a client's
bucket: a contract listing's samples are copies, made by the sweep
(catalogue.sweep).
"""

from __future__ import annotations

import re
import secrets
import uuid
from decimal import Decimal
from email.utils import formataddr
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.db.session import anonymous_session
from sourcehub.modules.audit import service as audit
from sourcehub.modules.notify import service as notifier
from sourcehub.modules.storage import service as storage_svc
from sourcehub.platform import storage


class CatalogueError(Exception):
    pass


# Aggregators take no part in the catalogue (0048): they hand captures to
# the partner, who sells.
SELLER_KINDS = frozenset({"tenant", "client"})
MAX_UPLOADS_PER_CALL = 50
MAX_SAMPLES = 50
# captures offered to a contract listing's owner to pick samples from
MAX_CAPTURES_SHOWN = 300
MAX_MESSAGE = 4000
MAX_MESSAGES_PER_DEAL = 500

# A deal still being negotiated, and one that is settled.
OPEN_DEAL = ("requested", "quoted")
AGREED_DEAL = ("accepted", "paid", "delivered")


# ---------------------------------------------------------------------------
# Shapes
# ---------------------------------------------------------------------------


def _money(value: Any) -> str | None:
    return None if value is None else f"{Decimal(str(value)):.2f}"


def _reason(e: DBAPIError) -> str:
    """The trigger's own sentence, without the driver's framing."""
    msg = str(getattr(e, "orig", e))
    for prefix in ("dataset deal", "dataset sample", "dataset "):
        at = msg.find(prefix)
        if at >= 0:
            line = msg[at:].split("\n", 1)[0].strip()
            # "dataset <uuid>: …" reads better without the id
            return re.sub(r"^dataset (deal )?[0-9a-f-]{36}: ", "", line)
    if "datahub_dataset_deal_open_key" in msg:
        return "You already have an open quote request for this dataset."
    if "datahub_dataset_deal_not_own" in msg:
        return "You cannot buy your own dataset."
    return "The database refused the change."


def slugify(title: str) -> str:
    """A readable, unique-enough address: words of the title and six hex
    characters. Fixed at creation (the column is not updatable), so a
    renamed listing keeps its link."""
    words = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60].strip("-")
    return f"{words or 'dataset'}-{secrets.token_hex(3)}"


def _safe_filename(name: str) -> str:
    base = name.replace("\\", "/").rsplit("/", 1)[-1].strip()
    base = re.sub(r"[^A-Za-z0-9._ -]+", "_", base)[:120].strip(" .")
    return base or "file"


_DATASET_COLUMNS = (
    "d.id, d.owner_org_id, d.source, d.contract_id, d.slug, d.title, d.summary, d.description, "
    "d.category, d.use_cases, d.regions, d.languages, d.permitted_uses, d.licence_terms, "
    "d.indicative_price_text, d.file_count, d.total_bytes, d.status, d.submitted_at, "
    "d.review_note, d.reviewed_at, d.published_at, d.withdrawn_at, d.withdrawn_reason, "
    "d.created_at, d.updated_at, "
    # the seller's name, which organisation's own policies hide from another
    # partner (db/410); never a join, or the listing would vanish with it
    "datahub_org_name(d.owner_org_id) AS owner_name, "
    "(SELECT count(*) FROM datahub_dataset_sample s WHERE s.dataset_id = d.id "
    "   AND s.copy_status = 'copied') AS sample_count"
)


def _dataset(m: Any, claims: AccessClaims | None) -> dict[str, Any]:
    is_owner = claims is not None and m["owner_org_id"] == claims.org_id
    out = {
        "id": m["id"],
        "slug": m["slug"],
        "title": m["title"],
        "summary": m["summary"],
        "description": m["description"],
        "category": m["category"],
        "use_cases": list(m["use_cases"] or []),
        "regions": list(m["regions"] or []),
        "languages": list(m["languages"] or []),
        "permitted_uses": list(m["permitted_uses"] or []),
        "licence_terms": m["licence_terms"],
        "indicative_price_text": m["indicative_price_text"],
        "file_count": m["file_count"],
        "total_bytes": m["total_bytes"],
        "sample_count": m["sample_count"],
        "source": m["source"],
        "status": m["status"],
        "owner_org_id": m["owner_org_id"],
        "owner_name": m["owner_name"],
        "published_at": m["published_at"],
        "withdrawn_at": m["withdrawn_at"],
        "withdrawn_reason": m["withdrawn_reason"],
        "is_owner": is_owner,
    }
    # What only the owner and operations work with.
    if is_owner or (claims is not None and claims.role == "platform_admin"):
        out.update(
            {
                "contract_id": m["contract_id"],
                "submitted_at": m["submitted_at"],
                "review_note": m["review_note"],
                "reviewed_at": m["reviewed_at"],
                "created_at": m["created_at"],
                "updated_at": m["updated_at"],
            }
        )
    return out


def _sample(m: Any, *, owner_view: bool) -> dict[str, Any]:
    out = {
        "id": m["id"],
        "filename": m["filename"],
        "mime_type": m["mime_type"],
        "size_bytes": m["size_bytes"],
    }
    if owner_view:
        out.update(
            {
                "copy_status": m["copy_status"],
                "copy_error": m["copy_error"],
                "source_asset_id": m["source_asset_id"],
            }
        )
    return out


async def _one(session: AsyncSession, sql: str, params: dict[str, Any]) -> Any:
    return (await session.execute(text(sql), params)).mappings().one_or_none()


async def _dataset_row(session: AsyncSession, dataset_id: uuid.UUID) -> Any:
    m = await _one(
        session,
        f"SELECT {_DATASET_COLUMNS} FROM datahub_dataset d WHERE d.id = :id",
        {"id": dataset_id},
    )
    if m is None:
        raise LookupError("dataset not found")
    return m


async def _owned(session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, what: str) -> Any:
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError(f"Only the dataset's owner {what}.")
    return m


async def _ops_org(session: AsyncSession) -> uuid.UUID | None:
    return (
        await session.execute(text("SELECT id FROM organisation WHERE kind = 'platform' LIMIT 1"))
    ).scalar_one_or_none()


# ---------------------------------------------------------------------------
# Browsing — any signed-in organisation
# ---------------------------------------------------------------------------


async def list_published(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    q: str | None = None,
    category: str | None = None,
) -> list[dict[str, Any]]:
    """Every listing on sale, newest first. RLS shows published rows to any
    signed-in organisation."""
    where = ["d.status = 'published'"]
    params: dict[str, Any] = {}
    if q:
        where.append("(d.title ILIKE :q OR d.summary ILIKE :q OR d.description ILIKE :q)")
        params["q"] = f"%{q.strip()}%"
    if category:
        where.append("d.category = CAST(:category AS request_category)")
        params["category"] = category
    rows = (
        (
            await session.execute(
                text(
                    f"SELECT {_DATASET_COLUMNS} FROM datahub_dataset d "
                    f"WHERE {' AND '.join(where)} ORDER BY d.published_at DESC"
                ),
                params,
            )
        )
        .mappings()
        .all()
    )
    return [_dataset(m, claims) for m in rows]


async def dataset_detail(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """A listing as the caller may see it, with its samples. RLS shows the
    owner and operations every sample, anyone else the copied ones of a
    listing on sale."""
    m = await _dataset_row(session, dataset_id)
    d = _dataset(m, claims)
    owner_view = d["is_owner"] or claims.role == "platform_admin"
    samples = (
        (
            await session.execute(
                text(
                    "SELECT * FROM datahub_dataset_sample WHERE dataset_id = :id "
                    + ("" if owner_view else "AND copy_status = 'copied' ")
                    + "ORDER BY filename"
                ),
                {"id": dataset_id},
            )
        )
        .mappings()
        .all()
    )
    d["samples"] = [_sample(s, owner_view=owner_view) for s in samples]
    if not owner_view:
        mine = await _one(
            session,
            "SELECT id, status FROM datahub_dataset_deal WHERE dataset_id = :id "
            "AND buyer_org_id = :org ORDER BY created_at DESC LIMIT 1",
            {"id": dataset_id, "org": claims.org_id},
        )
        d["my_deal"] = dict(mine) if mine else None
    return d


async def dataset_by_slug(session: AsyncSession, claims: AccessClaims, slug: str) -> dict[str, Any]:
    dataset_id = (
        await session.execute(text("SELECT id FROM datahub_dataset WHERE slug = :s"), {"s": slug})
    ).scalar_one_or_none()
    if dataset_id is None:
        raise LookupError("dataset not found")
    return await dataset_detail(session, claims, dataset_id)


async def sample_url(
    session: AsyncSession, claims: AccessClaims, sample_id: uuid.UUID
) -> dict[str, Any]:
    """A short-lived link to one sample. RLS is the whole access check: a row
    the caller cannot see is a 404."""
    m = await _one(
        session,
        "SELECT storage_key, filename, copy_status FROM datahub_dataset_sample WHERE id = :id",
        {"id": sample_id},
    )
    if m is None:
        raise LookupError("sample not found")
    if m["copy_status"] != "copied":
        raise CatalogueError("This sample is still being copied in.")
    url = await storage.presign_get(
        storage.platform_target(), m["storage_key"], m["filename"], inline=True
    )
    return {"url": url}


# ---------------------------------------------------------------------------
# Listing — the owner
# ---------------------------------------------------------------------------

_EDITABLE = (
    "title",
    "summary",
    "description",
    "category",
    "use_cases",
    "regions",
    "languages",
    "permitted_uses",
    "licence_terms",
    "indicative_price_text",
    "file_count",
    "total_bytes",
)
_ARRAYS = ("use_cases", "regions", "languages", "permitted_uses")


async def my_datasets(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        (
            await session.execute(
                text(
                    f"SELECT {_DATASET_COLUMNS}, "
                    "  (SELECT count(*) FROM datahub_dataset_sample s WHERE s.dataset_id = d.id "
                    "     AND s.copy_status = 'pending') AS pending_copies, "
                    "  (SELECT count(*) FROM datahub_dataset_deal k WHERE k.dataset_id = d.id "
                    "     AND k.status = 'requested') AS open_requests "
                    "FROM datahub_dataset d "
                    "WHERE d.owner_org_id = :org ORDER BY d.updated_at DESC"
                ),
                {"org": claims.org_id},
            )
        )
        .mappings()
        .all()
    )
    out = []
    for m in rows:
        d = _dataset(m, claims)
        d["pending_copies"] = m["pending_copies"]
        d["open_requests"] = m["open_requests"]
        out.append(d)
    return out


async def create_dataset(
    session: AsyncSession, claims: AccessClaims, fields: dict[str, Any]
) -> dict[str, Any]:
    if claims.org_kind not in SELLER_KINDS:
        raise CatalogueError("Delivery partners and clients list datasets.")
    title = (fields.get("title") or "").strip()
    if not title:
        raise CatalogueError("Give the dataset a title.")
    values = {k: fields.get(k) for k in _EDITABLE}
    values["title"] = title
    values["file_count"] = int(values["file_count"] or 0)
    for k in _ARRAYS:
        values[k] = list(values[k] or [])
    try:
        new_id = (
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset (owner_org_id, source, slug, title, summary, description, "
                    "  category, use_cases, regions, languages, permitted_uses, licence_terms, "
                    "  indicative_price_text, file_count, total_bytes, created_by) "
                    "VALUES (:org, 'upload', :slug, :title, :summary, :description, "
                    "  CAST(:category AS request_category), :use_cases, :regions, :languages, "
                    "  :permitted_uses, :licence_terms, :indicative_price_text, :file_count, "
                    "  :total_bytes, :who) "
                    "RETURNING id"
                ),
                {**values, "org": claims.org_id, "slug": slugify(title), "who": claims.user_id},
            )
        ).scalar_one()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    await audit.log(
        session,
        "catalogue.dataset.created",
        f"Started a dataset listing: {title}",
        [new_id, claims.org_id],
    )
    return await dataset_detail(session, claims, new_id)


async def update_dataset(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, fields: dict[str, Any]
) -> dict[str, Any]:
    m = await _owned(session, claims, dataset_id, "edits it")
    if m["source"] == "contract" and ({"file_count", "total_bytes"} & fields.keys()):
        # A contract listing holds what the contract delivered: counted, not typed.
        fields = {k: v for k, v in fields.items() if k not in ("file_count", "total_bytes")}
    sets, params = [], {"id": dataset_id}
    for k in _EDITABLE:
        if k not in fields:
            continue
        v = fields[k]
        if k == "title":
            v = (v or "").strip()
            if not v:
                raise CatalogueError("A dataset needs a title.")
        if k in _ARRAYS:
            v = list(v or [])
        if k == "file_count":
            v = int(v or 0)
        sets.append(f"{k} = CAST(:{k} AS request_category)" if k == "category" else f"{k} = :{k}")
        params[k] = v
    if not sets:
        return await dataset_detail(session, claims, dataset_id)
    try:
        await session.execute(text(f"UPDATE datahub_dataset SET {', '.join(sets)} WHERE id = :id"), params)
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    return await dataset_detail(session, claims, dataset_id)


async def _sample_room(session: AsyncSession, dataset_id: uuid.UUID, adding: int) -> None:
    have = (
        await session.execute(
            text("SELECT count(*) FROM datahub_dataset_sample WHERE dataset_id = :d"), {"d": dataset_id}
        )
    ).scalar_one()
    if have + adding > MAX_SAMPLES:
        raise CatalogueError(f"A listing shows at most {MAX_SAMPLES} samples.")


async def upload_urls(
    session: AsyncSession,
    claims: AccessClaims,
    dataset_id: uuid.UUID,
    files: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Signed PUTs into platform storage, one per sample. Nothing is recorded
    until confirm_uploads: a URL handed out and never used leaves no row."""
    await _owned(session, claims, dataset_id, "adds samples")
    if not files:
        return []
    if len(files) > MAX_UPLOADS_PER_CALL:
        raise CatalogueError(f"Send at most {MAX_UPLOADS_PER_CALL} files at a time.")
    await _sample_room(session, dataset_id, len(files))
    target = storage.platform_target()
    out = []
    for f in files:
        name = _safe_filename(str(f.get("filename") or ""))
        key = f"catalogue/{dataset_id}/samples/{uuid.uuid4().hex[:12]}-{name}"
        url, headers = await storage.presign_put(target, key)
        out.append({"filename": name, "key": key, "url": url, "headers": headers})
    return out


async def confirm_uploads(
    session: AsyncSession,
    claims: AccessClaims,
    dataset_id: uuid.UUID,
    uploads: list[dict[str, Any]],
) -> dict[str, Any]:
    """Record samples the browser has put. The size comes from storage, never
    the caller; a key outside this dataset's samples is refused."""
    await _owned(session, claims, dataset_id, "adds samples")
    await _sample_room(session, dataset_id, len(uploads))
    prefix = f"catalogue/{dataset_id}/samples/"
    target = storage.platform_target()
    for u in uploads:
        key = str(u.get("key") or "")
        if not key.startswith(prefix) or ".." in key:
            raise CatalogueError("That file does not belong to this dataset.")
        try:
            size, content_type = await storage.stat(target, key)
        except LookupError:
            raise CatalogueError(f"{u.get('filename') or key} was not uploaded.") from None
        try:
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset_sample (dataset_id, owner_org_id, storage_key, "
                    "  filename, mime_type, size_bytes) "
                    "VALUES (:d, :org, :key, :name, :mime, :size) "
                    "ON CONFLICT (dataset_id, storage_key) DO NOTHING"
                ),
                {
                    "d": dataset_id,
                    "org": claims.org_id,
                    "key": key,
                    "name": _safe_filename(str(u.get("filename") or key.rsplit("/", 1)[-1])),
                    "mime": u.get("content_type") or content_type,
                    "size": size,
                },
            )
        except DBAPIError as e:
            raise CatalogueError(_reason(e)) from None
    return await dataset_detail(session, claims, dataset_id)


async def remove_sample(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, sample_id: uuid.UUID
) -> dict[str, Any]:
    """Take a sample off a draft. Its blob is left for the lifecycle rule, as
    attachments are: a delete cannot be undone."""
    try:
        gone = (
            await session.execute(
                text(
                    "DELETE FROM datahub_dataset_sample WHERE id = :id AND dataset_id = :d "
                    "AND owner_org_id = :org RETURNING id"
                ),
                {"id": sample_id, "d": dataset_id, "org": claims.org_id},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if gone is None:
        raise LookupError("sample not found")
    return await dataset_detail(session, claims, dataset_id)


async def retry_copies(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """Put every sample that failed to copy back in the sweep's queue."""
    await _owned(session, claims, dataset_id, "does that")
    await session.execute(
        text(
            "UPDATE datahub_dataset_sample SET copy_status = 'pending', copy_error = NULL "
            "WHERE dataset_id = :d AND copy_status = 'failed'"
        ),
        {"d": dataset_id},
    )
    return await dataset_detail(session, claims, dataset_id)


async def _contract_listing(session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID) -> Any:
    m = await _owned(session, claims, dataset_id, "picks its samples")
    if m["source"] != "contract" or m["contract_id"] is None:
        raise CatalogueError("Samples are picked from captures only for a listing made from a contract.")
    return m


async def contract_captures(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> list[dict[str, Any]]:
    """The accepted captures of a contract listing, for its owner to pick
    samples from, each with a short-lived preview link into the client's
    bucket. The partner delivered these; it reads them as it did then."""
    m = await _contract_listing(session, claims, dataset_id)
    rows = (
        (
            await session.execute(
                text(
                    "SELECT * FROM datahub_relist_candidates(:c) ORDER BY captured_at NULLS LAST "
                    f"LIMIT {MAX_CAPTURES_SHOWN}"
                ),
                {"c": m["contract_id"]},
            )
        )
        .mappings()
        .all()
    )
    picked = set(
        (
            await session.execute(
                text(
                    "SELECT source_asset_id FROM datahub_dataset_sample "
                    "WHERE dataset_id = :d AND source_asset_id IS NOT NULL"
                ),
                {"d": dataset_id},
            )
        )
        .scalars()
        .all()
    )
    targets: dict[Any, Any] = {}
    out = []
    for r in rows:
        url = None
        if r["storage_key"] and r["storage_target_id"]:
            try:
                if r["storage_target_id"] not in targets:
                    targets[r["storage_target_id"]] = await storage_svc.resolve_by_id(
                        session, r["storage_target_id"]
                    )
                url = await storage.presign_get(
                    targets[r["storage_target_id"]],
                    r["storage_key"],
                    _safe_filename(r["filename"] or str(r["asset_id"])),
                    inline=True,
                )
            except Exception:  # an unreachable bucket leaves the capture unpreviewed, not the list
                url = None
        out.append(
            {
                "asset_id": r["asset_id"],
                "filename": r["filename"],
                "mime_type": r["mime_type"],
                "size_bytes": r["size_bytes"],
                "captured_at": r["captured_at"],
                "url": url,
                "picked": r["asset_id"] in picked,
            }
        )
    return out


async def pick_samples(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, asset_ids: list[uuid.UUID]
) -> dict[str, Any]:
    """Exactly these captures are the contract listing's samples. New ones are
    queued for the sweep to copy; ones no longer picked are removed."""
    m = await _contract_listing(session, claims, dataset_id)
    wanted = list(dict.fromkeys(asset_ids))
    if len(wanted) > MAX_SAMPLES:
        raise CatalogueError(f"Pick at most {MAX_SAMPLES} samples.")
    candidates = {
        r["asset_id"]: r
        for r in (
            await session.execute(
                text("SELECT * FROM datahub_relist_candidates(:c)"), {"c": m["contract_id"]}
            )
        )
        .mappings()
        .all()
    }
    unknown = [a for a in wanted if a not in candidates]
    if unknown:
        raise CatalogueError("Pick samples from this contract's accepted captures.")
    try:
        await session.execute(
            text(
                "DELETE FROM datahub_dataset_sample WHERE dataset_id = :d "
                "AND source_asset_id IS NOT NULL AND NOT (source_asset_id = ANY(:keep))"
            ),
            {"d": dataset_id, "keep": wanted},
        )
        for a in wanted:
            c = candidates[a]
            name = _safe_filename(c["filename"] or str(a))
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset_sample (dataset_id, owner_org_id, storage_key, filename, "
                    "  mime_type, size_bytes, source_asset_id, source_storage_key, "
                    "  source_storage_target_id, copy_status) "
                    "VALUES (:d, :org, :key, :name, :mime, :size, :asset, :skey, :starget, 'pending') "
                    "ON CONFLICT (dataset_id, source_asset_id) WHERE source_asset_id IS NOT NULL "
                    "DO NOTHING"
                ),
                {
                    "d": dataset_id,
                    "org": claims.org_id,
                    "key": f"catalogue/{dataset_id}/samples/{a}-{name}",
                    "name": name,
                    "mime": c["mime_type"],
                    "size": c["size_bytes"],
                    "asset": a,
                    "skey": c["storage_key"],
                    "starget": c["storage_target_id"],
                },
            )
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    return await dataset_detail(session, claims, dataset_id)


async def _readiness(session: AsyncSession, m: Any) -> list[str]:
    """What stops a listing going to review, as sentences."""
    problems = []
    if not (m["summary"] or "").strip():
        problems.append("Add a one-line summary.")
    if not m["permitted_uses"]:
        problems.append("Say what buyers may use it for.")
    if not (m["licence_terms"] or "").strip():
        problems.append("Add your licence terms.")
    if not m["file_count"]:
        problems.append("Say how many files the dataset holds.")
    c = await _one(
        session,
        "SELECT count(*) FILTER (WHERE copy_status = 'copied') AS ready, "
        "       count(*) FILTER (WHERE copy_status = 'pending') AS pending, "
        "       count(*) FILTER (WHERE copy_status = 'failed') AS failed "
        "FROM datahub_dataset_sample WHERE dataset_id = :d",
        {"d": m["id"]},
    )
    if c["pending"]:
        problems.append(f"{c['pending']} samples are still being copied in.")
    if c["failed"]:
        problems.append(f"{c['failed']} samples could not be copied; retry or remove them.")
    if not c["ready"]:
        problems.append("Add at least one sample for the listing page.")
    return problems


async def submit(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    m = await _owned(session, claims, dataset_id, "submits it")
    if m["status"] not in ("draft", "rejected"):
        raise CatalogueError(f"A {m['status'].replace('_', ' ')} listing cannot be submitted.")
    problems = await _readiness(session, m)
    if problems:
        raise CatalogueError(" ".join(problems))
    await _move(session, dataset_id, m["status"], "in_review")
    ops = await _ops_org(session)
    if ops is not None:
        await notifier.notify(
            session,
            ops,
            f"{m['owner_name']} submitted the dataset {m['title']} for review.",
            "catalogue_review",
            {"id": str(dataset_id)},
        )
    await audit.log(
        session,
        "catalogue.dataset.submitted",
        f"Submitted {m['title']} for review",
        [dataset_id, claims.org_id],
    )
    return await dataset_detail(session, claims, dataset_id)


async def pull_back(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """The owner takes a listing out of review to change it."""
    await _owned(session, claims, dataset_id, "does that")
    await _move(session, dataset_id, "in_review", "draft")
    return await dataset_detail(session, claims, dataset_id)


async def _move(
    session: AsyncSession,
    dataset_id: uuid.UUID,
    frm: str,
    to: str,
    extra: dict[str, Any] | None = None,
) -> None:
    extra = extra or {}
    sets = ", ".join(["status = :to"] + [f"{k} = :{k}" for k in extra])
    try:
        got = (
            await session.execute(
                text(f"UPDATE datahub_dataset SET {sets} WHERE id = :id AND status = :frm RETURNING id"),
                {"to": to, "frm": frm, "id": dataset_id, **extra},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if got is None:
        raise CatalogueError(f"This listing is no longer {frm.replace('_', ' ')}.")


async def withdraw_dataset(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    """Take a listing off sale. Deals already agreed stand; buyers still
    negotiating are told."""
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id and claims.role != "platform_admin":
        raise CatalogueError("Only the dataset's owner or operations withdraws it.")
    reason = (reason or "").strip()
    if not reason:
        raise CatalogueError("Say why it is being withdrawn.")
    await _move(session, dataset_id, "published", "withdrawn", {"withdrawn_reason": reason})
    # A public request (db/440) has no buyer organisation to ring: its visitor
    # hears from the seller by email, and the request stays open for that.
    buyers = (
        await session.execute(
            text(
                "SELECT id, buyer_org_id, status FROM datahub_dataset_deal "
                "WHERE dataset_id = :d AND status <> ALL(ARRAY['declined', 'withdrawn']) "
                "  AND buyer_org_id IS NOT NULL"
            ),
            {"d": dataset_id},
        )
    ).mappings().all()
    for k in buyers:
        settled = k["status"] in AGREED_DEAL
        await notifier.notify(
            session,
            k["buyer_org_id"],
            f"{m['title']} is no longer on sale ({reason})."
            + (" Your agreed deal stands." if settled else ""),
            "catalogue_deal",
            {"id": str(k["id"])},
        )
    await audit.log(
        session,
        "catalogue.dataset.withdrawn",
        f"Withdrew {m['title']} from sale: {reason}",
        [dataset_id, m["owner_org_id"]],
    )
    return await dataset_detail(session, claims, dataset_id)


# ---------------------------------------------------------------------------
# Review — operations
# ---------------------------------------------------------------------------


async def review_queue(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        (
            await session.execute(
                text(
                    f"SELECT {_DATASET_COLUMNS} FROM datahub_dataset d "
                    "WHERE d.status IN ('in_review', 'published', 'rejected') "
                    "ORDER BY (d.status = 'in_review') DESC, d.submitted_at DESC NULLS LAST"
                )
            )
        )
        .mappings()
        .all()
    )
    return [_dataset(m, claims) for m in rows]


async def approve(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """Publish: from here what the listing says, its count included, is what
    buyers read and is fixed."""
    m = await _dataset_row(session, dataset_id)
    problems = await _readiness(session, m)
    if problems:
        raise CatalogueError(" ".join(problems))
    await _move(session, dataset_id, "in_review", "published", {"review_note": None})
    await notifier.notify(
        session,
        m["owner_org_id"],
        f"{m['title']} is published in DataHub.",
        "catalogue_listing",
        {"id": str(dataset_id)},
    )
    await audit.log(
        session,
        "catalogue.dataset.published",
        f"Published {m['title']}",
        [dataset_id, m["owner_org_id"]],
    )
    return await dataset_detail(session, claims, dataset_id)


async def reject(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, note: str
) -> dict[str, Any]:
    note = (note or "").strip()
    if not note:
        raise CatalogueError("Say what needs to change.")
    m = await _dataset_row(session, dataset_id)
    await _move(session, dataset_id, "in_review", "rejected", {"review_note": note})
    await notifier.notify(
        session,
        m["owner_org_id"],
        f"{m['title']} was sent back: {note}",
        "catalogue_listing",
        {"id": str(dataset_id)},
    )
    await audit.log(
        session,
        "catalogue.dataset.rejected",
        f"Sent {m['title']} back: {note}",
        [dataset_id, m["owner_org_id"]],
    )
    return await dataset_detail(session, claims, dataset_id)


# ---------------------------------------------------------------------------
# Deals — buyer and seller
# ---------------------------------------------------------------------------

_DEAL_SELECT = (
    "SELECT k.*, d.title AS dataset_title, d.slug AS dataset_slug, d.file_count, "
    "       coalesce(datahub_org_name(k.buyer_org_id), k.contact_company) AS buyer_name, "
    "       datahub_org_name(k.seller_org_id) AS seller_name, "
    "       (SELECT count(*) FROM datahub_deal_message g WHERE g.deal_id = k.id) AS message_count, "
    "       iv.id AS invoice_id, iv.reference_code AS invoice_reference, "
    "       iv.status::text AS invoice_status, iv.payment_reference AS invoice_payment_reference "
    "FROM datahub_dataset_deal k JOIN datahub_dataset d ON d.id = k.dataset_id "
    "LEFT JOIN invoice iv ON iv.deal_id = k.id "
)


def _side(m: Any, claims: AccessClaims) -> str:
    if m["buyer_org_id"] == claims.org_id:
        return "buyer"
    if m["seller_org_id"] == claims.org_id:
        return "seller"
    return "operations"


def _deal(m: Any, claims: AccessClaims) -> dict[str, Any]:
    return {
        "id": m["id"],
        "dataset_id": m["dataset_id"],
        "dataset_title": m["dataset_title"],
        "dataset_slug": m["dataset_slug"],
        "file_count": m["file_count"],
        "buyer_org_id": m["buyer_org_id"],
        "buyer_name": m["buyer_name"],
        "channel": m["channel"],
        "contact_name": m["contact_name"],
        "contact_email": m["contact_email"],
        "contact_company": m["contact_company"],
        "seller_org_id": m["seller_org_id"],
        "seller_name": m["seller_name"],
        "intended_use": m["intended_use"],
        "requested_uses": list(m["requested_uses"] or []),
        "requested_quantity": m["requested_quantity"],
        "message": m["message"],
        "status": m["status"],
        "quote_amount": _money(m["quote_amount"]),
        "currency": m["currency"],
        "quote_terms": m["quote_terms"],
        "quote_uses": list(m["quote_uses"] or []),
        "quote_quantity": m["quote_quantity"],
        "quoted_at": m["quoted_at"],
        "decided_at": m["decided_at"],
        "decision_note": m["decision_note"],
        "invoice_number": m["invoice_number"],
        "paid_at": m["paid_at"],
        "delivered_at": m["delivered_at"],
        "created_at": m["created_at"],
        "updated_at": m["updated_at"],
        "message_count": m["message_count"],
        # issued by the platform when the buyer accepts (db/450)
        "invoice_id": m["invoice_id"],
        "invoice_reference": m["invoice_reference"],
        "invoice_status": m["invoice_status"],
        "invoice_payment_reference": m["invoice_payment_reference"],
        "my_side": _side(m, claims),
    }


def _quantity(n: int | None, file_count: int | None) -> str:
    if n is None:
        return "the whole dataset" + (f" ({file_count:,} files)" if file_count else "")
    return f"{n:,} files"


async def _deal_row(session: AsyncSession, deal_id: uuid.UUID) -> Any:
    m = await _one(session, _DEAL_SELECT + "WHERE k.id = :id", {"id": deal_id})
    if m is None:
        raise LookupError("deal not found")
    return m


async def list_deals(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        (await session.execute(text(_DEAL_SELECT + "ORDER BY k.updated_at DESC LIMIT 500")))
        .mappings()
        .all()
    )
    return [_deal(m, claims) for m in rows]


async def get_deal(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID
) -> dict[str, Any]:
    return _deal(await _deal_row(session, deal_id), claims)


async def request_quote(
    session: AsyncSession,
    claims: AccessClaims,
    dataset_id: uuid.UUID,
    *,
    intended_use: str,
    requested_uses: list[str],
    requested_quantity: int | None,
    message: str | None,
) -> dict[str, Any]:
    m = await _dataset_row(session, dataset_id)
    if m["status"] != "published":
        raise CatalogueError("This dataset is not on sale.")
    if m["owner_org_id"] == claims.org_id:
        raise CatalogueError("You cannot buy your own dataset.")
    intended_use = (intended_use or "").strip()
    if not intended_use:
        raise CatalogueError("Say what you intend to use it for.")
    if requested_quantity is not None and m["file_count"] and requested_quantity > m["file_count"]:
        raise CatalogueError(f"This dataset holds {m['file_count']:,} files.")
    message = (message or "").strip() or None
    try:
        new_id = (
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset_deal (dataset_id, buyer_org_id, seller_org_id, "
                    "  requested_by, intended_use, requested_uses, requested_quantity, message) "
                    "VALUES (:d, :org, :org, :who, :use, :uses, :qty, :msg) RETURNING id"
                ),
                {
                    "d": dataset_id,
                    "org": claims.org_id,
                    "who": claims.user_id,
                    "use": intended_use,
                    "uses": list(requested_uses),
                    "qty": requested_quantity,
                    "msg": message,
                },
            )
        ).scalar_one()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    # The buyer's note opens the chat, so the conversation reads from the start.
    if message:
        await _append_message(session, claims, new_id, message)
    await notifier.notify(
        session,
        m["owner_org_id"],
        f"{claims.org_name} asked for a quote for {m['title']} "
        f"({_quantity(requested_quantity, m['file_count'])}).",
        "catalogue_deal",
        {"id": str(new_id)},
    )
    await audit.log(
        session,
        "catalogue.deal.requested",
        f"Asked for a quote for {m['title']}",
        [new_id, dataset_id, claims.org_id, m["owner_org_id"]],
    )
    return await get_deal(session, claims, new_id)


async def _deal_move(
    session: AsyncSession,
    deal_id: uuid.UUID,
    frm: tuple[str, ...],
    to: str,
    extra: dict[str, Any] | None = None,
) -> None:
    extra = extra or {}
    sets = ", ".join(["status = :to"] + [f"{k} = :{k}" for k in extra])
    try:
        got = (
            await session.execute(
                text(
                    f"UPDATE datahub_dataset_deal SET {sets} WHERE id = :id AND status = ANY(:frm) "
                    "RETURNING id"
                ),
                {"to": to, "frm": list(frm), "id": deal_id, **extra},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if got is None:
        raise CatalogueError("This deal has moved on; reload it.")


async def quote(
    session: AsyncSession,
    claims: AccessClaims,
    deal_id: uuid.UUID,
    *,
    amount: Decimal,
    currency: str,
    quantity: int | None,
    terms: str | None,
    uses: list[str],
) -> dict[str, Any]:
    k = await _deal_row(session, deal_id)
    if k["seller_org_id"] != claims.org_id:
        raise CatalogueError("Only the seller quotes.")
    if k["channel"] == "public":
        raise CatalogueError(
            "A request from the public page is answered by email; it cannot be quoted here."
        )
    if not uses:
        raise CatalogueError("Say which uses the quote covers.")
    if quantity is not None and k["file_count"] and quantity > k["file_count"]:
        raise CatalogueError(f"The dataset holds {k['file_count']:,} files.")
    await _deal_move(
        session,
        deal_id,
        OPEN_DEAL,
        "quoted",
        {
            "quote_amount": amount,
            "currency": currency.upper(),
            "quote_quantity": quantity,
            "quote_terms": (terms or "").strip() or None,
            "quote_uses": list(uses),
        },
    )
    what = _quantity(quantity, k["file_count"])
    await notifier.notify(
        session,
        k["buyer_org_id"],
        f"{k['seller_name']} quoted {currency.upper()} {amount:,.2f} for {what} of {k['dataset_title']}.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    await audit.log(
        session,
        "catalogue.deal.quoted",
        f"Quoted {currency.upper()} {amount:,.2f} for {what} of {k['dataset_title']}",
        [deal_id, k["dataset_id"], k["buyer_org_id"], k["seller_org_id"]],
    )
    return await get_deal(session, claims, deal_id)


async def decline(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID, note: str | None
) -> dict[str, Any]:
    k = await _deal_row(session, deal_id)
    if k["seller_org_id"] != claims.org_id:
        raise CatalogueError("Only the seller declines a quote request.")
    await _deal_move(
        session,
        deal_id,
        OPEN_DEAL,
        "declined",
        {"decision_note": (note or "").strip() or None},
    )
    # A public request has nobody on the platform to tell: closing it is the
    # seller's own record.
    if k["buyer_org_id"] is not None:
        await notifier.notify(
            session,
            k["buyer_org_id"],
            f"{k['seller_name']} declined your quote request for {k['dataset_title']}"
            + (f": {note.strip()}" if note and note.strip() else "."),
            "catalogue_deal",
            {"id": str(deal_id)},
        )
    await audit.log(
        session,
        "catalogue.deal.declined",
        f"Declined a quote request for {k['dataset_title']}",
        [x for x in (deal_id, k["dataset_id"], k["buyer_org_id"], k["seller_org_id"]) if x],
    )
    return await get_deal(session, claims, deal_id)


async def withdraw_request(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID
) -> dict[str, Any]:
    k = await _deal_row(session, deal_id)
    if k["buyer_org_id"] != claims.org_id:
        raise CatalogueError("Only the buyer withdraws a quote request.")
    await _deal_move(session, deal_id, OPEN_DEAL, "withdrawn")
    await notifier.notify(
        session,
        k["seller_org_id"],
        f"{k['buyer_name']} withdrew its quote request for {k['dataset_title']}.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    return await get_deal(session, claims, deal_id)


async def accept(session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID) -> dict[str, Any]:
    """The buyer accepts the quote as given. From here its terms are fixed:
    the accepted deal is the agreement."""
    k = await _deal_row(session, deal_id)
    if k["buyer_org_id"] != claims.org_id:
        raise CatalogueError("Only the buyer accepts a quote.")
    await _deal_move(session, deal_id, ("quoted",), "accepted")
    await notifier.notify(
        session,
        k["seller_org_id"],
        f"{k['buyer_name']} accepted your quote for {k['dataset_title']}. The platform has invoiced "
        "them; acknowledge the payment once it arrives, then mark the deal delivered.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    await audit.log(
        session,
        "catalogue.deal.accepted",
        f"Accepted the quote for {k['dataset_title']} ({k['currency']} {_money(k['quote_amount'])}, "
        f"{_quantity(k['quote_quantity'], k['file_count'])})",
        [deal_id, k["dataset_id"], k["buyer_org_id"], k["seller_org_id"]],
    )
    return await get_deal(session, claims, deal_id)


async def mark_delivered(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID
) -> dict[str, Any]:
    """The seller says it has handed the files over, outside the platform."""
    k = await _deal_row(session, deal_id)
    if k["seller_org_id"] != claims.org_id:
        raise CatalogueError("Only the seller marks a deal delivered.")
    await _deal_move(session, deal_id, ("paid",), "delivered")
    await notifier.notify(
        session,
        k["buyer_org_id"],
        f"{k['seller_name']} says the files for {k['dataset_title']} have been delivered to you.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    await audit.log(
        session,
        "catalogue.deal.delivered",
        f"Marked the deal for {k['dataset_title']} delivered",
        [deal_id, k["dataset_id"], k["buyer_org_id"], k["seller_org_id"]],
    )
    return await get_deal(session, claims, deal_id)


# ---------------------------------------------------------------------------
# The deal's chat
# ---------------------------------------------------------------------------


def _clean_message(body: str | None) -> str:
    s = (body or "").strip()
    if not s:
        raise CatalogueError("Write a message first.")
    if len(s) > MAX_MESSAGE:
        raise CatalogueError(f"A message is at most {MAX_MESSAGE} characters.")
    return s


async def _append_message(
    session: AsyncSession,
    claims: AccessClaims,
    deal_id: uuid.UUID,
    body: str,
    emailed_to: str | None = None,
) -> dict[str, Any]:
    # Serialise on a name rather than a row: under RLS a FOR UPDATE needs the
    # deal's UPDATE policy, which the chat should not depend on.
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"), {"k": f"datahub-deal:{deal_id}"}
    )
    seq = (
        await session.execute(
            text("SELECT coalesce(max(seq), 0) + 1 FROM datahub_deal_message WHERE deal_id = :d"),
            {"d": deal_id},
        )
    ).scalar_one()
    if seq > MAX_MESSAGES_PER_DEAL:
        raise CatalogueError(f"This conversation has reached its limit of {MAX_MESSAGES_PER_DEAL} messages.")
    try:
        row = (
            (
                await session.execute(
                    text(
                        "INSERT INTO datahub_deal_message "
                        "  (deal_id, seq, sender_org_id, sender_user_id, sender_name, body, emailed_to) "
                        "VALUES (:d, :seq, :org, :user, "
                        "        coalesce(nullif(:name, ''), "
                        "                 (SELECT full_name FROM app_user WHERE id = :user), 'Someone'), "
                        "        :body, :emailed_to) "
                        "RETURNING id, seq, sender_org_id, sender_name, body, emailed_to, created_at"
                    ),
                    {
                        "d": deal_id,
                        "seq": seq,
                        "org": claims.org_id,
                        "user": claims.user_id,
                        "name": claims.full_name or "",
                        "body": body,
                        "emailed_to": emailed_to,
                    },
                )
            )
            .mappings()
            .one()
        )
    except DBAPIError:
        raise CatalogueError("Only the buyer and the seller write here, while the deal is open.") from None
    return _message(row, claims)


def _message(m: Any, claims: AccessClaims) -> dict[str, Any]:
    keys = set(m.keys())
    return {
        "id": m["id"],
        "seq": m["seq"],
        "sender_org_id": m["sender_org_id"],
        "sender_name": m["sender_name"],
        "body": m["body"],
        "emailed_to": m["emailed_to"],
        # db/480: what became of the e-mail a public reply is — queued, sent or
        # failed with the reason — read from the outbox; None for a message
        # that was never mailed, or whose record has been purged.
        "email_status": m["email_status"] if "email_status" in keys else None,
        "email_reason": m["email_reason"] if "email_reason" in keys else None,
        "created_at": m["created_at"],
        "mine": m["sender_org_id"] == claims.org_id,
    }


async def list_messages(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID
) -> list[dict[str, Any]]:
    """The whole conversation, oldest first. RLS answers for the deal: a
    deal the caller cannot see has no messages for it either."""
    await _deal_row(session, deal_id)
    rows = (
        (
            await session.execute(
                text(
                    "SELECT m.id, m.seq, m.sender_org_id, m.sender_name, m.body, m.emailed_to, "
                    "       m.created_at, ms.state AS email_status, ms.reason AS email_reason "
                    "FROM datahub_deal_message m "
                    "LEFT JOIN LATERAL mail_status('datahub_deal_message', m.id) ms ON true "
                    "WHERE m.deal_id = :d ORDER BY m.seq"
                ),
                {"d": deal_id},
            )
        )
        .mappings()
        .all()
    )
    return [_message(r, claims) for r in rows]


async def post_message(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID, body: str
) -> dict[str, Any]:
    """Append one message and tell the other side. No audit line of its own:
    the row is the record. On a public request the other side has no
    account: the message is emailed to them instead, Reply-To the seller."""
    body = _clean_message(body)
    k = await _deal_row(session, deal_id)
    side = _side(k, claims)
    if side == "operations":
        raise CatalogueError("Operations read the conversation and do not post in it.")
    if k["status"] in ("declined", "withdrawn"):
        raise CatalogueError("This deal is closed; the conversation is read-only.")
    if k["channel"] == "public":
        return await _email_public_reply(session, claims, k, body)
    msg = await _append_message(session, claims, deal_id, body)
    other = k["seller_org_id"] if side == "buyer" else k["buyer_org_id"]
    excerpt = body if len(body) <= 80 else body[:79] + "…"
    await notifier.notify(
        session,
        other,
        f"{claims.org_name} on {k['dataset_title']}: {excerpt}",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    return msg


async def _email_public_reply(
    session: AsyncSession, claims: AccessClaims, k: Any, body: str
) -> dict[str, Any]:
    """The seller answers a request from the public page. The platform emails
    it with Reply-To the seller's own address, so whatever the person writes
    back reaches the seller directly. The mail is queued in this transaction
    (db/480 mail_outbox) and leaves within seconds; the thread shows whether it
    did (email_status), and Ops can re-send a failed one."""
    from sourcehub.config import settings
    from sourcehub.modules.outbox import service as outbox

    msg = await _append_message(session, claims, k["id"], body, emailed_to=k["contact_email"])
    base = settings.app_base_url.rstrip("/")
    await outbox.enqueue_to(
        session, "public_reply",
        {
            "body": body, "sender_name": claims.full_name, "org_name": claims.org_name,
            "dataset_title": k["dataset_title"],
            "dataset_url": f"{base}/datahub/public/{k['dataset_slug']}",
        },
        to_email=k["contact_email"], to_name=k["contact_name"] or "",
        entity=("datahub_deal_message", msg["id"]),
        label=f"DataHub reply · {k['dataset_title']}",
        reply_to=formataddr((f"{claims.full_name}, {claims.org_name}", claims.email)),
    )
    msg["email_status"] = "queued"
    msg["email_reason"] = None
    await audit.log(
        session,
        "catalogue.deal.emailed",
        f"Replied by email to a quote request on {k['dataset_title']}",
        [k["id"], k["dataset_id"], claims.org_id],
    )
    return msg


# ---------------------------------------------------------------------------
# The public catalogue — no session
# ---------------------------------------------------------------------------


async def public_list() -> list[dict[str, Any]]:
    async with anonymous_session() as s:
        rows = (await s.execute(text("SELECT * FROM datahub_public_list()"))).mappings().all()
    return [
        {
            "slug": r["slug"],
            "title": r["title"],
            "summary": r["summary"],
            "category": r["category"],
            "use_cases": list(r["use_cases"] or []),
            "regions": list(r["regions"] or []),
            "languages": list(r["languages"] or []),
            "permitted_uses": list(r["permitted_uses"] or []),
            "indicative_price_text": r["indicative_price_text"],
            "seller_name": r["seller_name"],
            "file_count": r["file_count"],
            "total_bytes": r["total_bytes"],
            "sample_count": r["sample_count"],
            "published_at": r["published_at"],
        }
        for r in rows
    ]


async def public_dataset(slug: str) -> dict[str, Any]:
    """One published listing and its samples, signed for viewing. The
    storage key the function returns is used here and goes no further."""
    async with anonymous_session() as s:
        d = (
            (await s.execute(text("SELECT * FROM datahub_public_dataset(:s)"), {"s": slug}))
            .mappings()
            .one_or_none()
        )
        if d is None:
            raise LookupError("dataset not found")
        samples = (
            (await s.execute(text("SELECT * FROM datahub_public_samples(:s)"), {"s": slug}))
            .mappings()
            .all()
        )
    target = storage.platform_target()
    out_samples = []
    for i in samples:
        out_samples.append(
            {
                "id": i["id"],
                "filename": i["filename"],
                "mime_type": i["mime_type"],
                "size_bytes": i["size_bytes"],
                "url": await storage.presign_get(
                    target, i["storage_key"], i["filename"], inline=True
                ),
            }
        )
    return {
        "slug": d["slug"],
        "title": d["title"],
        "summary": d["summary"],
        "description": d["description"],
        "category": d["category"],
        "use_cases": list(d["use_cases"] or []),
        "regions": list(d["regions"] or []),
        "languages": list(d["languages"] or []),
        "permitted_uses": list(d["permitted_uses"] or []),
        "licence_terms": d["licence_terms"],
        "indicative_price_text": d["indicative_price_text"],
        "seller_name": d["seller_name"],
        "source": d["source"],
        "file_count": d["file_count"],
        "total_bytes": d["total_bytes"],
        "published_at": d["published_at"],
        "samples": out_samples,
    }


async def create_lead(
    slug: str, *, name: str, email: str, company: str, intended_use: str, message: str | None
) -> None:
    """A quote request from someone with no account. It opens a public deal
    the listing's seller answers by email from the console (db/440)."""
    async with anonymous_session() as s:
        try:
            got = (
                await s.execute(
                    text("SELECT datahub_public_request_create(:slug, :n, :e, :c, :u, :m)"),
                    {
                        "slug": slug,
                        "n": name,
                        "e": email,
                        "c": company,
                        "u": intended_use,
                        "m": message,
                    },
                )
            ).scalar_one()
        except DBAPIError:
            raise CatalogueError("Check the details and try again.") from None
    if got is None:
        raise LookupError("dataset not found")


# ---------------------------------------------------------------------------
# Relisting a delivered contract
# ---------------------------------------------------------------------------


async def relist_contract(
    session: AsyncSession, claims: AccessClaims, contract_id: uuid.UUID
) -> uuid.UUID:
    """The partner's choice, once the client has approved a delivery whose
    request was not exclusive. Opens the partner's draft listing, counting
    the contract's accepted captures (a retake replaces what it retook). No
    file is copied: the partner picks some captures as samples next, and
    hands over what it sells itself. The workers are not asked (db/400).
    Asking again refreshes a draft's count and returns the same listing.

    Returns the dataset id.
    """
    req = await _one(
        session,
        "SELECT r.title, r.category, r.countries, c.reference_code, c.status, "
        "       coalesce((r.consent_and_compliance ->> 'partner_reuse_allowed')::boolean, false) "
        "         AS partner_reuse_allowed "
        "FROM contract c JOIN request r ON r.id = c.request_id "
        "WHERE c.id = :c AND c.partner_org_id = :org AND c.deleted_at IS NULL",
        {"c": contract_id, "org": claims.org_id},
    )
    if req is None:
        raise LookupError("contract not found")
    if not req["partner_reuse_allowed"]:
        raise CatalogueError("This request was exclusive to the client; its captures cannot be listed.")
    if req["status"] != "completed":
        raise CatalogueError("A contract's captures can be listed once the client has approved the delivery.")

    counted = await _one(
        session,
        "SELECT count(*)::integer AS n, sum(size_bytes) AS bytes FROM datahub_relist_candidates(:c)",
        {"c": contract_id},
    )
    existing = await _one(
        session, "SELECT id, status FROM datahub_dataset WHERE contract_id = :c", {"c": contract_id}
    )
    if existing is not None:
        if existing["status"] == "draft":
            await session.execute(
                text("UPDATE datahub_dataset SET file_count = :n, total_bytes = :b WHERE id = :d"),
                {"n": counted["n"], "b": counted["bytes"], "d": existing["id"]},
            )
        # In review, on sale or withdrawn: listing again changes nothing.
        return existing["id"]

    ds = (
        await session.execute(
            text(
                "INSERT INTO datahub_dataset (owner_org_id, source, contract_id, slug, title, category, "
                "  regions, file_count, total_bytes, created_by) "
                "VALUES (:org, 'contract', :c, :slug, :title, :cat, :regions, :n, :b, :who) "
                "RETURNING id"
            ),
            {
                "org": claims.org_id,
                "c": contract_id,
                "slug": slugify(req["title"]),
                "title": f"{req['title']} ({req['reference_code']})",
                "cat": req["category"],
                "regions": list(req["countries"] or []),
                "n": counted["n"],
                "b": counted["bytes"],
                "who": claims.user_id,
            },
        )
    ).scalar_one()
    await notifier.notify(
        session,
        claims.org_id,
        f"{req['reference_code']} is a draft listing of {counted['n']:,} files. Pick a few captures "
        "as samples, describe it and submit it for review.",
        "catalogue_listing",
        {"id": str(ds)},
    )
    await audit.log(
        session,
        "catalogue.relisted",
        f"Listed {req['reference_code']} as a draft: {counted['n']} files",
        [ds, contract_id, claims.org_id],
        {"file_count": counted["n"]},
    )
    return ds
