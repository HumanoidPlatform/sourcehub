"""catalogue — datasets for sale, and what selling one involves.

Business rules, and the ONLY public surface of this module.

Beside the RFP marketplace, where a client orders data that does not exist
yet, the catalogue sells data that does (db/350; research in
docs/research/data-marketplace/). Two ways a dataset comes to exist:

  * its owner uploads it — a delivery partner's or an aggregator's own data,
    or a client's exclusive data it now wants to sell;
  * a contract whose request was not exclusive is delivered, and the
    delivery partner gets a draft holding copies of the accepted captures
    whose workers had accepted the resale notice before capturing them.

Either way the owner describes it, picks the sample files the public will
see, and submits it; operations publish it or send it back. A buyer asks for
a quote, the seller quotes, the buyer accepts, and a licence is issued
awaiting payment; the seller marks the invoice paid and the buyer can then
download every file of the version it licensed.

What the database guarantees, so this module cannot get it wrong
(db/350): only operations publish or reject; a final version's files cannot
change except to be withdrawn; a deal's seller and a licence's every term
come from the listing and the accepted quote, never from the caller; and the
transition triggers allow each move to one party only. Moves here are one
conditional UPDATE each, and a trigger's refusal leaves as a CatalogueError.

Files live in SourceHub's own storage (platform_target), never a client's
bucket: relisted captures are copies, made by the sweep (catalogue.sweep).
"""

from __future__ import annotations

import csv
import io
import json
import re
import secrets
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.db.session import anonymous_session
from sourcehub.modules.audit import service as audit
from sourcehub.modules.notify import service as notifier
from sourcehub.platform import storage


class CatalogueError(Exception):
    pass


# The notice version from which the worker privacy notice says captures may
# be resold in the catalogue (mobile/src/consent.ts PRIVACY_NOTICE_VERSION).
RESALE_NOTICE_VERSION = 2
NOTICE_DOCUMENTS = frozenset({"worker_privacy_notice"})

SELLER_KINDS = frozenset({"tenant", "aggregator", "client"})
MAX_UPLOADS_PER_CALL = 200
MAX_SAMPLES = 50


# ---------------------------------------------------------------------------
# Shapes
# ---------------------------------------------------------------------------


def _money(value: Any) -> str | None:
    return None if value is None else f"{Decimal(str(value)):.2f}"


def _reason(e: DBAPIError) -> str:
    """The trigger's own sentence, without the driver's framing."""
    msg = str(getattr(e, "orig", e))
    for prefix in (
        "dataset licence",
        "dataset deal",
        "dataset version",
        "dataset item",
        "dataset ",
    ):
        at = msg.find(prefix)
        if at >= 0:
            line = msg[at:].split("\n", 1)[0].strip()
            # "dataset <uuid>: …" reads better without the id
            return re.sub(r"^dataset (deal |licence )?[0-9a-f-]{36}: ", "", line)
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
    "d.indicative_price_text, d.status, d.submitted_at, d.review_note, d.reviewed_at, "
    "d.published_at, d.withdrawn_at, d.withdrawn_reason, d.created_at, d.updated_at, "
    "o.name AS owner_name"
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


def _version(m: Any) -> dict[str, Any]:
    return {
        "id": m["id"],
        "number": m["number"],
        "status": m["status"],
        "item_count": m["item_count"],
        "total_bytes": m["total_bytes"],
        "notes": m["notes"],
        "finalized_at": m["finalized_at"],
    }


def _item(m: Any, *, owner_view: bool) -> dict[str, Any]:
    out = {
        "id": m["id"],
        "version_id": m["version_id"],
        "filename": m["filename"],
        "mime_type": m["mime_type"],
        "size_bytes": m["size_bytes"],
        "sha256": m["sha256"],
        "is_sample": m["is_sample"],
        "captured_at": m["captured_at"],
        "withdrawn_at": m["withdrawn_at"],
        "withdrawn_reason": m["withdrawn_reason"],
    }
    if owner_view:
        out.update({"copy_status": m["copy_status"], "copy_error": m["copy_error"]})
    return out


async def _one(session: AsyncSession, sql: str, params: dict[str, Any]) -> Any:
    return (await session.execute(text(sql), params)).mappings().one_or_none()


async def _dataset_row(session: AsyncSession, dataset_id: uuid.UUID) -> Any:
    m = await _one(
        session,
        f"SELECT {_DATASET_COLUMNS} FROM datahub_dataset d "
        "JOIN organisation o ON o.id = d.owner_org_id WHERE d.id = :id",
        {"id": dataset_id},
    )
    if m is None:
        raise LookupError("dataset not found")
    return m


async def _open_version(session: AsyncSession, dataset_id: uuid.UUID) -> Any:
    v = await _one(
        session,
        "SELECT * FROM datahub_dataset_version WHERE dataset_id = :id AND status = 'open' "
        "ORDER BY number DESC LIMIT 1",
        {"id": dataset_id},
    )
    if v is None:
        raise CatalogueError("This dataset has no open version to change.")
    return v


