"""network — aggregators, businesses, sponsors, equipment, loans and rosters.

Business rules, and the ONLY public surface of this module.

The stock arithmetic the prototype never had lives in the database (the
check_loan_availability trigger); this service translates its refusals into
messages a person can act on.

Crowd workers began as roster records with no credential. Since
db/120_workers_media.sql a roster row may also be a person who signs in to
the capture app: invite_worker() creates the app_user, the 'worker' grant in
this organisation, the roster row and the invitation in one database function,
and the worker uses the same accept-invitation page and the same login as
everyone else.
"""

from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass
from typing import Any

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, new_opaque_token
from sourcehub.config import settings
from sourcehub.modules.audit import service as audit
from sourcehub.modules.network.models import CrowdWorker, Equipment, Loan
from sourcehub.modules.notify import service as notifier


class NetworkError(Exception):
    pass


class NetworkInvalid(NetworkError):
    """What was sent cannot be stored as given (a detail too long, a file of
    the wrong kind), as opposed to a refusal of a valid request."""


# ---------------------------------------------------------------------------
# Equipment
# ---------------------------------------------------------------------------

async def list_equipment(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    """Sponsor: own inventory. Tenant: every sponsor in its network. Supplier:
    every sibling sponsor's inventory to borrow from, plus anything it holds a
    live loan on.

    One query, and RLS decides most of it — but deliberately not the sponsor
    case. This used to say "RLS is the filter", and that is precisely how a
    widened sibling policy came to show every device sponsor its rivals' stock
    levels with nothing here to catch it
    (db/220_equipment_sibling_scope.sql). The sponsor predicate below is
    duplication on purpose: the one boundary a reader of this function can
    actually see is the one worth not delegating.

    Each device's photos and documentation come with it, fetched for every row
    in one more query. Whoever sees the device sees its files: the attachment
    policy defers to equipment's own (db/520)."""
    from sourcehub.modules.attachments import service as attachments

    rows = (
        await session.execute(
            text(
                "SELECT e.id, e.reference_code, e.equipment_type, e.total_units, "
                "       e.calibrated_on, e.calibration_expires_on, e.sponsor_org_id, "
                "       e.make, e.model, e.location, e.specifications, "
                "       o.name AS sponsor_name, "
                "       equipment_units_on_loan(e.id) AS units_on_loan "
                "FROM equipment e JOIN organisation o ON o.id = e.sponsor_org_id "
                "WHERE e.deleted_at IS NULL "
                # Asked with the helpers the policies use, not a role name in
                # Python: shared/rbac — "adding a role is a database INSERT".
                "  AND (current_org_kind() <> 'sponsor' "
                "       OR e.sponsor_org_id = current_org_id()) "
                "ORDER BY e.reference_code"
            )
        )
    ).mappings().all()
    ids = [r["id"] for r in rows]
    files = await attachments.list_for(session, "equipment", ids)
    # The first photo, signed for the list to draw beside each device.
    photos = await attachments.preview_urls(session, "equipment", ids, "photos")
    return [
        {
            **dict(r),
            "units_available": r["total_units"] - r["units_on_loan"],
            "attachments": files.get(r["id"], []),
            "photo_url": photos.get(r["id"]),
        }
        for r in rows
    ]


# What a sponsor may say about a device beyond its type and stock (db/520).
# The database holds the outer bounds; these are the ones a person meets.
DETAIL_MAX = 200
SPEC_MAX_LABELS = 20
SPEC_LABEL_MAX = 60
SPEC_VALUE_MAX = 200
_DETAILS = ("make", "model", "location")


def clean_detail(field: str, value: Any) -> str | None:
    """A make, model or location as stored: trimmed, and NULL when blank."""
    if value is None:
        return None
    if not isinstance(value, str):
        raise NetworkInvalid(f"{field.capitalize()} must be text.")
    value = " ".join(value.split())
    if len(value) > DETAIL_MAX:
        raise NetworkInvalid(f"{field.capitalize()} is at most {DETAIL_MAX} characters.")
    return value or None


def clean_specifications(value: Any) -> dict[str, str]:
    """Labelled details as stored: a flat label → text map, labels and values
    trimmed, a label with no value dropped, at most SPEC_MAX_LABELS of them.
    Two labels that differ only in case are one label said twice."""
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise NetworkInvalid("Details must be labels with a value each.")
    out: dict[str, str] = {}
    seen: set[str] = set()
    for raw_label, raw_value in value.items():
        if not isinstance(raw_label, str) or not isinstance(raw_value, str):
            raise NetworkInvalid("Each detail is a label and a short piece of text.")
        label = " ".join(raw_label.split())
        text_value = " ".join(raw_value.split())
        if not text_value:
            continue
        if not label:
            raise NetworkInvalid("Every detail needs a label.")
        if len(label) > SPEC_LABEL_MAX:
            raise NetworkInvalid(f"A detail's label is at most {SPEC_LABEL_MAX} characters.")
        if len(text_value) > SPEC_VALUE_MAX:
            raise NetworkInvalid(f"{label} is at most {SPEC_VALUE_MAX} characters.")
        if label.casefold() in seen:
            raise NetworkInvalid(f"{label} is listed twice.")
        seen.add(label.casefold())
        out[label] = text_value
    if len(out) > SPEC_MAX_LABELS:
        raise NetworkInvalid(f"At most {SPEC_MAX_LABELS} details per device.")
    return out


async def _attach_files(
    session: AsyncSession, claims: AccessClaims, equipment_id: uuid.UUID,
    items: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Photos and documentation, filed in the caller's transaction. Only ever
    called once the device is known to be the caller's own."""
    from sourcehub.modules.attachments import service as attachments

    if not items:
        return []
    try:
        return await attachments.attach(
            session, claims, entity_type="equipment", entity_id=equipment_id, items=items
        )
    except attachments.AttachmentError as e:
        raise NetworkInvalid(str(e)) from None


def _files_note(files: list[dict[str, Any]]) -> str:
    return f"{len(files)} file{'s' if len(files) != 1 else ''} attached" if files else ""


async def add_equipment(
    session: AsyncSession,
    claims: AccessClaims,
    equipment_type: str,
    total_units: int,
    calibrated_on: dt.date | None,
    calibration_expires_on: dt.date | None,
    *,
    make: str | None = None,
    model: str | None = None,
    location: str | None = None,
    specifications: dict[str, str] | None = None,
    attachments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """A new device, with whatever the sponsor knows about it and its files, in
    one transaction: a file that cannot be filed refuses the whole save, so a
    device never exists with half its photos."""
    equipment_type = equipment_type.strip()
    if len(equipment_type) < 2:
        raise NetworkError("Give the equipment a name.")
    if calibrated_on and calibration_expires_on and calibration_expires_on < calibrated_on:
        raise NetworkError("Calibration cannot expire before the date it was done.")
    given = (make, model, location)
    details = {f: clean_detail(f, v) for f, v in zip(_DETAILS, given, strict=True)}
    specs = clean_specifications(specifications)

    ref = (
        await session.execute(text("SELECT next_reference_code('DV','seq_ref_equipment')"))
    ).scalar_one()
    e = Equipment(
        reference_code=ref,
        sponsor_org_id=claims.org_id,
        equipment_type=equipment_type,
        total_units=total_units,
        calibrated_on=calibrated_on,
        calibration_expires_on=calibration_expires_on,
        **details,
        specifications=specs,
        created_by=claims.user_id,
    )
    session.add(e)
    await session.flush()
    files = await _attach_files(session, claims, e.id, attachments)
    note = _files_note(files)
    await audit.log(session, "equipment.added",
                    f"Added {equipment_type}, {total_units} units ({ref})"
                    + (f"; {note}" if note else ""),
                    [e.id, claims.org_id])
    return {"id": e.id, "reference_code": ref, "equipment_type": equipment_type,
            "total_units": total_units, **details, "specifications": specs,
            "attachments": files}


_EDITABLE = (
    "equipment_type", "total_units", "calibrated_on", "calibration_expires_on",
    *_DETAILS, "specifications",
)


async def update_equipment(
    session: AsyncSession,
    claims: AccessClaims,
    equipment_id: uuid.UUID,
    changes: dict[str, Any],
    attachments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Edit a device: type, unit count, calibration dates, make, model,
    location and labelled details, and add photos or documentation.

    `changes` holds only the fields the caller SENT (the route reads pydantic's
    model_fields_set), so a date is cleared by sending null explicitly and an
    omitted field is left alone. Until this existed a sponsor could add a
    device and nothing else — a typo in the type or a fleet that grew were
    permanent. `specifications` is the whole map, not a patch of it: the
    console always sends every label it shows, so a label it removed is gone.
    A file is removed through DELETE /attachments/{id}, which only its owner
    may do.

    Two things the schema does not enforce are refused here. total_units may
    not fall below what is out on loan: check_loan_availability only fires when
    a LOAN changes, so nothing else would notice a sponsor shrinking a fleet
    underneath live loans. And an expiry before its calibration date is a typo,
    not a record.
    """
    unknown = set(changes) - set(_EDITABLE)
    if unknown:
        raise NetworkError(f"Not editable here: {', '.join(sorted(unknown))}.")
    if not changes and not attachments:
        raise NetworkError("Nothing to change.")
    for required in ("equipment_type", "total_units"):
        if required in changes and changes[required] is None:
            raise NetworkError(f"{required.replace('_', ' ').capitalize()} cannot be blank.")
    if "equipment_type" in changes:
        changes["equipment_type"] = changes["equipment_type"].strip()
        if len(changes["equipment_type"]) < 2:
            raise NetworkError("Give the equipment a name.")
    for field in _DETAILS:
        if field in changes:
            changes[field] = clean_detail(field, changes[field])
    if "specifications" in changes:
        changes["specifications"] = clean_specifications(changes["specifications"])

    # Own inventory only. equipment_write already refuses a foreign row, but an
    # UPDATE matching nothing is not an error: a miss has to be a miss, not a
    # silent no-op with an audit line — the phantom-success bug this module
    # once shipped.
    e = (
        await session.execute(
            select(Equipment).where(
                Equipment.id == equipment_id,
                Equipment.sponsor_org_id == claims.org_id,
            )
        )
    ).scalar_one_or_none()
    if e is None:
        raise LookupError("equipment not found")

    if "total_units" in changes:
        on_loan = (
            await session.execute(
                text("SELECT equipment_units_on_loan(:e)"), {"e": equipment_id}
            )
        ).scalar_one()
        if changes["total_units"] < on_loan:
            raise NetworkError(
                f"{on_loan} unit{'s are' if on_loan != 1 else ' is'} out on loan — "
                "the total cannot go below that until they are returned."
            )

    calibrated = changes.get("calibrated_on", e.calibrated_on)
    expires = changes.get("calibration_expires_on", e.calibration_expires_on)
    if calibrated and expires and expires < calibrated:
        raise NetworkError("Calibration cannot expire before the date it was done.")

    # Only what actually moves is written, old → new. A request that changes
    # nothing — the dialog re-sent a value the row already had — writes nothing
    # and leaves no audit line, so the sponsor's activity feed is not filled
    # with "updated" entries where nothing was.
    moved = {k: v for k, v in changes.items() if getattr(e, k) != v}
    before = {k: getattr(e, k) for k in moved}
    if moved:
        for field, value in moved.items():
            setattr(e, field, value)
        e.updated_by = claims.user_id
        await session.flush()
    files = await _attach_files(session, claims, e.id, attachments)
    if moved or files:
        # The details are named by count, not written out: an audit line is
        # read in a feed, and a twenty-label map is not a sentence.
        said = [
            f"details now {len(v)} label{'s' if len(v) != 1 else ''}" if k == "specifications"
            else f"{k} {before[k]} → {v}"
            for k, v in moved.items()
        ]
        note = _files_note(files)
        await audit.log(
            session, "equipment.updated",
            f"{e.reference_code} updated: " + ", ".join([*said, *([note] if note else [])]),
            [e.id, claims.org_id],
        )
    return {
        "id": e.id, "reference_code": e.reference_code, "equipment_type": e.equipment_type,
        "total_units": e.total_units,
        "calibrated_on": e.calibrated_on, "calibration_expires_on": e.calibration_expires_on,
        "make": e.make, "model": e.model, "location": e.location,
        "specifications": e.specifications, "attachments": files,
    }


# ---------------------------------------------------------------------------
# Loans — the chain of custody
# ---------------------------------------------------------------------------

async def request_loan(
    session: AsyncSession,
    claims: AccessClaims,
    equipment_id: uuid.UUID,
    units: int,
    needed_by: dt.date | None,
    task_id: uuid.UUID | None,
    note: str | None,
) -> dict[str, Any]:
    eq = (
        await session.execute(
            text("SELECT id, sponsor_org_id, equipment_type FROM equipment WHERE id = :e"),
            {"e": equipment_id},
        )
    ).mappings().one_or_none()
    if eq is None:
        raise LookupError("equipment not found")
    ref = (
        await session.execute(text("SELECT next_reference_code('EQR','seq_ref_loan')"))
    ).scalar_one()
    loan = Loan(
        reference_code=ref,
        equipment_id=equipment_id,
        sponsor_org_id=eq["sponsor_org_id"],
        requester_org_id=claims.org_id,
        task_id=task_id,
        units=units,
        needed_by=needed_by,
        note=note,
        created_by=claims.user_id,
    )
    session.add(loan)
    await session.flush()
    await notifier.notify(
        session, eq["sponsor_org_id"],
        f"{claims.org_name} requests {units} × {eq['equipment_type']}.",
        # "loans", not "requests". This goes to the SPONSOR, whose loan queue is
        # /loans — the sidebar item they see labelled "Requests". "requests" is
        # the client's RFP list, so a sponsor clicking this landed on a screen
        # offering to publish an RFP, empty because RLS returns them none.
        "loans", {"id": str(loan.id)},
    )
    await audit.log(session, "loan.requested",
                    f"Requested {units} × {eq['equipment_type']} ({ref})",
                    [loan.id, equipment_id, claims.org_id, eq["sponsor_org_id"]])
    return {"id": loan.id, "reference_code": ref, "status": loan.status}


async def list_loans(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                "SELECT l.id, l.reference_code, l.units, l.status, l.needed_by, l.note, "
                "       l.decision_reason, l.decided_at, l.returned_at, "
                "       e.equipment_type, e.reference_code AS equipment_ref, "
                "       sp.name AS sponsor_name, rq.name AS requester_name, "
                "       t.reference_code AS task_ref "
                "FROM loan l "
                "JOIN equipment e ON e.id = l.equipment_id "
                "JOIN organisation sp ON sp.id = l.sponsor_org_id "
                "JOIN organisation rq ON rq.id = l.requester_org_id "
                "LEFT JOIN task t ON t.id = l.task_id "
                "ORDER BY l.created_at DESC"
            )
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def decide_loan(
    session: AsyncSession,
    claims: AccessClaims,
    loan_id: uuid.UUID,
    decision: str,  # 'approved' | 'rejected' | 'returned'
    reason: str | None,
) -> dict[str, Any]:
    loan = (
        await session.execute(select(Loan).where(Loan.id == loan_id))
    ).scalar_one_or_none()
    if loan is None:
        raise LookupError("loan not found")
    if loan.sponsor_org_id != claims.org_id:
        raise NetworkError("Only the sponsor decides its own equipment.")

    now = dt.datetime.now(dt.UTC)

    if decision == "approved":
        if loan.status != "pending":
            raise NetworkError(f"A {loan.status} request cannot be approved.")
        loan.status = "approved"
        loan.decided_at = now
        loan.decided_by = claims.user_id
        try:
            await session.flush()
        except DBAPIError as e:
            raise NetworkError(_friendly_stock_error(e)) from None
    elif decision == "rejected":
        if loan.status != "pending":
            raise NetworkError(f"A {loan.status} request cannot be rejected.")
        if not (reason and reason.strip()):
            raise NetworkError("Give a reason — the requester cannot act on a blank rejection.")
        loan.status = "rejected"
        loan.decided_at = now
        loan.decided_by = claims.user_id
        loan.decision_reason = reason
    elif decision == "returned":
        if loan.status not in ("approved", "issued", "overdue"):
            raise NetworkError(f"A {loan.status} loan cannot be returned.")
        loan.status = "returned"
        loan.returned_at = now
    else:
        raise NetworkError("Unknown decision.")

    loan.updated_by = claims.user_id
    verb = {"approved": "approved", "rejected": "rejected", "returned": "marked returned"}[decision]
    await notifier.notify(
        session, loan.requester_org_id,
        f"Your equipment request {loan.reference_code} was {verb}."
        + (f" Reason: {reason}" if reason and decision == "rejected" else ""),
        "equipment", {},
    )
    await audit.log(session, "loan.state_changed",
                    f"{loan.reference_code} {verb}",
                    [loan.id, loan.equipment_id, claims.org_id, loan.requester_org_id])
    return {"id": loan.id, "status": loan.status}


def _friendly_stock_error(e: DBAPIError) -> str:
    msg = str(e.orig) if e.orig else str(e)
    if "calibration expired" in msg:
        return "Calibration has expired on this equipment — recalibrate before lending."
    if "units" in msg and "requested" in msg:
        return "Not enough units: " + msg.split("<class")[0].split(":")[-1].strip()
    return "The loan cannot be approved as requested."


# ---------------------------------------------------------------------------
# Crowd roster
#
# A roster row with user_id is a person who can sign in (role 'worker' in
# this organisation); one without is a legacy record. The tenant may read its
# supplier's roster; app_user rows are visible only to orgs the person holds
# a grant in, so the LEFT JOIN below yields NULLs for the tenant and the
# invitation status degrades to what the roster row alone can say.
# ---------------------------------------------------------------------------

_WORKER_ROWS = text(
    "SELECT w.id, w.reference_code, w.display_name, w.skills, w.status, w.trained, "
    "       w.email, w.phone, w.user_id, u.status AS user_status, "
    "       inv.accepted_at, inv.expires_at, coalesce(ta.open_count, 0) AS open_assignments, "
    "       gr.rating_avg, coalesce(gr.rating_count, 0) AS rating_count, "
    "       ac.app_connected "
    "FROM crowd_worker w "
    "LEFT JOIN app_user u ON u.id = w.user_id "
    # the supplier's own ratings of this person, under the caller's RLS: the
    # supplier that gave them reads them, the tenant gets NULLs (db/380)
    "LEFT JOIN LATERAL (SELECT round(avg(g.score), 1) AS rating_avg, count(*) AS rating_count "
    "                    FROM rating g WHERE g.kind = 'supplier_worker' "
    "                      AND g.to_user_id = w.user_id "
    "                      AND g.from_org_id = w.aggregator_org_id) gr ON true "
    "LEFT JOIN LATERAL (SELECT i.accepted_at, i.expires_at FROM invitation i "
    "                    WHERE i.user_id = w.user_id AND i.revoked_at IS NULL "
    "                    ORDER BY i.invited_at DESC LIMIT 1) inv ON true "
    "LEFT JOIN LATERAL (SELECT count(*) AS open_count FROM task_assignment a "
    "                    WHERE a.worker_user_id = w.user_id "
    "                      AND a.status IN ('assigned','in_progress','submitted','rejected')) ta "
    "          ON true "
    # whether offers and reminders can reach them: they reach the crowd by
    # push alone since db/550. Through a definer read that answers only for the
    # caller's own workers and never returns the token itself; NULL otherwise.
    "LEFT JOIN LATERAL worker_app_connected(ARRAY[w.user_id]) ac ON w.user_id IS NOT NULL "
    "WHERE w.deleted_at IS NULL "
    "  AND (CAST(:wid AS uuid) IS NULL OR w.id = CAST(:wid AS uuid)) "
    "ORDER BY w.reference_code"
)


def _invitation_status(r: Any) -> str:
    if r["user_id"] is None:
        return "none"
    if r["user_status"] == "active" or r["accepted_at"] is not None:
        return "accepted"
    if r["expires_at"] is not None and r["expires_at"] < dt.datetime.now(dt.UTC):
        return "expired"
    return "pending"


def _worker_dict(r: Any) -> dict[str, Any]:
    return {
        "id": r["id"], "reference_code": r["reference_code"],
        "display_name": r["display_name"], "skills": list(r["skills"] or []),
        "status": r["status"], "trained": r["trained"],
        "rating": None if r["rating_avg"] is None else round(float(r["rating_avg"]), 1),
        "rating_count": int(r["rating_count"]),
        "email": r["email"], "phone": r["phone"], "user_id": r["user_id"],
        "invitation_status": _invitation_status(r),
        "open_assignments": int(r["open_assignments"]),
        # a phone registered for push: offers and reminders reach them (db/550)
        "app_connected": r["app_connected"],
    }


async def list_workers(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (await session.execute(_WORKER_ROWS, {"wid": None})).mappings().all()
    return [_worker_dict(r) for r in rows]


async def _worker_by_id(session: AsyncSession, worker_id: uuid.UUID) -> dict[str, Any]:
    row = (await session.execute(_WORKER_ROWS, {"wid": worker_id})).mappings().one()
    return _worker_dict(row)


async def add_worker(
    session: AsyncSession, claims: AccessClaims,
    display_name: str, skills: list[str], trained: bool, phone: str | None = None,
) -> dict[str, Any]:
    """A roster-only entry: no email, no login. Kept for records about people
    who never use the app. The phone is kept too — the form always took one
    and, until the import, threw it away on this path."""
    ref = (
        await session.execute(text("SELECT next_reference_code('WKR','seq_ref_worker')"))
    ).scalar_one()
    w = CrowdWorker(
        reference_code=ref, aggregator_org_id=claims.org_id,
        display_name=display_name, skills=skills, trained=trained, phone=phone,
    )
    session.add(w)
    await session.flush()
    return await _worker_by_id(session, w.id)


async def _queue_worker_invitation(
    session: AsyncSession,
    *,
    email: str,
    full_name: str,
    org_name: str,
    raw_token: str,
    worker_id: uuid.UUID,
    reference_code: str,
) -> None:
    """Queued in the same transaction as the roster row (db/490 mail_outbox)
    and sent within seconds by modules/outbox. Nothing here can roll the invite
    back; the Ops mail log shows whether the mail left, and an import of fifty
    queues fifty rows the same way."""
    from sourcehub.modules.outbox import service as outbox

    link = f"{settings.app_base_url}/accept-invitation?token={raw_token}"
    await outbox.enqueue_to(
        session, "worker_invitation",
        {"full_name": full_name, "org_name": org_name, "link": link,
         "ttl_days": settings.invitation_ttl_days},
        to_email=email, to_name=full_name, entity=("crowd_worker", worker_id),
        label=f"Crowd invitation · {reference_code} {full_name}", scrub=True,
        resend_until=dt.datetime.now(dt.UTC)
        + dt.timedelta(days=settings.invitation_ttl_days),
    )


async def _create_invited(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    email: str,
    full_name: str,
    phone: str | None,
    skills: list[str],
    trained: bool,
) -> tuple[dict[str, Any], str]:
    """The database half of an invitation: app_user (invited), worker grant,
    roster row and invitation, all or nothing, in one database function. RLS
    applies inside it, so only an organisation that may write its own roster
    gets through. Returns the function's row and the raw token to mail; the
    caller decides how to audit and send, because a single invitation and an
    import of fifty do those differently."""
    raw, digest = new_opaque_token()
    try:
        row = (
            await session.execute(
                text(
                    "SELECT * FROM invite_worker(CAST(:email AS citext), :name, :phone, "
                    "CAST(:skills AS text[]), :trained, :uid, :thash, "
                    "make_interval(days => :ttl))"
                ),
                {
                    "email": email, "name": full_name, "phone": phone, "skills": skills,
                    "trained": trained, "uid": claims.user_id, "thash": digest,
                    "ttl": settings.invitation_ttl_days,
                },
            )
        ).mappings().one()
    except DBAPIError as e:
        msg = str(e.orig) if e.orig else str(e)
        if "app_user_email_key" in msg or "crowd_worker_user_id_key" in msg:
            raise NetworkError("A user with this email already exists.") from None
        raise
    return dict(row), raw


async def invite_worker(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    email: str,
    full_name: str,
    phone: str | None,
    skills: list[str],
    trained: bool,
) -> dict[str, Any]:
    """One crowd resource from the form: created, audited, emailed."""
    row, raw = await _create_invited(
        session, claims, email=email, full_name=full_name, phone=phone, skills=skills,
        trained=trained,
    )
    await audit.log(
        session, "worker.invited",
        f"Invited {full_name} ({row['reference_code']}) as a crowd resource",
        [row["worker_id"], row["user_id"], claims.org_id],
    )
    await _queue_worker_invitation(
        session, email=email, full_name=full_name, org_name=claims.org_name, raw_token=raw,
        worker_id=row["worker_id"], reference_code=row["reference_code"],
    )
    return await _worker_by_id(session, row["worker_id"])


# ---------------------------------------------------------------------------
# Importing a roster from a file
#
# The browser parses the spreadsheet and sends plain rows; nothing here reads
# a file. Two steps: check_import judges every row and writes nothing, so the
# person sees exactly what will happen before anything does; import_rows then
# takes a batch of what they agreed to. Each row is its own savepoint — the
# single-add path discovers a duplicate address only when the insert fails,
# and without a savepoint that failure would abort the whole batch. One audit
# line and one mail connection per batch, the shape task offers use.
# ---------------------------------------------------------------------------

IMPORT_CHECK_LIMIT = 1000  # rows per file, judged in one request
IMPORT_BATCH_LIMIT = 100  # rows written per request; the console sends 50
NAME_MAX = 200
PHONE_MAX = 40

_EMAIL = TypeAdapter(EmailStr)


@dataclass(frozen=True, slots=True)
class ImportRow:
    row: int
    display_name: str
    email: str | None
    phone: str | None
    skills: tuple[str, ...]
    trained: bool


@dataclass(frozen=True, slots=True)
class Verdict:
    row: int
    # ready: imported as is · warning: imported, with a caveat · error: not
    # imported, the row is wrong · skipped: not imported, nothing wrong (it is
    # already on the roster)
    status: str
    reasons: tuple[str, ...]
    normalized: ImportRow


def _clean(v: Any) -> str:
    return " ".join(str(v).split()) if v is not None else ""


def plan_import(
    rows: list[dict[str, Any]], *, taken: set[str], mine: set[str], known_skills: frozenset[str]
) -> list[Verdict]:
    """What each row would become, and why not. Pure: the two sets are what
    the database was asked (which addresses exist on the platform at all, and
    which are already on this roster), so the rules are testable without it."""
    out: list[Verdict] = []
    seen: dict[str, int] = {}
    for raw in rows:
        errors: list[str] = []
        warnings: list[str] = []
        skipped: str | None = None

        name = _clean(raw.get("display_name"))
        if len(name) < 2:
            errors.append("Name is missing or too short.")
        elif len(name) > NAME_MAX:
            errors.append(f"Name is longer than {NAME_MAX} characters.")

        email = _clean(raw.get("email")).lower() or None
        if email is not None:
            try:
                _EMAIL.validate_python(email)
            except ValidationError:
                errors.append(f"Not an email address: {email}.")
                email = None
        if email is not None:
            if email in seen:
                errors.append(f"Duplicate of row {seen[email]} (same email).")
            else:
                seen[email] = int(raw.get("row") or 0)
                if email in mine:
                    skipped = "Already on your roster."
                elif email in taken:
                    errors.append("This email belongs to someone else on the platform.")

        phone = _clean(raw.get("phone")) or None
        if phone is not None and len(phone) > PHONE_MAX:
            errors.append(f"Phone is longer than {PHONE_MAX} characters.")

        wanted = [
            _clean(s).lower().replace(" ", "_") for s in (raw.get("skills") or []) if _clean(s)
        ]
        skills = tuple(dict.fromkeys(s for s in wanted if s in known_skills))
        unknown = [s for s in wanted if s not in known_skills]
        if unknown:
            warnings.append("Unknown skill(s) dropped: " + ", ".join(dict.fromkeys(unknown)) + ".")

        if email is None and not errors:
            warnings.append(
                "No email: added to the roster only, and cannot be offered work until invited."
            )

        status = "error" if errors else "skipped" if skipped else "warning" if warnings else "ready"
        reasons = tuple(errors) if errors else ((skipped,) if skipped else ()) + tuple(warnings)
        out.append(
            Verdict(
                row=int(raw.get("row") or 0),
                status=status,
                reasons=reasons,
                normalized=ImportRow(
                    row=int(raw.get("row") or 0),
                    display_name=name,
                    email=email,
                    phone=phone,
                    skills=skills,
                    trained=bool(raw.get("trained")),
                ),
            )
        )
    return out


def _verdict_dict(v: Verdict) -> dict[str, Any]:
    n = v.normalized
    return {
        "row": v.row,
        "status": v.status,
        "reasons": list(v.reasons),
        "normalized": {
            "row": n.row, "display_name": n.display_name, "email": n.email, "phone": n.phone,
            "skills": list(n.skills), "trained": n.trained,
        },
    }


async def _judge(
    session: AsyncSession, claims: AccessClaims, rows: list[dict[str, Any]],
    known_skills: frozenset[str],
) -> list[Verdict]:
    emails = sorted({e for e in (_clean(r.get("email")).lower() for r in rows) if e})
    taken: set[str] = set()
    mine: set[str] = set()
    if emails:
        # Above RLS, one round trip: which addresses exist anywhere on the
        # platform. email_is_taken answers one boolean per address and nothing
        # else, which is all an importer is entitled to learn.
        for r in (
            await session.execute(
                text(
                    "SELECT e AS email, email_is_taken(e) AS taken "
                    "FROM unnest(CAST(:emails AS citext[])) AS e"
                ),
                {"emails": emails},
            )
        ).mappings():
            if r["taken"]:
                taken.add(str(r["email"]).lower())
        # and which of them are already this organisation's own roster
        for e in (
            await session.execute(
                text(
                    "SELECT email FROM crowd_worker "
                    "WHERE aggregator_org_id = :org AND deleted_at IS NULL "
                    "  AND email = ANY(CAST(:emails AS citext[]))"
                ),
                {"org": claims.org_id, "emails": emails},
            )
        ).scalars():
            mine.add(str(e).lower())
    return plan_import(rows, taken=taken, mine=mine, known_skills=known_skills)


async def check_import(
    session: AsyncSession, claims: AccessClaims, rows: list[dict[str, Any]],
    known_skills: frozenset[str],
) -> dict[str, Any]:
    """Every row's verdict, and the rows as they would be written. Writes
    nothing; the console shows this before anything is imported and sends the
    normalised rows back."""
    verdicts = await _judge(session, claims, rows, known_skills)
    counts = {"ready": 0, "warning": 0, "error": 0, "skipped": 0}
    for v in verdicts:
        counts[v.status] += 1
    return {"rows": [_verdict_dict(v) for v in verdicts], "counts": counts}


async def import_rows(
    session: AsyncSession, claims: AccessClaims, rows: list[dict[str, Any]],
    known_skills: frozenset[str],
) -> dict[str, Any]:
    """Write one batch. Judged again first — the file may be minutes old and
    the roster has moved — then each row in its own savepoint, so a row that
    fails leaves the rest of the batch standing."""
    verdicts = await _judge(session, claims, rows, known_skills)
    results: list[dict[str, Any]] = []
    added = invited = skipped = 0

    for v in verdicts:
        if v.status in ("error", "skipped"):
            skipped += 1
            results.append({"row": v.row, "outcome": "skipped", "reason": " ".join(v.reasons)})
            continue
        n = v.normalized
        try:
            async with session.begin_nested():
                if n.email:
                    row, raw = await _create_invited(
                        session, claims, email=n.email, full_name=n.display_name,
                        phone=n.phone, skills=list(n.skills), trained=n.trained,
                    )
                    await _queue_worker_invitation(
                        session, email=n.email, full_name=n.display_name,
                        org_name=claims.org_name, raw_token=raw, worker_id=row["worker_id"],
                        reference_code=row["reference_code"],
                    )
                    results.append(
                        {"row": v.row, "outcome": "invited", "worker_id": row["worker_id"]}
                    )
                    invited += 1
                else:
                    w = await add_worker(
                        session, claims, n.display_name, list(n.skills), n.trained, n.phone
                    )
                    results.append({"row": v.row, "outcome": "added", "worker_id": w["id"]})
                    added += 1
        except NetworkError as e:
            # the address was taken between the check and now
            skipped += 1
            results.append({"row": v.row, "outcome": "skipped", "reason": str(e)})
        except DBAPIError as e:
            skipped += 1
            what = str(e.orig) if e.orig else str(e)
            results.append(
                {"row": v.row, "outcome": "skipped", "reason": f"Could not be saved: {what[:160]}"}
            )

    # The invitation mails are queued rows now (db/490), sent within seconds and
    # visible on the Ops mail log; nothing about delivery is known here.
    noun = "crowd resource" if added + invited == 1 else "crowd resources"
    await audit.log(
        session, "roster.imported",
        f"Imported {added + invited} {noun} "
        f"({invited} invited, {added} roster-only); {skipped} skipped",
        [claims.org_id],
        {"added": added, "invited": invited, "skipped": skipped},
    )
    return {"added": added, "invited": invited, "skipped": skipped, "rows": results}


async def resend_worker_invitation(
    session: AsyncSession, claims: AccessClaims, worker_id: uuid.UUID
) -> None:
    """Rotate the token and send the email again. The invitation row belongs
    to the onboarding module, so it is addressed by SQL rather than by its
    ORM model."""
    w = (
        await session.execute(select(CrowdWorker).where(CrowdWorker.id == worker_id))
    ).scalar_one_or_none()
    if w is None:
        raise LookupError("crowd resource not found")
    if w.user_id is None or not w.email:
        raise NetworkError("This roster entry has no login to invite.")
    inv = (
        await session.execute(
            text(
                "SELECT id, accepted_at FROM invitation "
                "WHERE user_id = :u AND revoked_at IS NULL "
                "ORDER BY invited_at DESC LIMIT 1"
            ),
            {"u": w.user_id},
        )
    ).mappings().one_or_none()
    if inv is None or inv["accepted_at"] is not None:
        raise NetworkError("The invitation was already accepted.")

    raw, digest = new_opaque_token()
    await session.execute(
        text(
            "UPDATE invitation SET token_hash = :h, "
            "       expires_at = now() + make_interval(days => :ttl), "
            "       reminder_count = reminder_count + 1, last_reminder_at = now() "
            "WHERE id = :id"
        ),
        {"h": digest, "ttl": settings.invitation_ttl_days, "id": inv["id"]},
    )
    await audit.log(session, "worker.invitation_resent",
                    f"Re-sent the invitation to {w.display_name} ({w.reference_code})",
                    [w.id, w.user_id, claims.org_id])
    await _queue_worker_invitation(
        session, email=w.email, full_name=w.display_name, org_name=claims.org_name,
        raw_token=raw, worker_id=w.id, reference_code=w.reference_code,
    )


async def update_worker(
    session: AsyncSession, claims: AccessClaims, worker_id: uuid.UUID, skills: list[str]
) -> None:
    """Skills, after the fact. The roster row had no UPDATE path at all, so a
    worker's skills were whatever was typed when they were added and could
    never be corrected.

    RLS decides whose roster this is — crowd_worker_write scopes it to the
    aggregator org — so there is no org check here beyond the lookup failing.
    """
    w = (
        await session.execute(select(CrowdWorker).where(CrowdWorker.id == worker_id))
    ).scalar_one_or_none()
    if w is None:
        raise LookupError("crowd resource not found")
    w.skills = skills
    await audit.log(
        session, "worker.updated",
        f"Set skills for {w.display_name} ({w.reference_code})",
        [w.id, claims.org_id],
    )


async def set_worker_status(
    session: AsyncSession, claims: AccessClaims, worker_id: uuid.UUID, status: str
) -> None:
    w = (
        await session.execute(select(CrowdWorker).where(CrowdWorker.id == worker_id))
    ).scalar_one_or_none()
    if w is None:
        raise LookupError("crowd resource not found")
    w.status = status
    if status == "offboarded" and w.user_id is not None:
        # An offboarded worker can no longer sign in to this organisation. A
        # live access token dies at its own TTL; refresh re-resolves grants.
        await session.execute(
            text(
                "UPDATE user_role_grant SET revoked_at = now(), revoked_by = :me "
                "WHERE user_id = :u AND org_id = :org AND revoked_at IS NULL"
            ),
            {"me": claims.user_id, "u": w.user_id, "org": claims.org_id},
        )
        await audit.log(session, "worker.offboarded",
                        f"Offboarded {w.display_name} ({w.reference_code})",
                        [w.id, w.user_id, claims.org_id])


# ---------------------------------------------------------------------------
# Ratings — four kinds, one table (db/380_ratings.sql)
#
# The caller names the kind, the subject, a score and a comment, and nothing
# else: the database trigger finds both parties from the subject, refuses the
# wrong state or the wrong rater, and stamps the row. Every refusal arrives
# here as a DBAPIError whose text is the trigger's own sentence (or a partial
# unique index, for a second rating), and leaves as a RatingError the console
# can show. A rating is never edited: the login holds no UPDATE or DELETE.
#
# A comment is required everywhere, and short enough to be one. The console
# gates its button on the same minimum (frontend/src/shared/rating.tsx).
# ---------------------------------------------------------------------------

RATING_COMMENT_MIN = 3
RATING_COMMENT_MAX = 2000

RATING_KINDS = ("client_partner", "partner_client", "partner_supplier", "supplier_worker")

# the column the subject id lands in, per kind; the trigger derives the rest
_SUBJECT_COLUMN = {
    "client_partner": "contract_id",
    "partner_client": "contract_id",
    "partner_supplier": "task_id",
    "supplier_worker": "assignment_id",
}
_RATEE = {
    "client_partner": "delivery partner",
    "partner_client": "client",
    "partner_supplier": "supplier",
    "supplier_worker": "crowd resource",
}
_ONCE = ("rating_once_per_contract", "rating_once_per_task", "rating_once_per_assignment")


class RatingError(NetworkError):
    pass


def _rating_reason(e: DBAPIError) -> str:
    """The database's refusal, as a sentence: the trigger's own words, or
    the plain meaning of the partial unique index that stopped a repeat."""
    msg = str(getattr(e, "orig", e))
    if any(name in msg for name in _ONCE):
        return "This work has already been rated; a rating cannot be changed."
    at = msg.find("rating: ")
    if at >= 0:
        return msg[at:].split("\n", 1)[0].strip()
    if "row-level security" in msg:
        return "You cannot rate here."
    return "The database refused the rating."


async def record_rating(
    session: AsyncSession,
    claims: AccessClaims,
    kind: str,
    subject_id: uuid.UUID,
    score: int,
    comment: str,
) -> dict[str, Any]:
    """One rating of `kind`, of the subject (a contract, task or assignment
    id). Returns the stored row, parties included, as the trigger filled it."""
    if kind not in _SUBJECT_COLUMN:
        raise RatingError("That is not a kind of rating.")
    comment = (comment or "").strip()
    if len(comment) < RATING_COMMENT_MIN:
        raise RatingError(
            f"Add a comment of at least {RATING_COMMENT_MIN} characters; "
            "ratings without one are not recorded."
        )
    if len(comment) > RATING_COMMENT_MAX:
        raise RatingError(f"Keep the comment under {RATING_COMMENT_MAX} characters.")
    if not 1 <= score <= 5:
        raise RatingError("A score is 1 to 5.")

    q = text(
        "INSERT INTO rating (kind, " + _SUBJECT_COLUMN[kind] + ", score, comment, created_by) "
        "VALUES (CAST(:kind AS rating_kind), :subject, :score, :comment, :uid) "
        "RETURNING id, kind, contract_id, task_id, assignment_id, "
        "          from_org_id, to_org_id, to_user_id, score, comment, created_at"
    )
    try:
        row = (
            await session.execute(
                q,
                {"kind": kind, "subject": subject_id, "score": score,
                 "comment": comment, "uid": claims.user_id},
            )
        ).mappings().one()
    except DBAPIError as e:
        raise RatingError(_rating_reason(e)) from None
    out = dict(row)

    # Who hears of it. The crowd resource never does: a worker's rating is the
    # supplier's and Ops's to see, and the phone has no screen for it.
    if kind == "partner_client":
        await notifier.notify(
            session, out["to_org_id"],
            f"Your delivery partner rated the completed work {score}/5.",
            "deliveries", {"id": str(out["contract_id"])},
        )
    elif kind == "partner_supplier":
        await notifier.notify(
            session, out["to_org_id"],
            f"Your delivery partner rated a task you completed {score}/5.",
            "tasks", {"id": str(out["task_id"])},
        )

    # The comment is for the parties; the trail carries the score alone. For a
    # worker rating the contract's partner is NOT in scope: scope is what the
    # audit page shows an organisation, and the partner is not a party.
    scope = [out["id"], out["contract_id"], out["from_org_id"]]
    for key in ("task_id", "assignment_id", "to_org_id", "to_user_id"):
        if out[key] is not None:
            scope.append(out[key])
    await audit.log(
        session, "rating.recorded", f"Rated the {_RATEE[kind]} {score}/5",
        scope, {"kind": kind, "score": score},
    )
    return out


async def ratings_for(
    session: AsyncSession, contract_id: uuid.UUID | None = None
) -> list[dict[str, Any]]:
    """Every rating the caller may read (RLS: a party to it, or Ops), newest
    first; one contract's when asked. A crowd resource's name comes from the
    roster, or failing that the person's own."""
    q = text(
        "SELECT r.id, r.kind, r.contract_id, r.task_id, r.assignment_id, "
        "       r.from_org_id, r.to_org_id, r.to_user_id, "
        "       r.score, r.comment, r.created_at, "
        "       f.name AS from_name, "
        "       coalesce(t.name, w.display_name, u.full_name) AS to_name "
        "FROM rating r "
        "LEFT JOIN organisation f ON f.id = r.from_org_id "
        "LEFT JOIN organisation t ON t.id = r.to_org_id "
        "LEFT JOIN crowd_worker w ON w.user_id = r.to_user_id AND w.deleted_at IS NULL "
        "LEFT JOIN app_user u ON u.id = r.to_user_id "
        + ("WHERE r.contract_id = :cid " if contract_id else "")
        + "ORDER BY r.created_at DESC"
    )
    rows = (
        await session.execute(q, {"cid": contract_id} if contract_id else {})
    ).mappings().all()
    return [dict(r) for r in rows]
