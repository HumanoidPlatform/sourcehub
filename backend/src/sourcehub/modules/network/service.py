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
from typing import Any

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
    equipment it holds a live loan on. All one query — RLS is the filter."""
    rows = (
        await session.execute(
            text(
                "SELECT e.id, e.reference_code, e.equipment_type, e.total_units, e.status, "
                "       e.calibrated_on, e.calibration_expires_on, e.sponsor_org_id, "
                "       o.name AS sponsor_name, "
                "       equipment_units_on_loan(e.id) AS units_on_loan "
                "FROM equipment e JOIN organisation o ON o.id = e.sponsor_org_id "
                "WHERE e.deleted_at IS NULL ORDER BY e.reference_code"
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
            "total_units": total_units, "status": e.status}


async def set_equipment_status(
    session: AsyncSession, claims: AccessClaims, equipment_id: uuid.UUID, status: str
) -> None:
    e = (
        await session.execute(select(Equipment).where(Equipment.id == equipment_id))
    ).scalar_one_or_none()
    if e is None:
        raise LookupError("equipment not found")
    e.status = status
    e.updated_by = claims.user_id
    await audit.log(session, "equipment.status",
                    f"{e.reference_code} marked {status}", [e.id, claims.org_id])


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
        "requests", {"id": str(loan.id)},
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
    eq = (
        await session.execute(select(Equipment).where(Equipment.id == loan.equipment_id))
    ).scalar_one()

    if decision == "approved":
        if loan.status != "pending":
            raise NetworkError(f"A {loan.status} request cannot be approved.")
        loan.status = "approved"
        loan.decided_at = now
        loan.decided_by = claims.user_id
        eq.status = "in_use"
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
        still_out = (
            await session.execute(
                text(
                    "SELECT equipment_units_on_loan(:e) - :mine"
                ),
                {"e": loan.equipment_id, "mine": loan.units},
            )
        ).scalar_one()
        if still_out <= 0:
            eq.status = "available"
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
    "SELECT w.id, w.reference_code, w.display_name, w.skill, w.status, w.trained, w.rating, "
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
        "display_name": r["display_name"], "skill": r["skill"],
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
    display_name: str, skill: str | None, trained: bool,
) -> dict[str, Any]:
    """A roster-only entry: no email, no login. Kept for records about people
    who never use the app."""
    ref = (
        await session.execute(text("SELECT next_reference_code('WKR','seq_ref_worker')"))
    ).scalar_one()
    w = CrowdWorker(
        reference_code=ref, aggregator_org_id=claims.org_id,
        display_name=display_name, skill=skill, trained=trained,
    )
    session.add(w)
    await session.flush()
    return await _worker_by_id(session, w.id)


async def _send_worker_invitation(
    email: str, full_name: str, org_name: str, raw_token: str
) -> None:
    """Best-effort, like the onboarding invitation: the worker exists either
    way, and the invitation can be re-sent. A dead SMTP must not roll back
    the invite."""
    from sourcehub.platform.mail.smtp import send_mail

    link = f"{settings.app_base_url}/accept-invitation?token={raw_token}"
    try:
        await send_mail(
            email,
            f"You're invited to {PRODUCT} — {org_name}",
            f"Hello {full_name},\n\n"
            f"{org_name} has added you as a field worker on {PRODUCT}. Set your password\n"
            f"within {settings.invitation_ttl_days} days, then sign in to the {CAPTURE_APP} app\n"
            f"with this email address:\n\n  {link}\n\n"
            f"No one at {PRODUCT} knows this link's token or your future password.",
        )
    except OSError:
        pass


async def invite_worker(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    email: str,
    full_name: str,
    phone: str | None,
    skill: str | None,
    trained: bool,
) -> dict[str, Any]:
    """One call into the database function: app_user (invited), worker grant,
    roster row and invitation, all or nothing. RLS applies inside it, so only
    an organisation that may write its own roster gets through."""
    raw, digest = new_opaque_token()
    try:
        row = (
            await session.execute(
                text(
                    "SELECT * FROM invite_worker(CAST(:email AS citext), :name, :phone, :skill, "
                    ":trained, :uid, :thash, make_interval(days => :ttl))"
                ),
                {
                    "email": email, "name": full_name, "phone": phone, "skill": skill,
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

    await audit.log(
        session, "worker.invited",
        f"Invited {full_name} ({row['reference_code']}) as a field worker",
        [row["worker_id"], row["user_id"], claims.org_id],
    )
    await _send_worker_invitation(email, full_name, claims.org_name, raw)
    return await _worker_by_id(session, row["worker_id"])


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
        raise LookupError("worker not found")
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


async def set_worker_status(
    session: AsyncSession, claims: AccessClaims, worker_id: uuid.UUID, status: str
) -> None:
    w = (
        await session.execute(select(CrowdWorker).where(CrowdWorker.id == worker_id))
    ).scalar_one_or_none()
    if w is None:
        raise LookupError("worker not found")
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
