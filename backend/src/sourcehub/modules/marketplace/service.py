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

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit
from sourcehub.modules.marketplace import pricing
from sourcehub.modules.marketplace.models import Proposal, Request
from sourcehub.modules.notify import service as notifier


class MarketplaceError(Exception):
    pass


# ---------------------------------------------------------------------------
# The bidding window
#
# proposals_close_at is the one clock the marketplace keeps. "Closed" is never
# stored: it is derived from the time, the way task offers derive 'expired'
# from respond_by (db/130). RLS keys on the stored status, so it never has to
# know — every partner keeps seeing a closed request and its buyer — and what
# changes is only what the server accepts and what the screens say. A request
# with no deadline (every one published before deadlines existed) stays open
# until it is awarded.
# ---------------------------------------------------------------------------

REMIND_BEFORE = dt.timedelta(hours=24)


def bidding_is_open(close_at: dt.datetime | None, now: dt.datetime) -> bool:
    return close_at is None or close_at > now


def fmt_utc(d: dt.datetime) -> str:
    """'5 Oct 2026, 18:00 UTC' — for refusals and notifications, which reach
    people in several time zones. Built by hand: strftime's %-d is not portable."""
    u = d.astimezone(dt.timezone.utc)
    return f"{u.day} {u:%b %Y}, {u:%H:%M} UTC"


def deadline_problem(
    close_at: dt.datetime | None, delivery_due_on: dt.date | None, now: dt.datetime
) -> str | None:
    """Why this deadline cannot go live, or None.

    The date is compared in UTC because that is what the database CHECK
    (request_close_before_delivery) does. Comparing in the sender's own offset
    let an evening time west of Greenwich pass here and fail there, as a 500.
    """
    if close_at is None:
        return "Set when bidding closes."
    if close_at <= now:
        return "Bidding must close in the future."
    close_date = close_at.astimezone(dt.timezone.utc).date()
    if delivery_due_on is not None and close_date > delivery_due_on:
        return "Bidding must close on or before the delivery date (measured in UTC)."
    return None


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


def _row(
    r: Request, effective: str, proposal_count: int, viewer_org: uuid.UUID | None = None,
    client_name: str | None = None, now: dt.datetime | None = None,
) -> dict[str, Any]:
    """The request as the API returns it.

    Grouped rather than 57 flat keys, following the shape `people` already set:
    a bidder reads `compliance` as one block because that is how they decide
    whether they can take the work.

    budget_disclosed hides the amount from everyone except the client that owns
    the request. Nothing in the schema says what "disclosed" covers — no RLS
    policy changed, so the row itself is still readable by every bidding tenant
    and enforcement has to live here. The amount and the total it implies are
    the conservative reading of it, and the conservative reading is the right
    default for a field whose failure mode is leaking a client's ceiling to the
    people bidding against it. The basis, unit and block stay visible: a partner
    has to know what it is quoting per.
    """
    own = viewer_org is not None and viewer_org == r.client_org_id
    show_budget = r.budget_disclosed or own
    return {
        "id": r.id,
        "reference_code": r.reference_code,
        "client_org_id": r.client_org_id,
        # None when the reader may not see the buyer — a client whose
        # request has closed, to a partner that never bid. The console
        # shows the panel only when this is filled.
        "client_name": client_name,
        "title": r.title,
        "category": r.category,
        "status": effective,
        "stored_status": r.status,
        "proposal_count": proposal_count,
        "geography": r.geography,
        "compliance_notes": r.compliance_notes,
        "objective": r.objective,
        "use_case": r.use_case,
        "spec": {
            "quality": r.spec_quality,
            "target_quantity": r.target_quantity,
            "target_unit": r.target_unit,
            "capture": r.capture_spec,
            "countries": r.countries,
            "location_type": r.location_type,
            "sampling_frame": r.sampling_frame,
        },
        "acceptance": r.acceptance,
        "quality": {
            "thresholds": r.quality_thresholds,
            "rejection_policy": r.rejection_policy,
        },
        "compliance": {
            "people_in_frame": r.people_in_frame,
            "minors_policy": r.minors_policy,
            "deidentification": r.deidentification,
            "regulations": r.regulations,
            "lawful_basis": r.lawful_basis,
            "permitted_uses": r.permitted_uses,
            "partner_reuse_allowed": r.partner_reuse_allowed,
            "biometric_processing": r.biometric_processing,
        },
        "people": {
            "headcount": r.people_headcount,
            "training": r.people_training,
            "experience": r.people_experience,
            "certification": r.people_certification,
        },
        "budget_disclosed": r.budget_disclosed,
        "currency": r.currency,
        # db/320: one amount on a basis. The amount and the estimate it implies
        # are withheld from bidders when the client asked for that.
        "pricing": pricing.view(
            r.pricing_basis, r.pricing_unit, r.pricing_block, r.pricing_quantity,
            r.budget_amount if show_budget else None, r.currency,
        ),
        "pilot": {
            "required": r.pilot_required,
            "quantity": r.pilot_quantity,
            "due_on": r.pilot_due_on,
        },
        "proposal_requirements": r.proposal_requirements,
        "proposals_close_at": r.proposals_close_at,
        # Derived, never stored; the console reads this rather than doing the
        # comparison itself against a clock that may disagree with ours.
        "bidding_open": bidding_is_open(
            r.proposals_close_at, now or dt.datetime.now(dt.timezone.utc)
        ),
        "contact_user_id": r.contact_user_id,
        "starts_on": r.starts_on,
        "delivery_due_on": r.delivery_due_on,
        "storage_target_id": r.storage_target_id,
        "published_at": r.published_at,
        "created_at": r.created_at,
    }


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

