"""Where a platform file ends up: one folder per client, one per RFP.

    platform/Acme Retail Analytics/RFP-1001/compliance/dpa.pdf
    platform/Acme Retail Analytics/RFP-1001/samples/rows.csv

The layout exists so a person can open the container and recognise what they
are looking at. It is a filing scheme and nothing more — who may read a file is
decided by RLS on the row that points at it, never by which folder it sits in.
A partner's method statement lands in the CLIENT's folder and stays invisible
to a rival partner.

Files are uploaded before the thing they belong to exists: a method statement
is picked while the proposal is still a form, and an RFP has no reference code
until it is saved. So an upload lands under a reserved prefix

    platform/_staging/{org}/{uuid}/{file}

and is moved into place at attach time, when the parent finally has a name.
The move is a server-side copy followed by a delete — the bytes never pass
through the API.

Two consequences of sharing one container with the client folders: `_staging`
is a reserved folder name, rejected below if a client's own name would collide
with it; and any storage lifecycle rule written for the leftovers of abandoned
forms must match the `_staging/` prefix, never the container, or it will delete
real files.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.platform.storage.types import StorageTarget

STAGING = "_staging"

# How many times a name collision is retried before giving up. Each attempt
# draws fresh randomness, so reaching the end means something else is wrong.
_COLLISION_TRIES = 5

# Characters that are either illegal in a blob name, ambiguous as a separator,
# or liable to break the tools people browse storage with. Runs of them
# collapse to one hyphen so "Acme / Retail" does not become "Acme---Retail".
_UNSAFE = re.compile(r'[\\/:*?"<>|\x00-\x1f]+')


def staging_key(org_id: Any, filename: str) -> str:
    """Where an upload lands before its parent exists."""
    return f"{STAGING}/{org_id}/{uuid.uuid4()}/{filename}"


def staging_prefix(org_id: Any) -> str:
    """The only prefix a given organisation may present at attach time."""
    return f"{STAGING}/{org_id}/"


def _segment(raw: str, fallback: str) -> str:
    """One path segment, safe to put in a blob name.

    Azure treats a segment of "." or ".." as reserved and a trailing dot or
    space is silently dropped by parts of the Windows tooling people browse
    with, so both are stripped here rather than discovered later.
    """
    s = _UNSAFE.sub("-", raw or "")
    s = re.sub(r"\s+", " ", s).strip(" .")
    if len(s) > 120:
        s = s[:120].strip(" .")
    return s or fallback


async def folder_for(
    session: AsyncSession, entity_type: str, entity_id: uuid.UUID
) -> str:
    """"{client}/{RFP}" for anything hung off a request, however indirectly.

    The walk from a task or a QA review back to the request differs per entity
    and crosses rows the attaching party often cannot see, so it lives in the
    SECURITY DEFINER function attachment_folder() rather than here.
    """
    row = (
        await session.execute(
            text(
                "SELECT client_name, request_ref "
                "FROM attachment_folder(CAST(:t AS attachment_entity), :id)"
            ),
            {"t": entity_type, "id": entity_id},
        )
    ).mappings().one_or_none()
    if row is None or not row["request_ref"]:
        raise LookupError(f"no request behind {entity_type} {entity_id}")

    client = _segment(row["client_name"] or "", fallback="Unnamed client")
    if client.casefold() == STAGING:
        raise ValueError(f"{STAGING!r} is reserved and cannot be used as a client folder.")
    return f"{client}/{_segment(row['request_ref'], fallback='Unreferenced')}"


async def _vacant(t: StorageTarget, key: str) -> str:
    """`key`, or the same name with a short suffix if it is already taken.

    Two files genuinely named dpa.pdf in one slot is ordinary — a renewed
    agreement, a resupplied form — and overwriting would destroy the one the
    earlier row still points at.
    """
    from sourcehub.platform import storage

    folder, _, name = key.rpartition("/")
    stem, dot, ext = name.rpartition(".")
    for _ in range(_COLLISION_TRIES):
        try:
            await storage.head(t, key)
        except LookupError:
            return key
        tag = uuid.uuid4().hex[:6]
        name = f"{stem}-{tag}{dot}{ext}" if dot else f"{name}-{tag}"
        key = f"{folder}/{name}" if folder else name
    raise RuntimeError(f"could not find a free name for {key}")


async def move_into(t: StorageTarget, staged: str, folder: str, slot: str, filename: str) -> str:
    """Copy a staged object into its folder, drop the staged one, return the key.

    Delete-after-copy, never the reverse: a failure between the two leaves a
    harmless orphan under `_staging/` rather than losing the file.
    """
    from sourcehub.platform import storage

    final = await _vacant(t, f"{folder}/{_segment(slot, 'files')}/{filename}")
    await storage.copy(t, staged, final)
    await storage.delete(t, staged)
    return final