async def _latest_final(session: AsyncSession, dataset_id: uuid.UUID) -> Any:
    return await _one(
        session,
        "SELECT * FROM datahub_dataset_version WHERE dataset_id = :id AND status = 'final' "
        "ORDER BY number DESC LIMIT 1",
        {"id": dataset_id},
    )


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
    signed-in organisation; the latest final version gives the size."""
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
                    f"SELECT {_DATASET_COLUMNS}, v.number AS version_number, v.item_count, "
                    "       v.total_bytes, "
                    "       (SELECT count(*) FROM datahub_dataset_item i WHERE i.version_id = v.id "
                    "          AND i.is_sample AND i.withdrawn_at IS NULL) AS sample_count "
                    "FROM datahub_dataset d JOIN organisation o ON o.id = d.owner_org_id "
                    "JOIN LATERAL (SELECT * FROM datahub_dataset_version v WHERE v.dataset_id = d.id "
                    "              AND v.status = 'final' ORDER BY v.number DESC LIMIT 1) v ON true "
                    f"WHERE {' AND '.join(where)} ORDER BY d.published_at DESC"
                ),
                params,
            )
        )
        .mappings()
        .all()
    )
    out = []
    for m in rows:
        d = _dataset(m, claims)
        d.update(
            {
                "version_number": m["version_number"],
                "item_count": m["item_count"],
                "total_bytes": m["total_bytes"],
                "sample_count": m["sample_count"],
            }
        )
        out.append(d)
    return out


async def _evidence(session: AsyncSession, version_id: uuid.UUID, source: str) -> dict[str, Any]:
    """What can be said about how the files were made, from what is recorded.

    Relisted captures carry their capture time and the device checks from the
    phone; every one passed the aggregator's and the partner's review (only
    'ready' captures are relisted) and every one's worker had accepted the
    resale notice before capturing it (datahub_relist_candidates). Nothing is
    claimed about the people shown in them: no consent from them is recorded.
    """
    m = await _one(
        session,
        "SELECT count(*) AS n, min(captured_at) AS first, max(captured_at) AS last, "
        "       count(*) FILTER (WHERE check_summary <> '{}'::jsonb) AS with_checks "
        "FROM datahub_dataset_item WHERE version_id = :v AND withdrawn_at IS NULL",
        {"v": version_id},
    )
    relisted = source == "contract"
    return {
        "source": source,
        "captured_from": m["first"] if m else None,
        "captured_to": m["last"] if m else None,
        "with_device_checks": int(m["with_checks"]) if m else 0,
        "passed_review": relisted,
        "capturer_resale_consent": relisted,
        "people_in_frame_consent": None,
    }


async def dataset_detail(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """A listing as the caller may see it. RLS decides which files: the owner
    and operations see every one; a buyer with an active licence sees its
    version's; everyone else, the samples of what is on sale."""
    m = await _dataset_row(session, dataset_id)
    d = _dataset(m, claims)
    owner_view = d["is_owner"] or claims.role == "platform_admin"
    versions = (
        (
            await session.execute(
                text("SELECT * FROM datahub_dataset_version WHERE dataset_id = :id ORDER BY number"),
                {"id": dataset_id},
            )
        )
        .mappings()
        .all()
    )
    d["versions"] = [_version(v) for v in versions]
    current = versions[-1] if versions else None
    if current is not None:
        items = (
            (
                await session.execute(
                    text(
                        "SELECT * FROM datahub_dataset_item WHERE version_id = :v "
                        "ORDER BY is_sample DESC, filename"
                    ),
                    {"v": current["id"]},
                )
            )
            .mappings()
            .all()
        )
        d["items"] = [_item(i, owner_view=owner_view) for i in items]
        d["evidence"] = await _evidence(session, current["id"], m["source"])
    else:
        d["items"], d["evidence"] = [], None
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
)