# The prototype applies honest defaults on save rather than storing blanks.
# spec_format and spec_quantity used to be here with "To be agreed"; their
# replacements are structured and a placeholder would have to pass a CHECK, so
# they are simply left NULL when not given.
_DEFAULTS = {
    "spec_quality": "Standard acceptance applies",
    "people_training": "None specified",
    "people_experience": "None specified",
    "people_certification": "None",
    "geography": "Not specified",
    "acceptance": "Client review on delivery",
    "compliance_notes": "None specified",
}

# Everything a client may set that is not defaulted, validated by the API
# against the same vocabularies the CHECK constraints use. Listed once and
# applied by both create and update so the two cannot drift.
_REQUIREMENT_FIELDS = (
    "objective", "use_case", "target_quantity", "target_unit", "capture_spec",
    "countries", "sampling_frame", "quality_thresholds", "rejection_policy",
    "people_in_frame", "minors_policy", "deidentification", "regulations",
    "lawful_basis", "permitted_uses", "partner_reuse_allowed",
    "biometric_processing", "location_type",
    "budget_disclosed", "pilot_required", "pilot_quantity", "pilot_due_on",
    "contact_user_id",
    "proposal_requirements",
)
# proposals_close_at is deliberately NOT in that list: _requirements() drops
# None, so a draft's deadline could be set and never cleared. It is assigned
# outright, next to the other dates. The pricing fields (db/320) are assigned
# outright for the same reason: a draft edited from per-unit back to a total
# must have its unit, block and quantity cleared, or the CHECK refuses it.
_PRICING_FIELDS = ("pricing_unit", "pricing_block", "pricing_quantity", "budget_amount")


def _requirements(data: dict[str, Any]) -> dict[str, Any]:
    """The requirement fields present in the payload, omitting the rest.

    Omitted rather than set to None: every one of these is either nullable or
    carries a server default, and writing None over a default would turn an
    unanswered question into a false answer.
    """
    return {k: data[k] for k in _REQUIREMENT_FIELDS if data.get(k) is not None}


