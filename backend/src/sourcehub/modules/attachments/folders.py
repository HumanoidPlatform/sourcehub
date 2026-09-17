"""Where a platform file ends up, and what it is called when it gets there.

One folder per client, one per RFP, and inside that a tree that reads like the
workflow — who attached the file and to what:

    platform/Acme Retail Analytics/RFP-1001/
        request/brief/                       the client, while raising the RFP
        request/compliance/
        proposals/PRO-03 TN-01 NorthStar Delivery Partners/methodology/
        tasks/TSK-02/instructions/
        qa/TSK-02/verdict/

so two tasks' instructions, or two bidders' method statements, can never share
a folder. A stored file is named

    {RFP}[_{scope}]_{slot}_{nn}_v{k}_{original name}
    RFP-1001_brief_01_v2_Laptop_Purchase_Sheet.docx
    RFP-1001_TSK-02_instructions_01_v1_Shot_List.docx

where nn numbers the DOCUMENTS in a slot and k the VERSIONS of one document —
see next_numbers() for what makes an upload one or the other. The name carries
the scope as well as the folder does, so a file still explains itself once it
has been downloaded out of its folder.

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
from collections.abc import Iterable
from dataclasses import dataclass
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

# The branch of the tree each kind of parent files under.
_BRANCH = {"request": "request", "proposal": "proposals", "task": "tasks", "qa_review": "qa"}


class NoFreeNameError(RuntimeError):
    """Every candidate key was already taken. The service turns this into a
    refusal the caller can read; it used to escape as a 500."""


@dataclass(frozen=True, slots=True)
class Filing:
    """Everything needed to place and name a file hung off one parent."""

    base: str  # "{client}/{RFP}"
    rfp_ref: str  # "RFP-1001"
    scope_ref: str | None  # "PRO-03" / "TSK-02"; None for the client's own request
    scope_label: str | None  # "TN-01 NorthStar Delivery Partners", proposals only


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
) -> Filing:
    """The client, the RFP and the scope behind anything hung off a request.

    The walk from a task or a QA review back to the request differs per entity
    and crosses rows the attaching party often cannot see, so it lives in the
    SECURITY DEFINER function attachment_folder() rather than here.
    """
    row = (
        await session.execute(
            text(
                "SELECT client_name, request_ref, scope_ref, scope_label "
                "FROM attachment_folder(CAST(:t AS attachment_entity), :id)"
            ),
            {"t": entity_type, "id": entity_id},
        )
    ).mappings().one_or_none()
    if row is None or not row["request_ref"]:
        raise LookupError(f"no request behind {entity_type} {entity_id}")
    if entity_type != "request" and not row["scope_ref"]:
        raise LookupError(f"no reference behind {entity_type} {entity_id}")

    client = _segment(row["client_name"] or "", fallback="Unnamed client")
    if client.casefold() == STAGING:
        raise ValueError(f"{STAGING!r} is reserved and cannot be used as a client folder.")
    rfp = _segment(row["request_ref"], fallback="Unreferenced")
    return Filing(
        base=f"{client}/{rfp}", rfp_ref=rfp,
        scope_ref=row["scope_ref"], scope_label=row["scope_label"],
    )


def subfolder(entity_type: str, filing: Filing, slot: str) -> str:
    """The path under {client}/{RFP} for one parent's slot.

        request    request/{slot}
        proposal   proposals/{PRO-ref TN-ref Partner}/{slot}
        task       tasks/{TSK-ref}/{slot}
        qa_review  qa/{TSK-ref}/{slot}
    """
    branch = _BRANCH[entity_type]
    leaf = _segment(slot, "files")
    if entity_type == "request":
        return f"{branch}/{leaf}"
    who = " ".join(p for p in (filing.scope_ref, filing.scope_label) if p)
    return f"{branch}/{_segment(who, 'Unreferenced')}/{leaf}"


def stored_name(
    rfp_ref: str, scope_ref: str | None, slot: str, doc_no: int, version: int, original: str
) -> str:
    """{RFP}[_{scope}]_{slot}_{nn}_v{k}_{original name}.

    Whitespace in the original becomes '_': Azure percent-encodes every space,
    and a name that survives a shell, a URL and a spreadsheet unquoted is worth
    more than one that keeps its gaps. attachment.filename still holds the name
    exactly as it was uploaded, and that is the one the console shows.
    """
    original = re.sub(r"\s+", "_", _segment(original, "file"))
    scope = [scope_ref] if scope_ref else []
    return "_".join([rfp_ref, *scope, slot, f"{doc_no:02d}", f"v{version}", original])


def next_numbers(existing: Iterable[tuple[int, int, str]], filename: str) -> tuple[int, int]:
    """(doc_no, version) for a new upload into one parent's slot.

    `existing` is every (doc_no, version, filename) already numbered there —
    soft-deleted rows INCLUDED, because a number, once used, is never handed out
    again: a removed v2 is followed by v3, not by a second v2.

    The same original filename, compared case-insensitively, is the next
    version of that document. That is how people actually revise a file — they
    re-upload DPA.pdf — and it needs no button. Any other filename is the next
    document in the slot.
    """
    rows = list(existing)
    wanted = filename.casefold()
    same = [(d, v) for d, v, name in rows if name.casefold() == wanted]
    if same:
        doc_no = same[0][0]
        return doc_no, max(v for d, v in same if d == doc_no) + 1
    return max((d for d, _, _ in rows), default=0) + 1, 1


async def _vacant(t: StorageTarget, key: str) -> str:
    """`key`, or the same name with a short suffix if it is already taken.

    Numbered names make a clash rare rather than ordinary, but not impossible:
    storage is outside the transaction, so a save that moved its file and then
    rolled back leaves an orphan at exactly the key the retry will compute.
    Overwriting it is safe in that one case and catastrophic in any other, so
    the retry gets a suffix instead.
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
    raise NoFreeNameError(f"could not find a free name for {key}")


async def move_into(t: StorageTarget, staged: str, final: str) -> str:
    """Copy a staged object to its final key, drop the staged one, return the key.

    Delete-after-copy, never the reverse: a failure between the two leaves a
    harmless orphan under `_staging/` rather than losing the file.
    """
    from sourcehub.platform import storage

    final = await _vacant(t, final)
    await storage.copy(t, staged, final)
    await storage.delete(t, staged)
    return final
