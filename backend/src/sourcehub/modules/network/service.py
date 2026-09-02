"""network — aggregators, businesses, sponsors, equipment, loans and rosters.

Business rules, and the ONLY public surface of this module.

The stock arithmetic the prototype never had lives in the database (the
check_loan_availability trigger); this service translates its refusals into
messages a person can act on. Crowd workers are roster records, never platform
users — they have no credential and no grant, by design.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
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
# Crowd roster — aggregator-internal, never platform users
# ---------------------------------------------------------------------------

async def list_workers(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(CrowdWorker)
            .where(CrowdWorker.deleted_at.is_(None))
            .order_by(CrowdWorker.reference_code)
        )
    ).scalars().all()
    return [
        {
            "id": w.id, "reference_code": w.reference_code,
            "display_name": w.display_name, "skill": w.skill,
            "status": w.status, "trained": w.trained, "rating": w.rating,
        }
        for w in rows
    ]


async def add_worker(
    session: AsyncSession, claims: AccessClaims,
    display_name: str, skill: str | None, trained: bool,
) -> dict[str, Any]:
    ref = (
        await session.execute(text("SELECT next_reference_code('WKR','seq_ref_worker')"))
    ).scalar_one()
    w = CrowdWorker(
        reference_code=ref, aggregator_org_id=claims.org_id,
        display_name=display_name, skill=skill, trained=trained,
    )
    session.add(w)
    await session.flush()
    return {"id": w.id, "reference_code": ref, "display_name": display_name,
            "skill": skill, "status": w.status, "trained": trained, "rating": None}


async def set_worker_status(
    session: AsyncSession, claims: AccessClaims, worker_id: uuid.UUID, status: str
) -> None:
    w = (
        await session.execute(select(CrowdWorker).where(CrowdWorker.id == worker_id))
    ).scalar_one_or_none()
    if w is None:
        raise LookupError("worker not found")
    w.status = status


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