async def create_request(
    session: AsyncSession, claims: AccessClaims, data: dict[str, Any], publish: bool,
    samples: list[dict[str, Any]] | None = None,
    attachments: list[dict[str, Any]] | None = None,
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
        pricing_basis=data.get("pricing_basis") or "total",
        **{k: data.get(k) for k in _PRICING_FIELDS},
        starts_on=data.get("starts_on"),
        delivery_due_on=data.get("delivery_due_on"),
        proposals_close_at=data.get("proposals_close_at"),
        residency_region=data.get("residency_region"),
        storage_target_id=data.get("storage_target_id"),
        published_at=dt.datetime.now(dt.timezone.utc) if publish else None,
        created_by=claims.user_id,
        **fields,
        **_requirements(data),
    )
    if publish:
        _assert_deadline(r)
        await _assert_destination(session, r)
    session.add(r)
    await session.flush()
    attachment_rows = await _attach_fields(session, claims, r.id, attachments)
    if publish:
        await _announce_publish(session, claims, r)
    else:
        await audit.log(session, "request.drafted", f"Drafted {r.reference_code}, {r.title}",
                        [r.id, claims.org_id])
    out = _row(r, r.status, 0, claims.org_id)
    out["attachments"] = attachment_rows
    return out


async def update_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID,
    data: dict[str, Any],
    attachments: list[dict[str, Any]] | None = None,
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
    r.pricing_basis = data.get("pricing_basis") or "total"
    for k in _PRICING_FIELDS:
        setattr(r, k, data.get(k))
    r.starts_on = data.get("starts_on")
    r.delivery_due_on = data.get("delivery_due_on")
    r.proposals_close_at = data.get("proposals_close_at")
    r.residency_region = data.get("residency_region")
    r.storage_target_id = data.get("storage_target_id")
    for k, v in _requirements(data).items():
        setattr(r, k, v)
    r.updated_by = claims.user_id
    await session.flush()

    attachment_rows = await _attach_fields(session, claims, r.id, attachments)
    await audit.log(session, "request.edited", f"Edited draft {r.reference_code}, {r.title}",
                    [r.id, claims.org_id])
    out = _row(r, r.status, 0, claims.org_id)
    out["attachments"] = attachment_rows
    return out


