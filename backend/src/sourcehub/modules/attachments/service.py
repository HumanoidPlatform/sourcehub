"""attachments — files hung off a field.

Business rules, and the ONLY public surface of this module.

The shape follows request samples, because that flow works and the reasons
behind it still hold: the key is server-generated so a caller can never choose
where bytes land, the upload happens before the parent row exists (a proposal's
method statement is picked while the proposal is still a form), and the
recorded size comes from storage rather than the caller's claim, since a
presigned PUT cannot cap what is actually uploaded.

Attaching is always driven by a service that already holds the parent row and
has already decided the caller may write it. This module does not re-derive
that: it checks the object was uploaded under the caller's own prefix and that
storage really holds it.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.config import settings

from sourcehub.modules.attachments import folders

# Imported for its side effect: registers the table in the shared MetaData, so
# an ORM flush elsewhere can resolve foreign keys against it.
from sourcehub.modules.attachments import models as _models  # noqa: F401


class AttachmentError(Exception):
    pass


MAX_BYTES = 25 * 1024 * 1024
# The server's ceiling, not each field's allowance. A caller may be stricter:
# the console still offers five on a request's document slots and ten on an
# RFP response, where a bid is a deck plus a method statement plus CVs.
MAX_PER_SLOT = 10

ENTITIES = ("request", "proposal", "task", "qa_review")

# Same list the request-sample uploader accepts. Content type is advisory —
# browsers lie about it — so the extension is what gates.
_EXTENSIONS = {
    ".csv", ".tsv", ".json", ".jsonl", ".xml", ".txt", ".md", ".pdf",
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".mp3", ".wav",
    ".zip", ".xlsx", ".docx", ".pptx", ".ppt", ".parquet",
}

_COLUMNS = (
    "id, entity_type, entity_id, slot, owner_org_id, filename, "
    "content_type, size_bytes, uploaded_at, doc_no, version"
)


def _safe_filename(name: str) -> str:
    # basename only — a path in a filename is someone probing the key scheme
    name = name.replace("\\", "/").rsplit("/", 1)[-1]
    name = "".join(c for c in name if c.isprintable() and c not in '<>:"|?*').strip()
    if len(name) > 200:
        stem, _, ext = name.rpartition(".")
        name = stem[: 200 - len(ext) - 1] + "." + ext if ext else name[:200]
    if not name or "." not in name:
        raise AttachmentError("Attachments need a real filename with an extension.")
    ext = "." + name.rsplit(".", 1)[-1].lower()
    if ext not in _EXTENSIONS:
        raise AttachmentError(f"Attachments of type {ext} are not accepted.")
    return name


def _row(r: Any) -> dict[str, Any]:
    return dict(r)


async def presign_upload(
    session: AsyncSession, claims: AccessClaims,
    *, filename: str, content_type: str | None, size_bytes: int,
) -> dict[str, Any]:
    """Mint a one-object upload URL under the caller's own org prefix.

    The parent need not exist yet: the form uploads first and the final save
    attaches the keys, exactly as the request builder does with samples.
    """
    from sourcehub.platform import storage

    if size_bytes <= 0 or size_bytes > MAX_BYTES:
        raise AttachmentError("Attachments are capped at 25 MB each.")
    safe = _safe_filename(filename)
    # Staging, not the final home: the parent has no name yet. attach() moves
    # it into {client}/{RFP}/{slot}/ once there is something to file it under.
    key = folders.staging_key(claims.org_id, safe)
    url, extra = await storage.presign_put(
        storage.platform_target(), key
    )
    return {
        "storage_key": key,
        "url": url,
        "method": "PUT",
        "headers": {**({"Content-Type": content_type} if content_type else {}), **extra},
        "filename": safe,
        "content_type": content_type,
        "expires_in": settings.storage_presign_ttl_seconds,
    }


async def attach(
    session: AsyncSession, claims: AccessClaims,
    *, entity_type: str, entity_id: uuid.UUID, items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Record uploaded objects against a field of an entity.

    Called inside the caller's own transaction, by a service that has already
    established the caller may write this parent.
    """
    from sourcehub.platform import storage

    if entity_type not in ENTITIES:
        raise AttachmentError(f"Unknown attachment target {entity_type!r}.")
    if not items:
        return []

    own_prefix = folders.staging_prefix(claims.org_id)
    target = storage.platform_target()
    # Resolved once: every item in a call hangs off the same parent, and this
    # is the point at which that parent finally has a client and a reference.
    try:
        filing = await folders.folder_for(session, entity_type, entity_id)
    except LookupError:
        raise AttachmentError("There is no request to file these against.") from None
    except ValueError as e:
        raise AttachmentError(str(e)) from None

    out: list[dict[str, Any]] = []
    # Per slot: every (doc_no, version, filename, live) already numbered there,
    # soft-deleted rows included, plus what this call has added so far — two
    # files for one slot in a single save must not be given the same number.
    numbered: dict[str, list[tuple[int, int, str, bool]]] = {}

    for item in items:
        key: str = item["storage_key"]
        slot: str = (item.get("slot") or "").strip()
        if not slot:
            raise AttachmentError("An attachment must say which field it belongs to.")
        if not key.startswith(own_prefix):
            raise AttachmentError("That file does not belong to your organisation.")
        safe = _safe_filename(item["filename"])

        # The real size enforcement. A presigned PUT cannot cap what was sent,
        # so the number recorded here comes from storage, never the claim.
        try:
            size, stored_ct = await storage.stat(target, key)
        except LookupError:
            raise AttachmentError(
                f"{safe} is not in staging — it was never uploaded, or has "
                "already been attached."
            ) from None
        if size <= 0 or size > MAX_BYTES:
            raise AttachmentError(f"{safe} exceeds the 25 MB cap.")

        if slot not in numbered:
            # One writer at a time per parent+slot, held to the end of the
            # transaction — the same advisory-lock shape the audit chain uses.
            # Without it two concurrent saves read the same numbers and mint
            # the same (doc_no, version); the unique index would then refuse
            # one of them only after its file had already been moved.
            await session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"),
                {"k": f"attachment:{entity_type}:{entity_id}:{slot}"},
            )
            rows = (
                await session.execute(
                    text(
                        "SELECT doc_no, version, filename, deleted_at IS NULL AS live "
                        "FROM attachment "
                        "WHERE entity_type = CAST(:t AS attachment_entity) "
                        "  AND entity_id = :e AND slot = :s"
                    ),
                    {"t": entity_type, "e": entity_id, "s": slot},
                )
            ).all()
            numbered[slot] = [(r.doc_no, r.version, r.filename, r.live) for r in rows]

        known = numbered[slot]
        doc_no, version = folders.next_numbers(((d, v, n) for d, v, n, _ in known), safe)

        # The cap is on DOCUMENTS, not rows: a fifth revision of one DPA is
        # still one document, and must not fill the slot.
        live_docs = {d for d, _, _, live in known if live}
        if doc_no not in live_docs and len(live_docs) + 1 > MAX_PER_SLOT:
            raise AttachmentError(f"At most {MAX_PER_SLOT} attachments per field.")

        name = folders.stored_name(filing.rfp_ref, filing.scope_ref, slot, doc_no, version, safe)
        wanted = f"{filing.base}/{folders.subfolder(entity_type, filing, slot)}/{name}"

        # Last, once the file has passed every check: storage is outside the
        # transaction, so a move made before a rejection could not be undone.
        try:
            final = await folders.move_into(target, key, wanted)
        except folders.NoFreeNameError:
            raise AttachmentError(f"Could not file {safe}; try the upload again.") from None

        row = (
            await session.execute(
                text(
                    "INSERT INTO attachment "
                    "  (entity_type, entity_id, slot, owner_org_id, filename, storage_key, "
                    "   content_type, size_bytes, uploaded_by, doc_no, version) "
                    "VALUES (CAST(:t AS attachment_entity), :e, :s, :org, :name, :key, "
                    "        :ct, :size, :who, :doc, :ver) "
                    "ON CONFLICT DO NOTHING "
                    f"RETURNING {_COLUMNS}"
                ),
                {
                    "t": entity_type, "e": entity_id, "s": slot, "org": claims.org_id,
                    "name": safe, "key": final, "ct": item.get("content_type") or stored_ct,
                    "size": size, "who": claims.user_id, "doc": doc_no, "ver": version,
                },
            )
        ).mappings().one_or_none()
        if row is None:
            # Used to be dropped in silence, leaving a moved file with no row
            # pointing at it. Under the lock it should not happen; if it does,
            # the save is refused rather than half-recorded.
            raise AttachmentError(f"Could not record {safe}; try the upload again.")
        known.append((doc_no, version, safe, True))
        out.append({**_row(row), "is_current": True})
    return out