async def my_datasets(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        (
            await session.execute(
                text(
                    f"SELECT {_DATASET_COLUMNS}, "
                    "  (SELECT count(*) FROM datahub_dataset_item i WHERE i.dataset_id = d.id "
                    "     AND i.copy_status = 'pending') AS pending_copies, "
                    "  (SELECT count(*) FROM datahub_dataset_deal k WHERE k.dataset_id = d.id "
                    "     AND k.status = 'requested') AS open_requests "
                    "FROM datahub_dataset d JOIN organisation o ON o.id = d.owner_org_id "
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
        raise CatalogueError("Delivery partners, aggregators and clients list datasets.")
    title = (fields.get("title") or "").strip()
    if not title:
        raise CatalogueError("Give the dataset a title.")
    values = {k: fields.get(k) for k in _EDITABLE}
    values["title"] = title
    for k in ("use_cases", "regions", "languages", "permitted_uses"):
        values[k] = list(values[k] or [])
    try:
        m = (
            (
                await session.execute(
                    text(
                        "INSERT INTO datahub_dataset (owner_org_id, source, slug, title, summary, description, "
                        "  category, use_cases, regions, languages, permitted_uses, licence_terms, "
                        "  indicative_price_text, created_by) "
                        "VALUES (:org, 'upload', :slug, :title, :summary, :description, "
                        "  CAST(:category AS request_category), :use_cases, :regions, :languages, "
                        "  :permitted_uses, :licence_terms, :indicative_price_text, :who) "
                        "RETURNING id"
                    ),
                    {**values, "org": claims.org_id, "slug": slugify(title), "who": claims.user_id},
                )
            )
            .mappings()
            .one()
        )
        await session.execute(
            text(
                "INSERT INTO datahub_dataset_version (dataset_id, owner_org_id, number) "
                "VALUES (:d, :org, 1)"
            ),
            {"d": m["id"], "org": claims.org_id},
        )
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    await audit.log(
        session,
        "catalogue.dataset.created",
        f"Started a dataset listing: {title}",
        [m["id"], claims.org_id],
    )
    return await dataset_detail(session, claims, m["id"])


async def update_dataset(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, fields: dict[str, Any]
) -> dict[str, Any]:
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner edits it.")
    sets, params = [], {"id": dataset_id}
    for k in _EDITABLE:
        if k not in fields:
            continue
        v = fields[k]
        if k == "title":
            v = (v or "").strip()
            if not v:
                raise CatalogueError("A dataset needs a title.")
        if k in ("use_cases", "regions", "languages", "permitted_uses"):
            v = list(v or [])
        sets.append(f"{k} = CAST(:{k} AS request_category)" if k == "category" else f"{k} = :{k}")
        params[k] = v
    if not sets:
        return await dataset_detail(session, claims, dataset_id)
    try:
        await session.execute(text(f"UPDATE datahub_dataset SET {', '.join(sets)} WHERE id = :id"), params)
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    return await dataset_detail(session, claims, dataset_id)


async def upload_urls(
    session: AsyncSession,
    claims: AccessClaims,
    dataset_id: uuid.UUID,
    files: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Signed PUTs into platform storage, one per file. Nothing is recorded
    until confirm_uploads: a URL handed out and never used leaves no row."""
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner adds files.")
    if not files:
        return []
    if len(files) > MAX_UPLOADS_PER_CALL:
        raise CatalogueError(f"Send at most {MAX_UPLOADS_PER_CALL} files at a time.")
    v = await _open_version(session, dataset_id)
    target = storage.platform_target()
    out = []
    for f in files:
        name = _safe_filename(str(f.get("filename") or ""))
        key = f"catalogue/{dataset_id}/v{v['number']}/{uuid.uuid4().hex[:12]}-{name}"
        url, headers = await storage.presign_put(target, key)
        out.append({"filename": name, "key": key, "url": url, "headers": headers})
    return out


async def confirm_uploads(
    session: AsyncSession,
    claims: AccessClaims,
    dataset_id: uuid.UUID,
    uploads: list[dict[str, Any]],
) -> dict[str, Any]:
    """Record files the browser has put. The size comes from storage, never
    the caller; a key outside this dataset's open version is refused."""
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner adds files.")
    v = await _open_version(session, dataset_id)
    prefix = f"catalogue/{dataset_id}/v{v['number']}/"
    target = storage.platform_target()
    for u in uploads:
        key = str(u.get("key") or "")
        if not key.startswith(prefix) or ".." in key:
            raise CatalogueError("That file does not belong to this dataset.")
        try:
            size, content_type = await storage.stat(target, key)
        except LookupError:
            raise CatalogueError(f"{u.get('filename') or key} was not uploaded.") from None
        sha = str(u.get("sha256") or "").lower() or None
        if sha is not None and not re.fullmatch(r"[0-9a-f]{64}", sha):
            sha = None
        try:
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset_item (version_id, dataset_id, owner_org_id, storage_key, "
                    "  filename, mime_type, size_bytes, sha256) "
                    "VALUES (:v, :d, :org, :key, :name, :mime, :size, :sha) "
                    "ON CONFLICT (version_id, storage_key) DO NOTHING"
                ),
                {
                    "v": v["id"],
                    "d": dataset_id,
                    "org": claims.org_id,
                    "key": key,
                    "name": _safe_filename(str(u.get("filename") or key.rsplit("/", 1)[-1])),
                    "mime": u.get("content_type") or content_type,
                    "size": size,
                    "sha": sha,
                },
            )
        except DBAPIError as e:
            raise CatalogueError(_reason(e)) from None
    return await dataset_detail(session, claims, dataset_id)


async def remove_item(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, item_id: uuid.UUID
) -> dict[str, Any]:
    """Take a file out of an open version. Its blob is left for the
    lifecycle rule, as attachments are: a delete cannot be undone."""
    try:
        gone = (
            await session.execute(
                text(
                    "DELETE FROM datahub_dataset_item WHERE id = :id AND dataset_id = :d "
                    "AND owner_org_id = :org RETURNING id"
                ),
                {"id": item_id, "d": dataset_id, "org": claims.org_id},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if gone is None:
        raise LookupError("file not found")
    return await dataset_detail(session, claims, dataset_id)


async def retry_copies(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """Put every failed copy back in the sweep's queue."""
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner does that.")
    v = await _open_version(session, dataset_id)
    await session.execute(
        text(
            "UPDATE datahub_dataset_item SET copy_status = 'pending', copy_error = NULL "
            "WHERE version_id = :v AND copy_status = 'failed'"
        ),
        {"v": v["id"]},
    )
    return await dataset_detail(session, claims, dataset_id)


async def set_samples(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, item_ids: list[uuid.UUID]
) -> dict[str, Any]:
    """Exactly these files are the public samples. Only while the version is
    open: samples are part of what operations review."""
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner picks samples.")
    if len(item_ids) > MAX_SAMPLES:
        raise CatalogueError(f"Pick at most {MAX_SAMPLES} samples.")
    v = await _open_version(session, dataset_id)
    try:
        await session.execute(
            text(
                "UPDATE datahub_dataset_item SET is_sample = (id = ANY(:ids)) "
                "WHERE version_id = :v AND is_sample IS DISTINCT FROM (id = ANY(:ids))"
            ),
            {"ids": list(item_ids), "v": v["id"]},
        )
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    return await dataset_detail(session, claims, dataset_id)


async def _readiness(session: AsyncSession, m: Any, v: Any) -> list[str]:
    """What stops a listing going to review, as sentences."""
    problems = []
    if not (m["summary"] or "").strip():
        problems.append("Add a one-line summary.")
    if not m["permitted_uses"]:
        problems.append("Say what buyers may use it for.")
    if not (m["licence_terms"] or "").strip():
        problems.append("Add your licence terms.")
    c = await _one(
        session,
        "SELECT count(*) FILTER (WHERE copy_status = 'copied') AS ready, "
        "       count(*) FILTER (WHERE copy_status = 'pending') AS pending, "
        "       count(*) FILTER (WHERE copy_status = 'failed') AS failed, "
        "       count(*) FILTER (WHERE is_sample AND copy_status = 'copied') AS samples "
        "FROM datahub_dataset_item WHERE version_id = :v",
        {"v": v["id"]},
    )
    if c["pending"]:
        problems.append(f"{c['pending']} files are still being copied in.")
    if c["failed"]:
        problems.append(f"{c['failed']} files could not be copied; remove them first.")
    if not c["ready"]:
        problems.append("Add at least one file.")
    elif not c["samples"]:
        problems.append("Pick at least one sample file for the public page.")
    return problems


async def submit(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner submits it.")
    if m["status"] not in ("draft", "rejected"):
        raise CatalogueError(f"A {m['status'].replace('_', ' ')} listing cannot be submitted.")
    v = await _open_version(session, dataset_id)
    problems = await _readiness(session, m, v)
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
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id:
        raise CatalogueError("Only the dataset's owner does that.")
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


async def _licence_holders(session: AsyncSession, version_ids: list[uuid.UUID]) -> list[uuid.UUID]:
    return list(
        (
            await session.execute(
                text(
                    "SELECT DISTINCT buyer_org_id FROM datahub_dataset_licence "
                    "WHERE version_id = ANY(:v) AND status = 'active'"
                ),
                {"v": version_ids},
            )
        )
        .scalars()
        .all()
    )


async def withdraw_dataset(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    """Take a listing off sale. Buyers keep what they licensed: their
    licences and downloads are untouched, and they are told."""
    m = await _dataset_row(session, dataset_id)
    if m["owner_org_id"] != claims.org_id and claims.role != "platform_admin":
        raise CatalogueError("Only the dataset's owner or operations withdraws it.")
    reason = (reason or "").strip()
    if not reason:
        raise CatalogueError("Say why it is being withdrawn.")
    await _move(session, dataset_id, "published", "withdrawn", {"withdrawn_reason": reason})
    versions = list(
        (
            await session.execute(
                text("SELECT id FROM datahub_dataset_version WHERE dataset_id = :d"), {"d": dataset_id}
            )
        )
        .scalars()
        .all()
    )
    for org in await _licence_holders(session, versions):
        await notifier.notify(
            session,
            org,
            f"{m['title']} is no longer on sale ({reason}). Your licence is unaffected.",
            "catalogue_licences",
            {"dataset": str(dataset_id)},
        )
    await audit.log(
        session,
        "catalogue.dataset.withdrawn",
        f"Withdrew {m['title']} from sale: {reason}",
        [dataset_id, m["owner_org_id"]],
    )
    return await dataset_detail(session, claims, dataset_id)


async def withdraw_item(
    session: AsyncSession, claims: AccessClaims, item_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    """A file must come out of a version already sold — a person asked, or a
    problem was found. The row stays with its reason; every organisation
    holding an active licence on that version is told which file. What a
    buyer must then do with its copy is for the licence terms to say."""
    reason = (reason or "").strip()
    if not reason:
        raise CatalogueError("Say why the file is being withdrawn.")
    it = await _one(
        session,
        "SELECT i.*, d.title, d.owner_org_id AS d_owner FROM datahub_dataset_item i "
        "JOIN datahub_dataset d ON d.id = i.dataset_id WHERE i.id = :id",
        {"id": item_id},
    )
    if it is None:
        raise LookupError("file not found")
    if it["d_owner"] != claims.org_id and claims.role != "platform_admin":
        raise CatalogueError("Only the dataset's owner or operations withdraws a file.")
    try:
        got = (
            await session.execute(
                text(
                    "UPDATE datahub_dataset_item SET withdrawn_at = now(), withdrawn_reason = :why, "
                    "  withdrawn_by = :who WHERE id = :id AND withdrawn_at IS NULL RETURNING id"
                ),
                {"why": reason, "who": claims.user_id, "id": item_id},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if got is None:
        raise CatalogueError("That file is already withdrawn.")
    for org in await _licence_holders(session, [it["version_id"]]):
        await notifier.notify(
            session,
            org,
            f"{it['filename']} has been withdrawn from {it['title']}: {reason}. "
            "See your licence terms for what to do with your copy.",
            "catalogue_licences",
            {"dataset": str(it["dataset_id"])},
        )
    await audit.log(
        session,
        "catalogue.item.withdrawn",
        f"Withdrew {it['filename']} from {it['title']}: {reason}",
        [it["dataset_id"], it["d_owner"]],
    )
    return await dataset_detail(session, claims, it["dataset_id"])


# ---------------------------------------------------------------------------
# Review — operations
# ---------------------------------------------------------------------------


async def review_queue(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        (
            await session.execute(
                text(
                    f"SELECT {_DATASET_COLUMNS}, "
                    "  (SELECT count(*) FROM datahub_dataset_item i WHERE i.dataset_id = d.id) AS item_count "
                    "FROM datahub_dataset d JOIN organisation o ON o.id = d.owner_org_id "
                    "WHERE d.status IN ('in_review', 'published', 'rejected') "
                    "ORDER BY (d.status = 'in_review') DESC, d.submitted_at DESC NULLS LAST"
                )
            )
        )
        .mappings()
        .all()
    )
    out = []
    for m in rows:
        d = _dataset(m, claims)
        d["item_count"] = m["item_count"]
        out.append(d)
    return out


async def approve(
    session: AsyncSession, claims: AccessClaims, dataset_id: uuid.UUID
) -> dict[str, Any]:
    """Publish, and freeze the version: from here its files are what buyers
    are licensed to."""
    m = await _dataset_row(session, dataset_id)
    v = await _open_version(session, dataset_id)
    problems = await _readiness(session, m, v)
    if problems:
        raise CatalogueError(" ".join(problems))
    await _move(session, dataset_id, "in_review", "published", {"review_note": None})
    try:
        await session.execute(
            text(
                "UPDATE datahub_dataset_version SET status = 'final', finalized_at = now(), "
                "  item_count = (SELECT count(*) FROM datahub_dataset_item WHERE version_id = :v), "
                "  total_bytes = (SELECT coalesce(sum(size_bytes), 0) FROM datahub_dataset_item "
                "                 WHERE version_id = :v) "
                "WHERE id = :v AND status = 'open'"
            ),
            {"v": v["id"]},
        )
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    await notifier.notify(
        session,
        m["owner_org_id"],
        f"{m['title']} is published in the dataset catalogue.",
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


async def list_leads(session: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        (
            await session.execute(
                text(
                    "SELECT l.*, d.title AS dataset_title, d.slug AS dataset_slug "
                    "FROM datahub_lead l JOIN datahub_dataset d ON d.id = l.dataset_id "
                    "ORDER BY (l.status = 'new') DESC, l.created_at DESC LIMIT 500"
                )
            )
        )
        .mappings()
        .all()
    )
    return [dict(r) for r in rows]


async def set_lead_status(
    session: AsyncSession, claims: AccessClaims, lead_id: uuid.UUID, status: str
) -> dict[str, Any]:
    m = await _one(
        session,
        "UPDATE datahub_lead SET status = :s, handled_by = :who WHERE id = :id RETURNING *",
        {"s": status, "who": claims.user_id, "id": lead_id},
    )
    if m is None:
        raise LookupError("lead not found")
    return dict(m)


# ---------------------------------------------------------------------------
# Deals — buyer and seller
# ---------------------------------------------------------------------------

_DEAL_SELECT = (
    "SELECT k.*, d.title AS dataset_title, d.slug AS dataset_slug, v.number AS version_number, "
    "       b.name AS buyer_name, s.name AS seller_name, l.id AS licence_id, "
    "       l.status AS licence_status "
    "FROM datahub_dataset_deal k JOIN datahub_dataset d ON d.id = k.dataset_id "
    "JOIN datahub_dataset_version v ON v.id = k.version_id "
    "LEFT JOIN organisation b ON b.id = k.buyer_org_id "
    "LEFT JOIN organisation s ON s.id = k.seller_org_id "
    "LEFT JOIN datahub_dataset_licence l ON l.deal_id = k.id "
)


def _deal(m: Any, claims: AccessClaims) -> dict[str, Any]:
    return {
        "id": m["id"],
        "dataset_id": m["dataset_id"],
        "dataset_title": m["dataset_title"],
        "dataset_slug": m["dataset_slug"],
        "version_id": m["version_id"],
        "version_number": m["version_number"],
        "buyer_org_id": m["buyer_org_id"],
        "buyer_name": m["buyer_name"],
        "seller_org_id": m["seller_org_id"],
        "seller_name": m["seller_name"],
        "intended_use": m["intended_use"],
        "requested_uses": list(m["requested_uses"] or []),
        "message": m["message"],
        "status": m["status"],
        "quote_amount": _money(m["quote_amount"]),
        "currency": m["currency"],
        "quote_terms": m["quote_terms"],
        "quote_uses": list(m["quote_uses"] or []),
        "quoted_at": m["quoted_at"],
        "decided_at": m["decided_at"],
        "decision_note": m["decision_note"],
        "created_at": m["created_at"],
        "licence_id": m["licence_id"],
        "licence_status": m["licence_status"],
        "my_side": (
            "buyer"
            if m["buyer_org_id"] == claims.org_id
            else "seller"
            if m["seller_org_id"] == claims.org_id
            else "operations"
        ),
    }


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
    v = await _latest_final(session, dataset_id)
    if v is None:
        raise CatalogueError("This dataset is not on sale.")
    try:
        k = (
            (
                await session.execute(
                    text(
                        "INSERT INTO datahub_dataset_deal (dataset_id, version_id, buyer_org_id, seller_org_id, "
                        "  requested_by, intended_use, requested_uses, message) "
                        "VALUES (:d, :v, :org, :org, :who, :use, :uses, :msg) RETURNING id"
                    ),
                    {
                        "d": dataset_id,
                        "v": v["id"],
                        "org": claims.org_id,
                        "who": claims.user_id,
                        "use": intended_use,
                        "uses": list(requested_uses),
                        "msg": (message or "").strip() or None,
                    },
                )
            )
            .mappings()
            .one()
        )
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    await notifier.notify(
        session,
        m["owner_org_id"],
        f"{claims.org_name} asked for a quote for {m['title']}.",
        "catalogue_deal",
        {"id": str(k["id"])},
    )
    await audit.log(
        session,
        "catalogue.deal.requested",
        f"Asked for a quote for {m['title']}",
        [k["id"], dataset_id, claims.org_id, m["owner_org_id"]],
    )
    return await get_deal(session, claims, k["id"])


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
        raise CatalogueError("This quote has moved on; reload it.")


async def quote(
    session: AsyncSession,
    claims: AccessClaims,
    deal_id: uuid.UUID,
    *,
    amount: Decimal,
    currency: str,
    terms: str | None,
    uses: list[str],
) -> dict[str, Any]:
    k = await _deal_row(session, deal_id)
    if k["seller_org_id"] != claims.org_id:
        raise CatalogueError("Only the seller quotes.")
    if not uses:
        raise CatalogueError("Say which uses the quote covers.")
    await _deal_move(
        session,
        deal_id,
        ("requested", "quoted"),
        "quoted",
        {
            "quote_amount": amount,
            "currency": currency.upper(),
            "quote_terms": (terms or "").strip() or None,
            "quote_uses": list(uses),
        },
    )
    await notifier.notify(
        session,
        k["buyer_org_id"],
        f"{k['seller_name']} quoted {currency.upper()} {amount:,.2f} for {k['dataset_title']}.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    await audit.log(
        session,
        "catalogue.deal.quoted",
        f"Quoted {currency.upper()} {amount:,.2f} for {k['dataset_title']}",
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
        ("requested", "quoted"),
        "declined",
        {"decision_note": (note or "").strip() or None},
    )
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
        [deal_id, k["dataset_id"], k["buyer_org_id"], k["seller_org_id"]],
    )
    return await get_deal(session, claims, deal_id)


async def withdraw_request(
    session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID
) -> dict[str, Any]:
    k = await _deal_row(session, deal_id)
    if k["buyer_org_id"] != claims.org_id:
        raise CatalogueError("Only the buyer withdraws a quote request.")
    await _deal_move(session, deal_id, ("requested", "quoted"), "withdrawn")
    await notifier.notify(
        session,
        k["seller_org_id"],
        f"{k['buyer_name']} withdrew its quote request for {k['dataset_title']}.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    return await get_deal(session, claims, deal_id)


async def accept(session: AsyncSession, claims: AccessClaims, deal_id: uuid.UUID) -> dict[str, Any]:
    """The buyer accepts the quote as given; the licence is issued in the
    same transaction, its terms copied off the deal by the database."""
    k = await _deal_row(session, deal_id)
    if k["buyer_org_id"] != claims.org_id:
        raise CatalogueError("Only the buyer accepts a quote.")
    await _deal_move(session, deal_id, ("quoted",), "accepted")
    try:
        # Every column but deal_id is the trigger's to fill. The values here
        # only satisfy NOT NULL before it runs.
        await session.execute(
            text(
                "INSERT INTO datahub_dataset_licence (deal_id, dataset_id, version_id, buyer_org_id, "
                "  seller_org_id, amount, currency) "
                "VALUES (:k, :d, :v, :b, :s, 0, 'USD')"
            ),
            {
                "k": deal_id,
                "d": k["dataset_id"],
                "v": k["version_id"],
                "b": k["buyer_org_id"],
                "s": k["seller_org_id"],
            },
        )
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    await notifier.notify(
        session,
        k["seller_org_id"],
        f"{k['buyer_name']} accepted your quote for {k['dataset_title']}. Invoice them, and "
        "mark the licence paid when the money arrives.",
        "catalogue_deal",
        {"id": str(deal_id)},
    )
    await audit.log(
        session,
        "catalogue.deal.accepted",
        f"Accepted the quote for {k['dataset_title']} ({k['currency']} {_money(k['quote_amount'])})",
        [deal_id, k["dataset_id"], k["buyer_org_id"], k["seller_org_id"]],
    )
    return await get_deal(session, claims, deal_id)


# ---------------------------------------------------------------------------
# Licences
# ---------------------------------------------------------------------------

_LICENCE_SELECT = (
    "SELECT l.*, d.title AS dataset_title, d.slug AS dataset_slug, d.status AS dataset_status, "
    "       v.number AS version_number, v.item_count, v.total_bytes, "
    "       b.name AS buyer_name, s.name AS seller_name, "
    "       (SELECT count(*) FROM datahub_dataset_item i WHERE i.version_id = l.version_id "
    "          AND i.withdrawn_at IS NOT NULL) AS withdrawn_count "
    "FROM datahub_dataset_licence l JOIN datahub_dataset d ON d.id = l.dataset_id "
    "JOIN datahub_dataset_version v ON v.id = l.version_id "
    "LEFT JOIN organisation b ON b.id = l.buyer_org_id "
    "LEFT JOIN organisation s ON s.id = l.seller_org_id "
)


def _licence(m: Any, claims: AccessClaims) -> dict[str, Any]:
    return {
        "id": m["id"],
        "deal_id": m["deal_id"],
        "dataset_id": m["dataset_id"],
        "dataset_title": m["dataset_title"],
        "dataset_slug": m["dataset_slug"],
        "dataset_status": m["dataset_status"],
        "version_id": m["version_id"],
        "version_number": m["version_number"],
        "item_count": m["item_count"],
        "total_bytes": m["total_bytes"],
        "withdrawn_count": m["withdrawn_count"],
        "buyer_org_id": m["buyer_org_id"],
        "buyer_name": m["buyer_name"],
        "seller_org_id": m["seller_org_id"],
        "seller_name": m["seller_name"],
        "permitted_uses": list(m["permitted_uses"] or []),
        "terms_snapshot": m["terms_snapshot"],
        "amount": _money(m["amount"]),
        "currency": m["currency"],
        "status": m["status"],
        "invoice_number": m["invoice_number"],
        "paid_at": m["paid_at"],
        "revoked_at": m["revoked_at"],
        "revoked_reason": m["revoked_reason"],
        "issued_at": m["issued_at"],
        "my_side": (
            "buyer"
            if m["buyer_org_id"] == claims.org_id
            else "seller"
            if m["seller_org_id"] == claims.org_id
            else "operations"
        ),
    }


async def _licence_row(session: AsyncSession, licence_id: uuid.UUID) -> Any:
    m = await _one(session, _LICENCE_SELECT + "WHERE l.id = :id", {"id": licence_id})
    if m is None:
        raise LookupError("licence not found")
    return m


async def list_licences(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        (await session.execute(text(_LICENCE_SELECT + "ORDER BY l.issued_at DESC LIMIT 500")))
        .mappings()
        .all()
    )
    return [_licence(m, claims) for m in rows]


async def get_licence(
    session: AsyncSession, claims: AccessClaims, licence_id: uuid.UUID
) -> dict[str, Any]:
    out = _licence(await _licence_row(session, licence_id), claims)
    items = (
        (
            await session.execute(
                text(
                    "SELECT filename, withdrawn_at, withdrawn_reason FROM datahub_dataset_item "
                    "WHERE version_id = :v AND withdrawn_at IS NOT NULL ORDER BY withdrawn_at DESC"
                ),
                {"v": out["version_id"]},
            )
        )
        .mappings()
        .all()
    )
    out["withdrawn_items"] = [dict(i) for i in items]
    return out


async def mark_paid(
    session: AsyncSession, claims: AccessClaims, licence_id: uuid.UUID, invoice_number: str | None
) -> dict[str, Any]:
    """The seller says the buyer has paid. Downloads open from here."""
    m = await _licence_row(session, licence_id)
    if m["seller_org_id"] != claims.org_id:
        raise CatalogueError("Only the seller marks a licence paid.")
    try:
        got = (
            await session.execute(
                text(
                    "UPDATE datahub_dataset_licence SET status = 'active', invoice_number = :inv "
                    "WHERE id = :id AND status = 'awaiting_payment' RETURNING id"
                ),
                {"inv": (invoice_number or "").strip() or None, "id": licence_id},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if got is None:
        raise CatalogueError("This licence is not awaiting payment.")
    await notifier.notify(
        session,
        m["buyer_org_id"],
        f"Your licence for {m['dataset_title']} is active. The files are ready to download.",
        "catalogue_licences",
        {"id": str(licence_id)},
    )
    await audit.log(
        session,
        "catalogue.licence.paid",
        f"Marked the licence for {m['dataset_title']} paid"
        + (
            f" (invoice {invoice_number.strip()})"
            if invoice_number and invoice_number.strip()
            else ""
        ),
        [licence_id, m["dataset_id"], m["buyer_org_id"], m["seller_org_id"]],
    )
    return await get_licence(session, claims, licence_id)


async def revoke(
    session: AsyncSession, claims: AccessClaims, licence_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    reason = (reason or "").strip()
    if not reason:
        raise CatalogueError("Say why the licence is revoked.")
    m = await _licence_row(session, licence_id)
    if m["seller_org_id"] != claims.org_id and claims.role != "platform_admin":
        raise CatalogueError("Only the seller or operations revokes a licence.")
    try:
        got = (
            await session.execute(
                text(
                    "UPDATE datahub_dataset_licence SET status = 'revoked', revoked_reason = :why "
                    "WHERE id = :id AND status IN ('awaiting_payment', 'active') RETURNING id"
                ),
                {"why": reason, "id": licence_id},
            )
        ).scalar_one_or_none()
    except DBAPIError as e:
        raise CatalogueError(_reason(e)) from None
    if got is None:
        raise CatalogueError("This licence is already revoked.")
    await notifier.notify(
        session,
        m["buyer_org_id"],
        f"Your licence for {m['dataset_title']} was revoked: {reason}",
        "catalogue_licences",
        {"id": str(licence_id)},
    )
    await audit.log(
        session,
        "catalogue.licence.revoked",
        f"Revoked the licence for {m['dataset_title']}: {reason}",
        [licence_id, m["dataset_id"], m["buyer_org_id"], m["seller_org_id"]],
    )
    return await get_licence(session, claims, licence_id)


async def manifest_csv(session: AsyncSession, claims: AccessClaims, licence_id: uuid.UUID) -> str:
    """Every file of the licensed version: what it is, how to check it, and
    whether it has been withdrawn since. Readable only while the licence is
    active (or by the seller and operations) — RLS hides the files otherwise."""
    m = await _licence_row(session, licence_id)
    if m["buyer_org_id"] == claims.org_id and m["status"] != "active":
        raise CatalogueError("The files open once the seller has marked the licence paid.")
    rows = (
        (
            await session.execute(
                text(
                    "SELECT id, filename, mime_type, size_bytes, sha256, captured_at, withdrawn_at, "
                    "       withdrawn_reason FROM datahub_dataset_item WHERE version_id = :v ORDER BY filename"
                ),
                {"v": m["version_id"]},
            )
        )
        .mappings()
        .all()
    )
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "item_id",
            "filename",
            "mime_type",
            "size_bytes",
            "sha256",
            "captured_at",
            "withdrawn_at",
            "withdrawn_reason",
        ]
    )
    for r in rows:
        w.writerow(
            [
                r["id"],
                r["filename"],
                r["mime_type"] or "",
                r["size_bytes"] or "",
                r["sha256"] or "",
                r["captured_at"] or "",
                r["withdrawn_at"] or "",
                r["withdrawn_reason"] or "",
            ]
        )
    return buf.getvalue()


async def item_url(
    session: AsyncSession, claims: AccessClaims, item_id: uuid.UUID
) -> dict[str, Any]:
    """A short-lived link to one file. RLS is the whole access check: a row
    the caller cannot see is a 404. A withdrawn file is not handed out."""
    m = await _one(
        session,
        "SELECT storage_key, filename, withdrawn_at, copy_status, owner_org_id "
        "FROM datahub_dataset_item WHERE id = :id",
        {"id": item_id},
    )
    if m is None:
        raise LookupError("file not found")
    is_owner = m["owner_org_id"] == claims.org_id or claims.role == "platform_admin"
    if m["withdrawn_at"] is not None and not is_owner:
        raise CatalogueError("This file has been withdrawn.")
    if m["copy_status"] != "copied":
        raise CatalogueError("This file is still being copied in.")
    url = await storage.presign_get(
        storage.platform_target(), m["storage_key"], m["filename"], inline=True
    )
    return {"url": url}


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
            "version_number": r["version_number"],
            "item_count": r["item_count"],
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
        "version_number": d["version_number"],
        "item_count": d["item_count"],
        "total_bytes": d["total_bytes"],
        "published_at": d["published_at"],
        "samples": out_samples,
    }


async def create_lead(
    slug: str, *, name: str, email: str, company: str, intended_use: str, message: str | None
) -> None:
    """A quote request from someone with no account. Operations follow it up
    and, if it is real, invite the organisation through onboarding."""
    async with anonymous_session() as s:
        try:
            got = (
                await s.execute(
                    text("SELECT datahub_lead_create(:slug, :n, :e, :c, :u, :m)"),
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
# Notices a person accepted
# ---------------------------------------------------------------------------


async def record_consent(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    document: str,
    version: int,
    accepted_at: Any | None,
    app_version: str | None,
    platform: str | None,
) -> dict[str, Any]:
    """Keep the server's copy of a notice the person accepted on their phone.
    Idempotent: the phone sends it again until it hears back."""
    if document not in NOTICE_DOCUMENTS:
        raise CatalogueError("Unknown notice.")
    await session.execute(
        text(
            "INSERT INTO user_consent (user_id, document, version, accepted_at, app_version, "
            "  platform) VALUES (:u, :doc, :ver, coalesce(:at, now()), :app, :plat) "
            "ON CONFLICT (user_id, document, version) DO NOTHING"
        ),
        {
            "u": claims.user_id,
            "doc": document,
            "ver": version,
            "at": accepted_at,
            "app": app_version,
            "plat": platform,
        },
    )
    return await my_consents(session, claims)


async def my_consents(session: AsyncSession, claims: AccessClaims) -> dict[str, Any]:
    rows = (
        (
            await session.execute(
                text(
                    "SELECT document, version, accepted_at FROM user_consent WHERE user_id = :u "
                    "ORDER BY accepted_at"
                ),
                {"u": claims.user_id},
            )
        )
        .mappings()
        .all()
    )
    return {"consents": [dict(r) for r in rows]}


# ---------------------------------------------------------------------------
# Relisting a delivered contract
# ---------------------------------------------------------------------------


async def relist_on_delivery(
    session: AsyncSession, claims: AccessClaims, contract_id: uuid.UUID
) -> uuid.UUID | None:
    """Called as a non-exclusive contract is delivered, in the partner's own
    transaction. Opens (or tops up) the partner's draft listing with one
    pending copy per accepted capture whose worker had accepted the resale
    notice before capturing it; the sweep then copies them out of the
    client's bucket. Captures without that consent are left out and counted.

    Returns the dataset id, or None for an exclusive request.
    """
    req = await _one(
        session,
        "SELECT r.title, r.category, r.permitted_uses, r.partner_reuse_allowed, "
        "       r.countries, c.reference_code "
        "FROM contract c JOIN request r ON r.id = c.request_id "
        "WHERE c.id = :c AND c.partner_org_id = :org",
        {"c": contract_id, "org": claims.org_id},
    )
    if req is None or not req["partner_reuse_allowed"]:
        return None

    existing = await _one(
        session, "SELECT id, status FROM datahub_dataset WHERE contract_id = :c", {"c": contract_id}
    )
    if existing is None:
        title = f"{req['title']} ({req['reference_code']})"
        ds = (
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset (owner_org_id, source, contract_id, slug, title, category, "
                    "  regions, created_by) "
                    "VALUES (:org, 'contract', :c, :slug, :title, :cat, :regions, :who) "
                    "RETURNING id"
                ),
                {
                    "org": claims.org_id,
                    "c": contract_id,
                    "slug": slugify(req["title"]),
                    "title": title,
                    "cat": req["category"],
                    "regions": list(req["countries"] or []),
                    "who": claims.user_id,
                },
            )
        ).scalar_one()
        await session.execute(
            text(
                "INSERT INTO datahub_dataset_version (dataset_id, owner_org_id, number) VALUES (:d, :o, 1)"
            ),
            {"d": ds, "o": claims.org_id},
        )
    else:
        ds = existing["id"]
    v = await _one(
        session,
        "SELECT id, number FROM datahub_dataset_version WHERE dataset_id = :d AND status = 'open' "
        "ORDER BY number DESC LIMIT 1",
        {"d": ds},
    )
    if v is None:
        # Already published: a re-delivery after a dispute does not reopen it.
        return ds

    candidates = (
        (
            await session.execute(
                text("SELECT * FROM datahub_relist_candidates(:c)"), {"c": contract_id}
            )
        )
        .mappings()
        .all()
    )
    added = left_out = 0
    for a in candidates:
        if not a["resale_consented"]:
            left_out += 1
            continue
        name = _safe_filename(a["filename"] or f"{a['asset_id']}")
        got = (
            await session.execute(
                text(
                    "INSERT INTO datahub_dataset_item (version_id, dataset_id, owner_org_id, storage_key, "
                    "  filename, mime_type, size_bytes, sha256, source_asset_id, source_storage_key, "
                    "  source_storage_target_id, captured_at, captured_by_user_id, check_summary, "
                    "  copy_status) "
                    "VALUES (:v, :d, :org, :key, :name, :mime, :size, :sha, :asset, :skey, :starget, "
                    "  :cap, :by, CAST(:checks AS jsonb), 'pending') "
                    "ON CONFLICT (version_id, source_asset_id) WHERE source_asset_id IS NOT NULL "
                    "DO NOTHING RETURNING id"
                ),
                {
                    "v": v["id"],
                    "d": ds,
                    "org": claims.org_id,
                    "key": f"catalogue/{ds}/v{v['number']}/{a['asset_id']}-{name}",
                    "name": name,
                    "mime": a["mime_type"],
                    "size": a["size_bytes"],
                    "sha": a["sha256"],
                    "asset": a["asset_id"],
                    "skey": a["storage_key"],
                    "starget": a["storage_target_id"],
                    "cap": a["captured_at"],
                    "by": a["captured_by_user_id"],
                    "checks": _json(a["check_results"]),
                },
            )
        ).scalar_one_or_none()
        added += got is not None
    note = (
        f"{left_out} accepted captures were left out: their workers had not accepted the "
        "resale notice before capturing them."
        if left_out
        else None
    )
    await session.execute(
        text("UPDATE datahub_dataset_version SET notes = :n WHERE id = :v"), {"n": note, "v": v["id"]}
    )
    await notifier.notify(
        session,
        claims.org_id,
        f"{req['reference_code']} was not exclusive, so its captures are being copied into a draft "
        f"dataset you can list ({added} added"
        + (f", {left_out} left out for want of the worker's resale consent" if left_out else "")
        + ").",
        "catalogue_listing",
        {"id": str(ds)},
    )
    await audit.log(
        session,
        "catalogue.relisted",
        f"Opened {req['reference_code']} for resale: {added} captures to copy, {left_out} left out",
        [ds, contract_id, claims.org_id],
        {"added": added, "left_out": left_out},
    )
    return ds


def _json(value: Any) -> str:
    return json.dumps(value if value is not None else {}, default=str)