async def _attach_fields(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID,
    items: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Files hung off a field of this request.

    Only the slots this form actually offers: an open slot list would let a
    caller invent fields the console never renders and nobody ever reads.

    capture_examples is what request_sample used to be — the reference material
    a partner reads while deciding whether to bid. It goes through the same
    path as every other attachment now, which is where the staging move and the
    {client}/{RFP}/{slot}/ layout come from for free.

    brief is the whole specification in one file, for a client who has already
    written one. It is the reason the form can be short without being lossy: a
    document carries far more than the questions a client will patiently answer,
    and uploading it costs them a few seconds.
    """
    from sourcehub.modules.attachments import service as attachments

    if not items:
        return []
    allowed = {"brief", "compliance", "acceptance", "capture_examples", "guidelines"}
    bad = {i.get("slot") for i in items} - allowed
    if bad:
        raise MarketplaceError(f"A request takes attachments on {', '.join(sorted(allowed))}.")
    try:
        return await attachments.attach(
            session, claims, entity_type="request", entity_id=request_id, items=items
        )
    except attachments.AttachmentError as e:
        raise MarketplaceError(str(e)) from None


async def notify_active_tenants(
    session: AsyncSession, body: str, request_id: uuid.UUID,
    *, except_orgs: list[uuid.UUID] | None = None,
) -> int:
    """Tell every active delivery partner about one request; how many were told.

    Through active_tenant_ids() (db/240), a definer function returning ids
    only. The plain SELECT on organisation this replaced ran under the
    CLIENT's policies, which show a client only the partners it already has a
    bid or contract from — so a client's first request was announced to
    nobody, and no test could see it because the loop simply had fewer rows.
    """
    skip = set(except_orgs or ())
    told = 0
    for tid in (await session.execute(text("SELECT active_tenant_ids()"))).scalars().all():
        if tid in skip:
            continue
        # requestDetail, not the opportunities board: the notice is about ONE
        # request, and the board drops the id (shared/notifications.ts).
        await notifier.notify(session, tid, body, "requestDetail", {"id": str(request_id)})
        told += 1
    return told


def _assert_deadline(r: Request) -> None:
    now = dt.datetime.now(dt.timezone.utc)
    problem = deadline_problem(r.proposals_close_at, r.delivery_due_on, now)
    if problem:
        raise MarketplaceError(problem)


async def _announce_publish(session: AsyncSession, claims: AccessClaims, r: Request) -> None:
    await audit.log(
        session, "request.published",
        f"Published {r.reference_code}, {r.title}", [r.id, claims.org_id],
    )
    # Reads in a partner's bell, so it uses the partner's word. The sibling
    # lines in submit_proposal go to the client and still say proposal.
    await notify_active_tenants(session, f"{r.title} is open for responses.", r.id)


async def publish_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> dict[str, Any]:
    r = await _get_owned(session, request_id)
    if r.status != "draft":
        raise MarketplaceError(f"A {r.status} request cannot be published.")
    # Partners must know how long they have, and that captures have somewhere
    # to land.
    _assert_deadline(r)
    await _assert_destination(session, r)
    r.status = "published"
    r.published_at = dt.datetime.now(dt.timezone.utc)
    r.updated_by = claims.user_id
    # Flushed before anything is announced, so a constraint the API check
    # missed answers as a 409 here rather than a 500 at commit.
    await session.flush()
    await _announce_publish(session, claims, r)
    return _row(r, "published", 0, claims.org_id)


async def change_bidding_deadline(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID, close_at: dt.datetime
) -> dict[str, Any]:
    """Extend or shorten the bidding window of a published request.

    The one edit a live request allows. Partners are pricing against the words
    of the RFP, and those stay fixed; the window is the client's to manage
    until the award, and every partner is told each time it moves. Moving it
    later after it has passed reopens bidding — that is the point of the
    feature: a request that closed with too few bids gets a second run.
    """
    await _lock_window(session, request_id)
    r = (
        await session.execute(
            # Locked: the sweep may be about to announce this window closed.
            # It re-checks under the row's lock and finds it moved.
            select(Request)
            .where(Request.id == request_id, Request.deleted_at.is_(None))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    if r.client_org_id != claims.org_id:
        raise MarketplaceError("Only the client that raised a request may change its deadline.")
    if r.status == "draft":
        raise MarketplaceError("A draft carries its deadline; edit the draft.")
    if r.status != "published":
        raise MarketplaceError("The deadline is fixed once the request is awarded.")
    now = dt.datetime.now(dt.timezone.utc)
    problem = deadline_problem(close_at, r.delivery_due_on, now)
    if problem:
        raise MarketplaceError(problem)

    old = r.proposals_close_at
    reopened = old is not None and old <= now
    r.proposals_close_at = close_at
    r.closed_at = None  # the sweep may notice the next close
    if close_at - now > REMIND_BEFORE:
        r.bidding_reminder_sent_at = None  # and send the day-before notice again
    r.updated_by = claims.user_id
    await session.flush()

    was = f" (was {fmt_utc(old)})" if old else " (was open until awarded)"
    await audit.log(
        session, "request.deadline_changed",
        f"Bidding on {r.reference_code} now closes {fmt_utc(close_at)}{was}",
        [r.id, claims.org_id],
        {
            "from": old.isoformat() if old else None,
            "to": close_at.isoformat(),
            "reopened": reopened,
        },
    )
    await notify_active_tenants(
        session,
        f"Bidding on {r.title} has reopened until {fmt_utc(close_at)}."
        if reopened
        else f"Bidding on {r.title} now closes {fmt_utc(close_at)}.",
        r.id,
    )
    cmap, counts = await _status_maps(session, [r.id])
    eff = _effective(r.status, cmap.get(r.id), counts.get(r.id, 0))
    return _row(r, eff, counts.get(r.id, 0), claims.org_id, now=now)


async def _assert_destination(session: AsyncSession, r: Request) -> None:
    """A published request must name a destination that has actually worked.

    Checked at publish rather than at save so a half-filled draft is still
    saveable, and again at award, because a credential can be revoked in
    between.
    """
    from sourcehub.modules.storage import service as storage_svc

    try:
        await storage_svc.assert_usable(session, r.storage_target_id)
    except storage_svc.StorageTargetError as e:
        raise MarketplaceError(str(e)) from None


async def _get_owned(session: AsyncSession, request_id: uuid.UUID) -> Request:
    r = (
        await session.execute(
            select(Request).where(Request.id == request_id, Request.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    return r


async def _client_names(
    session: AsyncSession, org_ids: list[uuid.UUID]
) -> dict[uuid.UUID, str]:
    """Who is buying, for the requests just read.

    One statement for the whole page, and no join on the request select: RLS
    decides what comes back, so a client the reader may not see is simply
    absent and the caller gets None. That is the same degradation my_proposals
    relies on, and it means db/180 can be revoked without this code noticing.
    """
    if not org_ids:
        return {}
    rows = (
        await session.execute(
            text("SELECT id, name FROM organisation WHERE id = ANY(:ids)"),
            {"ids": list({*org_ids})},
        )
    ).all()
    return {r[0]: r[1] for r in rows}


async def list_requests(
    session: AsyncSession, claims: AccessClaims, open_only: bool = False
) -> list[dict[str, Any]]:
    """A client sees its own; a tenant the open marketplace (RLS enforces the
    split — open_only merely narrows the tenant's view to what it can bid on)."""
    stmt = select(Request).where(Request.deleted_at.is_(None)).order_by(Request.created_at.desc())
    if open_only:
        # "still bid on": published, and the window not yet closed. The
        # time half uses request_close_idx; a request with no deadline is open.
        stmt = stmt.where(
            Request.status == "published",
            or_(Request.proposals_close_at.is_(None), Request.proposals_close_at > func.now()),
        )
    rows = (await session.execute(stmt)).scalars().all()
    cmap, counts = await _status_maps(session, [r.id for r in rows])
    names = await _client_names(session, [r.client_org_id for r in rows])
    out = []
    for r in rows:
        eff = _effective(r.status, cmap.get(r.id), counts.get(r.id, 0))
        if open_only and eff not in ("published", "proposals_received"):
            continue  # awarded work is no longer an opportunity
        out.append(_row(r, eff, counts.get(r.id, 0), claims.org_id, names.get(r.client_org_id)))
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
    names = await _client_names(session, [r.client_org_id])
    out = _row(
        r, _effective(r.status, cmap.get(r.id), counts.get(r.id, 0)),
        counts.get(r.id, 0), claims.org_id, names.get(r.client_org_id),
    )
    out["proposals"] = await list_proposals(session, claims, request_id)
    out["attachments"] = await _field_attachments(session, "request", [r.id])
    return out


async def _field_attachments(
    session: AsyncSession, entity_type: str, ids: list[uuid.UUID]
) -> list[dict[str, Any]]:
    from sourcehub.modules.attachments import service as attachments

    grouped = await attachments.list_for(session, entity_type, ids)
    return [a for i in ids for a in grouped.get(i, [])]


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------

def _partner_record(record: Any) -> dict[str, Any]:
    """The bidder's figures beside its bid, from the one source every screen
    reads (identity.directory.performance_for). the seeded qa_pass_rate column
    used to be joined in here; the seed wrote it and nothing calculated it."""
    return {
        # What clients said: the share of its completed contracts never sent back.
        "partner_accepted_first_time": record.accepted_first_time_pct if record else None,
        # What it says of its own suppliers, at its own gate.
        "partner_qa_pass_rate": record.qa_pass_pct if record else None,
        "partner_rating": record.rating_avg if record else None,
        "partner_rating_count": record.rating_count if record else 0,
        "partner_contracts_completed": record.contracts_completed if record else 0,
    }


def _basis_of(r: Request | None) -> dict[str, Any] | None:
    """The request's pricing basis, as _priced() wants it. None when the
    request is out of reach (a partner withdrawing after the buyer vanished)."""
    if r is None:
        return None
    return {
        "basis": r.pricing_basis, "unit": r.pricing_unit,
        "block": r.pricing_block, "quantity": r.pricing_quantity,
    }


def _basis_row(r: Any) -> dict[str, Any] | None:
    """The same, from a joined SQL row; None when the request was out of reach."""
    if r.get("pricing_basis") is None:
        return None
    return {
        "basis": r["pricing_basis"], "unit": r["pricing_unit"],
        "block": r["pricing_block"], "quantity": r["pricing_quantity"],
    }


def _priced(price: Any, currency: str, basis: dict[str, Any] | None) -> dict[str, Any]:
    """What a bid's one price means on the request's basis (db/320): the deal it
    implies and the sentence a person reads. Strings, like every money figure
    the API derives."""
    if basis is None:
        return {"pricing_basis": None, "pricing_unit": None, "pricing_block": None,
                "estimated_total": None, "price_text": None}
    total = pricing.estimated_total(basis["basis"], price, basis["block"], basis["quantity"])
    return {
        "pricing_basis": basis["basis"],
        "pricing_unit": basis["unit"],
        "pricing_block": basis["block"],
        "estimated_total": None if total is None else f"{total:.2f}",
        "price_text": pricing.price_text(
            basis["basis"], price, currency, basis["unit"], basis["block"]
        ),
    }


def _proposal_row(p: Proposal, partner_name: str | None = None,
                  record: Any = None, basis: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "id": p.id,
        "reference_code": p.reference_code,
        "request_id": p.request_id,
        "partner_org_id": p.partner_org_id,
        "partner_name": partner_name,
        **_partner_record(record),
        "price": p.price,
        "currency": p.currency,
        **_priced(p.price, p.currency, basis),
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
    attachments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """One price on the request's basis (db/320): the whole price on a total,
    the price per block on per_unit. The currency is the request's."""
    # Serialised against change_bidding_deadline on an advisory lock, NOT with
    # FOR UPDATE: under RLS a row lock also needs the UPDATE policy, and a
    # partner may read a request but never update it — FOR UPDATE simply
    # returned no row, and every bid was a 404.
    await _lock_window(session, request_id)
    r = (
        await session.execute(select(Request).where(Request.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    cmap, counts = await _status_maps(session, [request_id])
    eff = _effective(r.status, cmap.get(request_id), counts.get(request_id, 0))
    if eff not in ("published", "proposals_received"):
        raise MarketplaceError("This request is no longer open for proposals.")
    now = dt.datetime.now(dt.timezone.utc)
    if not bidding_is_open(r.proposals_close_at, now):
        raise MarketplaceError(_closed_message(r))
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
        if existing.status != "withdrawn":
            raise MarketplaceError("You have already proposed on this request.")
        # A withdrawn bid is revived rather than replaced: the unique index is
        # one row per partner per request, and withdrawing in order to rethink
        # your price is the whole point of the button. Barring the partner from
        # the request afterwards made Withdraw a trap.
        existing.price = price
        existing.currency = r.currency
        existing.duration_days = duration_days
        existing.methodology = methodology
        existing.notes = notes
        existing.status = "submitted"
        existing.submitted_at = now
        existing.decided_at = None
        existing.updated_by = claims.user_id
        await session.flush()
        await audit.log(
            session, "proposal.submitted",
            f"Resubmitted {existing.reference_code} on {r.reference_code} at "
            f"{_price_text(r, price)}",
            [existing.id, r.id, claims.org_id, r.client_org_id],
        )
        await notifier.notify(
            session, r.client_org_id,
            f"A revised proposal arrived on {r.title}.",
            "requestDetail", {"id": str(r.id)},
        )
        out = _proposal_row(existing, basis=_basis_of(r))
        out["attachments"] = await _attach_proposal(session, claims, existing.id, attachments)
        return out

    ref = (
        await session.execute(text("SELECT next_reference_code('PRO','seq_ref_proposal')"))
    ).scalar_one()
    p = Proposal(
        reference_code=ref,
        request_id=request_id,
        partner_org_id=claims.org_id,
        price=price,
        currency=r.currency,
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
        f"Submitted {ref} on {r.reference_code} at {_price_text(r, price)}",
        [p.id, r.id, claims.org_id, r.client_org_id],
    )
    out = _proposal_row(p, basis=_basis_of(r))
    out["attachments"] = await _attach_proposal(session, claims, p.id, attachments)
    return out


def _price_text(r: Request, price: Decimal) -> str:
    return pricing.price_text(
        r.pricing_basis, price, r.currency, r.pricing_unit, r.pricing_block
    ) or f"{r.currency} {price}"


async def _attach_proposal(
    session: AsyncSession, claims: AccessClaims, proposal_id: uuid.UUID,
    items: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """The method statement behind the prose. One slot: a bid is one argument."""
    from sourcehub.modules.attachments import service as attachments

    if not items:
        return []
    if {i.get("slot") for i in items} - {"methodology"}:
        raise MarketplaceError("A proposal takes attachments on its methodology.")
    try:
        return await attachments.attach(
            session, claims, entity_type="proposal", entity_id=proposal_id, items=items
        )
    except attachments.AttachmentError as e:
        raise MarketplaceError(str(e)) from None


async def _lock_window(session: AsyncSession, request_id: uuid.UUID) -> None:
    """One writer at a time per bidding window, for the rest of the
    transaction: a bid and a deadline change never interleave. The same
    advisory-lock shape attachments and the audit chain use, and one that
    needs no row privilege — which FOR UPDATE does, under RLS."""
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"),
        {"k": f"bidding-window:{request_id}"},
    )


def _closed_message(r: Request) -> str:
    when = f" on {fmt_utc(r.proposals_close_at)}" if r.proposals_close_at else ""
    return f"Bidding on this request closed{when}."


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
    now = dt.datetime.now(dt.timezone.utc)
    # Binding once the window shuts: a bid the client is deciding on cannot be
    # pulled, any more than a new one can be put in. A bidder can read the
    # request whatever its state (request_select_bidder, db/110).
    r = (
        await session.execute(select(Request).where(Request.id == p.request_id))
    ).scalar_one_or_none()
    if r is not None and not bidding_is_open(r.proposals_close_at, now):
        raise MarketplaceError(
            "Bids are binding once bidding has closed. Ask the client to extend the "
            "deadline if yours must change."
        )
    p.status = "withdrawn"
    p.decided_at = now
    p.updated_by = claims.user_id
    await audit.log(session, "proposal.withdrawn",
                    f"Withdrew {p.reference_code}", [p.id, p.request_id, claims.org_id])
    return _proposal_row(p, basis=_basis_of(r))


async def reject_proposal(
    session: AsyncSession, claims: AccessClaims, proposal_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    """The client turns one bid down without awarding another.

    award() already rejects the losing bids once a winner is chosen; this is the
    other half — saying no while the request stays open, so a partner is not
    left waiting on a decision that has already been made in someone's head.

    The reason is required and travels to the partner. There is no
    decision_reason column on proposal, so it goes where they will actually read
    it: the notification body and the audit trail. network.decide_loan refuses a
    blank rejection for the same reason — the other party cannot act on one.
    """
    reason = (reason or "").strip()
    if not reason:
        raise MarketplaceError("Give a reason — the partner cannot act on a blank rejection.")

    p = (
        await session.execute(select(Proposal).where(Proposal.id == proposal_id))
    ).scalar_one_or_none()
    if p is None:
        raise LookupError("proposal not found")
    if p.status != "submitted":
        raise MarketplaceError(f"A {p.status} proposal cannot be rejected.")

    r = (
        await session.execute(select(Request).where(Request.id == p.request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    # RLS already scopes the row; this says it in the API's own voice rather
    # than letting a 404 stand in for "not yours". award() draws the same line.
    if r.client_org_id != claims.org_id:
        raise MarketplaceError("Only the requesting client can reject a proposal.")

    p.status = "rejected"
    p.decided_at = dt.datetime.now(dt.timezone.utc)
    p.updated_by = claims.user_id

    await notifier.notify(
        session, p.partner_org_id,
        f"Your proposal on {r.title} was not taken forward: {reason}",
        "proposals", {},
    )
    await audit.log(
        session, "proposal.rejected",
        f"Rejected {p.reference_code}: {reason}",
        [p.id, p.request_id, claims.org_id, p.partner_org_id],
    )
    return _proposal_row(p, basis=_basis_of(r))


async def list_proposals(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID | None = None
) -> list[dict[str, Any]]:
    """RLS: a partner sees only its own bids; the client every bid on its
    request — competitors never see each other."""
    # The request join resolves for both parties: the client owns the row and
    # the bidder keeps sight of it (request_select_bidder, db/110). LEFT, as in
    # my_proposals, so a policy change can never silently drop a bid; a row
    # without its request simply carries no basis.
    q = text(
        "SELECT p.*, o.name AS partner_name, "
        "       r.pricing_basis, r.pricing_unit, r.pricing_block, r.pricing_quantity "
        "FROM proposal p "
        "JOIN organisation o ON o.id = p.partner_org_id "
        "LEFT JOIN request r ON r.id = p.request_id "
        "WHERE p.deleted_at IS NULL "
        + ("AND p.request_id = :rid " if request_id else "")
        + "ORDER BY p.submitted_at DESC"
    )
    rows = (
        await session.execute(q, {"rid": request_id} if request_id else {})
    ).mappings().all()
    # One query for every bid's attachments rather than one per row: the
    # comparison table would otherwise fire a request per partner to show a
    # paperclip.
    from sourcehub.modules.attachments import service as attachments
    from sourcehub.modules.identity import directory

    files = await attachments.list_for(session, "proposal", [r["id"] for r in rows])
    # One call for every bidder on the page, as for the attachments.
    record = await directory.performance_for(session, [r["partner_org_id"] for r in rows])
    return [
        {
            "id": r["id"],
            "reference_code": r["reference_code"],
            "request_id": r["request_id"],
            "partner_org_id": r["partner_org_id"],
            "partner_name": r["partner_name"],
            **_partner_record(record.get(r["partner_org_id"])),
            "price": r["price"],
            "currency": r["currency"],
            **_priced(r["price"], r["currency"], _basis_row(r)),
            "duration_days": r["duration_days"],
            "methodology": r["methodology"],
            "notes": r["notes"],
            "status": r["status"],
            "submitted_at": r["submitted_at"],
            "attachments": files.get(r["id"], []),
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
                "       r.client_org_id, r.proposals_close_at, o.name AS client_name, "
                "       r.pricing_basis, r.pricing_unit, r.pricing_block, r.pricing_quantity "
                "FROM proposal p JOIN request r ON r.id = p.request_id "
                "LEFT JOIN organisation o ON o.id = r.client_org_id "
                "WHERE p.partner_org_id = :org AND p.deleted_at IS NULL "
                "ORDER BY p.submitted_at DESC"
            ),
            {"org": claims.org_id},
        )
    ).mappings().all()
    return [{**dict(r), **_priced(r["price"], r["currency"], _basis_row(r))} for r in rows]


# ---------------------------------------------------------------------------
# Award — the transaction the whole marketplace exists for
# ---------------------------------------------------------------------------

async def award(
    session: AsyncSession, claims: AccessClaims, proposal_id: uuid.UUID
) -> dict[str, Any]:
    """Winner accepted, every sibling auto-rejected and told, contract created
    with the pricing basis frozen on it. One transaction, mirroring
    confirmAward(). No money moves: the partner invoices as it delivers (db/320).
    """
    from sourcehub.modules.delivery import service as delivery
    from sourcehub.modules.threads import service as threads

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
    # Re-probed here, not just at publish: a credential can be revoked while
    # bids are open, and awarding is the last moment before a worker relies
    # on the destination existing.
    await _assert_destination(session, r)

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
    # Every other partner's conversation on this request is history now — the
    # ones who asked and never bid included. The winner's continues on the
    # contract.
    await threads.close_for_award(
        session, claims, request_id=r.id, winner_org_id=p.partner_org_id,
        request_ref=r.reference_code, request_title=r.title,
    )

    r.status = "accepted"
    r.updated_by = claims.user_id

    contract = await delivery.create_contract_from_award(
        session, claims,
        request_id=r.id, request_ref=r.reference_code, request_title=r.title,
        proposal_id=p.id, client_org_id=r.client_org_id,
        partner_org_id=p.partner_org_id, value=p.price, currency=p.currency,
        pricing_basis=r.pricing_basis, pricing_unit=r.pricing_unit,
        pricing_block=r.pricing_block, pricing_quantity=r.pricing_quantity,
        acceptance=r.acceptance, compliance=r.compliance_notes,
        storage_target_id=r.storage_target_id,
    )

    await notifier.notify(
        session, p.partner_org_id,
        f"You won {r.title}. Break the contract into tasks to begin.",
        "contracts", {"id": str(contract["id"])},
    )
    await audit.log(
        session, "contract.awarded",
        f"Awarded {contract['reference_code']} to the winning partner at "
        f"{_price_text(r, p.price)}",
        [contract["id"], r.id, r.client_org_id, p.partner_org_id],
    )
    return contract
