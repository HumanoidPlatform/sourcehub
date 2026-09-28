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
from sourcehub.config import CAPTURE_APP, PRODUCT, settings
from sourcehub.modules.audit import service as audit
from sourcehub.modules.network.models import CrowdWorker, Equipment, Loan, Rating
from sourcehub.modules.notify import service as notifier


class NetworkError(Exception):
    pass


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
    actually see is the one worth not delegating."""
    rows = (
        await session.execute(
            text(
                "SELECT e.id, e.reference_code, e.equipment_type, e.total_units, "
                "       e.calibrated_on, e.calibration_expires_on, e.sponsor_org_id, "
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
    return [
        {**dict(r), "units_available": r["total_units"] - r["units_on_loan"]}
        for r in rows
    ]


async def add_equipment(
    session: AsyncSession,
    claims: AccessClaims,
    equipment_type: str,
    total_units: int,
    calibrated_on: dt.date | None,
    calibration_expires_on: dt.date | None,
) -> dict[str, Any]:
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
        created_by=claims.user_id,
    )
    session.add(e)
    await session.flush()
    await audit.log(session, "equipment.added",
                    f"Added {equipment_type}, {total_units} units ({ref})",
                    [e.id, claims.org_id])
    return {"id": e.id, "reference_code": ref, "equipment_type": equipment_type,
            "total_units": total_units}


_EDITABLE = ("equipment_type", "total_units", "calibrated_on", "calibration_expires_on")


async def update_equipment(
    session: AsyncSession,
    claims: AccessClaims,
    equipment_id: uuid.UUID,
    changes: dict[str, Any],
) -> dict[str, Any]:
    """Edit a device's details: type, unit count, calibration dates.

    `changes` holds only the fields the caller SENT (the route reads pydantic's
    model_fields_set), so a date is cleared by sending null explicitly and an
    omitted field is left alone. Until this existed a sponsor could add a
    device and nothing else — a typo in the type or a fleet that grew were
    permanent.

    Two things the schema does not enforce are refused here. total_units may
    not fall below what is out on loan: check_loan_availability only fires when
    a LOAN changes, so nothing else would notice a sponsor shrinking a fleet
    underneath live loans. And an expiry before its calibration date is a typo,
    not a record.
    """
    unknown = set(changes) - set(_EDITABLE)
    if unknown:
        raise NetworkError(f"Not editable here: {', '.join(sorted(unknown))}.")
    if not changes:
        raise NetworkError("Nothing to change.")
    for required in ("equipment_type", "total_units"):
        if required in changes and changes[required] is None:
            raise NetworkError(f"{required.replace('_', ' ').capitalize()} cannot be blank.")
    if "equipment_type" in changes:
        changes["equipment_type"] = changes["equipment_type"].strip()
        if len(changes["equipment_type"]) < 2:
            raise NetworkError("Give the equipment a name.")

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
    if moved:
        before = {k: getattr(e, k) for k in moved}
        for field, value in moved.items():
            setattr(e, field, value)
        e.updated_by = claims.user_id
        await session.flush()
        await audit.log(
            session, "equipment.updated",
            f"{e.reference_code} updated: "
            + ", ".join(f"{k} {before[k]} → {v}" for k, v in moved.items()),
            [e.id, claims.org_id],
        )
    return {
        "id": e.id, "reference_code": e.reference_code, "equipment_type": e.equipment_type,
        "total_units": e.total_units,
        "calibrated_on": e.calibrated_on, "calibration_expires_on": e.calibration_expires_on,
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

    now = dt.datetime.now(dt.timezone.utc)

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
    "SELECT w.id, w.reference_code, w.display_name, w.skills, w.status, w.trained, w.rating, "
    "       w.email, w.phone, w.user_id, u.status AS user_status, "
    "       inv.accepted_at, inv.expires_at, coalesce(ta.open_count, 0) AS open_assignments "
    "FROM crowd_worker w "
    "LEFT JOIN app_user u ON u.id = w.user_id "
    "LEFT JOIN LATERAL (SELECT i.accepted_at, i.expires_at FROM invitation i "
    "                    WHERE i.user_id = w.user_id AND i.revoked_at IS NULL "
    "                    ORDER BY i.invited_at DESC LIMIT 1) inv ON true "
    "LEFT JOIN LATERAL (SELECT count(*) AS open_count FROM task_assignment a "
    "                    WHERE a.worker_user_id = w.user_id "
    "                      AND a.status IN ('assigned','in_progress','submitted','rejected')) ta "
    "          ON true "
    "WHERE w.deleted_at IS NULL "
    "  AND (CAST(:wid AS uuid) IS NULL OR w.id = CAST(:wid AS uuid)) "
    "ORDER BY w.reference_code"
)


def _invitation_status(r: Any) -> str:
    if r["user_id"] is None:
        return "none"
    if r["user_status"] == "active" or r["accepted_at"] is not None:
        return "accepted"
    if r["expires_at"] is not None and r["expires_at"] < dt.datetime.now(dt.timezone.utc):
        return "expired"
    return "pending"


def _worker_dict(r: Any) -> dict[str, Any]:
    return {
        "id": r["id"], "reference_code": r["reference_code"],
        "display_name": r["display_name"], "skills": list(r["skills"] or []),
        "status": r["status"], "trained": r["trained"], "rating": r["rating"],
        "email": r["email"], "phone": r["phone"], "user_id": r["user_id"],
        "invitation_status": _invitation_status(r),
        "open_assignments": int(r["open_assignments"]),
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


Message = tuple[str, str, str, str | None]  # (to, subject, text, html) — platform.mail's shape


def _invitation_message(email: str, full_name: str, org_name: str, raw_token: str) -> Message:
    link = f"{settings.app_base_url}/accept-invitation?token={raw_token}"
    return (
        email,
        f"You're invited to {PRODUCT} — {org_name}",
        f"Hello {full_name},\n\n"
        f"{org_name} has added you as a crowd resource on {PRODUCT}. Set your password\n"
        f"within {settings.invitation_ttl_days} days, then sign in to the {CAPTURE_APP} app\n"
        f"with this email address:\n\n  {link}\n\n"
        f"No one at {PRODUCT} knows this link's token or your future password.",
        None,
    )


async def _send_worker_invitation(
    email: str, full_name: str, org_name: str, raw_token: str
) -> None:
    """Best-effort, like the onboarding invitation: the worker exists either
    way, and the invitation can be re-sent. A dead SMTP must not roll back
    the invite."""
    from sourcehub.platform.mail.smtp import send_mail

    to, subject, body, _html = _invitation_message(email, full_name, org_name, raw_token)
    try:
        await send_mail(to, subject, body)
    except OSError:
        pass


async def _send_invitations(messages: list[Message]) -> list[str | None]:
    """A batch over one connection, one error slot per message — the shape
    task offers use (delivery._send_offer_emails). Best-effort as above."""
    from sourcehub.platform.mail.smtp import send_many

    if not messages:
        return []
    try:
        return await send_many(messages)
    except OSError as e:
        return [str(e)[:300]] * len(messages)


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
    await _send_worker_invitation(email, full_name, claims.org_name, raw)
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
    messages: list[Message] = []
    invited_at: list[int] = []  # index into results of each row with a message
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
                    messages.append(
                        _invitation_message(n.email, n.display_name, claims.org_name, raw)
                    )
                    invited_at.append(len(results))
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

    errors = await _send_invitations(messages)
    failed = 0
    for i, err in zip(invited_at, errors, strict=True):
        if err:
            failed += 1
            results[i]["invitation_error"] = err

    noun = "crowd resource" if added + invited == 1 else "crowd resources"
    await audit.log(
        session, "roster.imported",
        f"Imported {added + invited} {noun} "
        f"({invited} invited, {added} roster-only); {skipped} skipped",
        [claims.org_id],
        {"added": added, "invited": invited, "skipped": skipped, "invitation_failures": failed},
    )
    return {
        "added": added, "invited": invited, "skipped": skipped, "invitation_failures": failed,
        "rows": results,
    }


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
    await _send_worker_invitation(w.email, w.display_name, claims.org_name, raw)


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
# Ratings
# ---------------------------------------------------------------------------

async def rate_counterparty(
    session: AsyncSession,
    claims: AccessClaims,
    contract_id: uuid.UUID,
    to_org_id: uuid.UUID,
    score: int,
    comment: str,
) -> None:
    session.add(
        Rating(
            contract_id=contract_id,
            from_org_id=claims.org_id,
            to_org_id=to_org_id,
            score=score,
            comment=comment,
            created_by=claims.user_id,
        )
    )
    await session.flush()


async def ratings_for(
    session: AsyncSession, contract_id: uuid.UUID | None = None
) -> list[dict[str, Any]]:
    q = text(
        "SELECT r.id, r.contract_id, r.score, r.comment, r.created_at, "
        "       f.name AS from_name, t.name AS to_name "
        "FROM rating r JOIN organisation f ON f.id = r.from_org_id "
        "JOIN organisation t ON t.id = r.to_org_id "
        + ("WHERE r.contract_id = :cid " if contract_id else "")
        + "ORDER BY r.created_at DESC"
    )
    rows = (
        await session.execute(q, {"cid": contract_id} if contract_id else {})
    ).mappings().all()
    return [dict(r) for r in rows]