async def list_for(
    session: AsyncSession, entity_type: str, entity_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[dict[str, Any]]]:
    """Attachments for several entities at once, grouped by entity, then ordered
    by slot, document and newest version first.

    Every live version comes back, with is_current marking the newest of each
    document: the console shows that one and lists the earlier ones beneath it.
    "Current" is derived from the rows that are still live, never stored, so
    removing v3 makes v2 current again with nothing to keep in step.

    One query rather than one per row: a proposals table would otherwise issue
    a request per bid just to show a paperclip.
    """
    if not entity_ids:
        return {}
    rows = (
        await session.execute(
            text(
                f"SELECT {_COLUMNS}, "
                "       version = max(version) OVER (PARTITION BY entity_id, slot, doc_no) "
                "         AS is_current "
                "FROM attachment "
                "WHERE entity_type = CAST(:t AS attachment_entity) AND entity_id = ANY(:ids) "
                "  AND deleted_at IS NULL "
                "ORDER BY entity_id, slot, doc_no, version DESC"
            ),
            {"t": entity_type, "ids": entity_ids},
        )
    ).mappings().all()
    grouped: dict[uuid.UUID, list[dict[str, Any]]] = {}
    for r in rows:
        grouped.setdefault(r["entity_id"], []).append(_row(r))
    return grouped


async def download_url(
    session: AsyncSession, attachment_id: uuid.UUID
) -> dict[str, Any]:
    """A short-TTL download URL. The RLS'd select is the whole access check."""
    from sourcehub.platform import storage

    row = (
        await session.execute(
            text(
                "SELECT filename, storage_key FROM attachment "
                "WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": attachment_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("attachment not found")
    url = await storage.presign_get(
        storage.platform_target(),
        row["storage_key"], row["filename"],
    )
    return {
        "url": url,
        "filename": row["filename"],
        "expires_in": settings.storage_presign_ttl_seconds,
    }


async def discard(
    session: AsyncSession, claims: AccessClaims, attachment_id: uuid.UUID
) -> None:
    """Soft delete, and only by the organisation that uploaded it.

    Soft because the audit trail should still show that a file was attached to
    a bid someone priced against. The bytes stay in the documents bucket —
    there is no reaper for those anywhere in this codebase yet.
    """
    res = await session.execute(
        text(
            "UPDATE attachment SET deleted_at = now() "
            "WHERE id = :id AND owner_org_id = :org AND deleted_at IS NULL"
        ),
        {"id": attachment_id, "org": claims.org_id},
    )
    if res.rowcount == 0:
        raise LookupError("attachment not found")
