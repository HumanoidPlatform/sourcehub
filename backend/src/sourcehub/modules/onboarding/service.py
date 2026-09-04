"""onboarding — onboarding requests, the approval chain and invitations.

Business rules, and the ONLY public surface of this module.

Two tiers, one table:
  - Platform Admin onboards a CLIENT or a TENANT directly (files and approves).
  - A TENANT requests an AGGREGATOR, BUSINESS or SPONSOR; the request goes to
    the Platform Admin for approval.

Who may decide is enforced three times over — capability check in the router,
the RLS insert policy on onboarding_approval, and approve_onboarding_request()
running with the CALLER's rights so a non-admin fails on organisation_insert.
Defence in depth is the point: the prototype had no approval step at all.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, new_opaque_token
from sourcehub.config import BRAND, settings
from sourcehub.modules.audit import service as audit
from sourcehub.modules.notify import service as notifier
from sourcehub.modules.onboarding.models import Invitation, OnboardingApproval, OnboardingRequest

NETWORK_KINDS = ("aggregator", "business", "sponsor")
TOP_KINDS = ("client", "tenant")


class OnboardingError(Exception):
    pass


def _row(r: OnboardingRequest) -> dict[str, Any]:
    return {
        "id": r.id,
        "reference_code": r.reference_code,
        "target_org_kind": r.target_org_kind,
        "proposed_name": r.proposed_name,
        "requester_org_id": r.requester_org_id,
        "parent_org_id": r.parent_org_id,
        "payload": r.payload,
        "contact": r.contact,
        "status": r.status,
        "submitted_at": r.submitted_at,
        "decided_at": r.decided_at,
        "created_org_id": r.created_org_id,
        "created_at": r.created_at,
    }


async def create_request(
    session: AsyncSession,
    claims: AccessClaims,
    target_org_kind: str,
    proposed_name: str,
    payload: dict[str, Any],
    contact: dict[str, Any],
    submit: bool,
) -> dict[str, Any]:
    is_admin = claims.role == "platform_admin"
    if target_org_kind in TOP_KINDS and not is_admin:
        raise OnboardingError("Only the platform onboards clients and tenants.")
    if target_org_kind in NETWORK_KINDS and not (is_admin or claims.org_kind == "tenant"):
        raise OnboardingError("Only a delivery partner requests network entities.")

    ref = (
        await session.execute(text("SELECT next_reference_code('ONB','seq_ref_onboarding')"))
    ).scalar_one()

    req = OnboardingRequest(
        reference_code=ref,
        target_org_kind=target_org_kind,
        proposed_name=proposed_name,
        requester_org_id=claims.org_id,
        requester_user_id=claims.user_id,
        # a network entity is sponsored by the requesting tenant; when Ops files
        # one on a tenant's behalf the payload names the parent explicitly
        parent_org_id=(
            None
            if target_org_kind in TOP_KINDS
            else (uuid.UUID(payload["parent_org_id"]) if is_admin and payload.get("parent_org_id") else claims.org_id)
        ),
        payload={k: v for k, v in payload.items() if k != "parent_org_id"},
        contact=contact,
        status="submitted" if submit else "draft",
        submitted_at=dt.datetime.now(dt.timezone.utc) if submit else None,
        created_by=claims.user_id,
    )
    session.add(req)
    await session.flush()

    if submit:
        await _announce_submission(session, claims, req)
    return _row(req)


async def _announce_submission(
    session: AsyncSession, claims: AccessClaims, req: OnboardingRequest
) -> None:
    ops = (await session.execute(text("SELECT platform_org_id()"))).scalar_one()
    await notifier.notify(
        session,
        ops,
        f"{claims.org_name} requests onboarding of {req.proposed_name} as a {req.target_org_kind}.",
        "onboarding",
        {"id": str(req.id)},
    )
    await audit.log(
        session,
        "onboarding.submitted",
        f"Requested onboarding of {req.proposed_name} as a {req.target_org_kind} ({req.reference_code})",
        [req.id, claims.org_id],
    )


async def list_requests(
    session: AsyncSession, status: str | None = None
) -> list[dict[str, Any]]:
    stmt = (
        select(OnboardingRequest)
        .where(OnboardingRequest.deleted_at.is_(None))
        .order_by(OnboardingRequest.created_at.desc())
    )
    if status:
        stmt = stmt.where(OnboardingRequest.status == status)
    rows = (await session.execute(stmt)).scalars().all()
    return [_row(r) for r in rows]


async def get_request(session: AsyncSession, request_id: uuid.UUID) -> dict[str, Any] | None:
    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        return None
    approvals = (
        await session.execute(
            select(OnboardingApproval)
            .where(OnboardingApproval.request_id == request_id)
            .order_by(OnboardingApproval.decided_at)
        )
    ).scalars().all()
    out = _row(r)
    out["approvals"] = [
        {
            "step": a.step,
            "decision": a.decision,
            "reason": a.reason,
            "approver_role": a.approver_role,
            "decided_at": a.decided_at,
        }
        for a in approvals
    ]
    return out


async def submit_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> dict[str, Any]:
    """draft → submitted, and changes_requested → submitted (a resubmission)."""
    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    if r.status not in ("draft", "changes_requested"):
        raise OnboardingError(f"A {r.status} request cannot be submitted.")
    r.status = "submitted"
    r.submitted_at = dt.datetime.now(dt.timezone.utc)
    r.updated_by = claims.user_id
    await _announce_submission(session, claims, r)
    return _row(r)


async def update_draft(
    session: AsyncSession,
    claims: AccessClaims,
    request_id: uuid.UUID,
    proposed_name: str | None,
    payload: dict[str, Any] | None,
    contact: dict[str, Any] | None,
) -> dict[str, Any]:
    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    if r.status not in ("draft", "changes_requested"):
        raise OnboardingError("Only a draft or a returned request can be edited.")
    if proposed_name:
        r.proposed_name = proposed_name
    if payload is not None:
        r.payload = payload
    if contact is not None:
        r.contact = contact
    r.updated_by = claims.user_id
    return _row(r)


async def withdraw_request(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> dict[str, Any]:
    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    if r.status in ("approved", "rejected"):
        raise OnboardingError("A decided request cannot be withdrawn.")
    r.status = "withdrawn"
    r.updated_by = claims.user_id
    await audit.log(
        session, "onboarding.withdrawn",
        f"Withdrew onboarding request {r.reference_code}", [r.id, claims.org_id],
    )
    return _row(r)


# ---------------------------------------------------------------------------
# Decisions — Platform Admin only (router capability + RLS both enforce it)
# ---------------------------------------------------------------------------

async def decide(
    session: AsyncSession,
    claims: AccessClaims,
    request_id: uuid.UUID,
    decision: str,
    reason: str | None,
) -> dict[str, Any]:
    if decision == "approved":
        return await _approve(session, claims, request_id)

    if not reason or not reason.strip():
        # the same rule the prototype applies to QA: the requester cannot act
        # on a blank rejection
        raise OnboardingError("Say what must change — a decision needs a reason.")

    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one_or_none()
    if r is None:
        raise LookupError("request not found")
    if r.status not in ("submitted", "under_review"):
        raise OnboardingError(f"A {r.status} request cannot be decided.")

    r.status = decision  # 'rejected' | 'changes_requested'
    r.decided_at = dt.datetime.now(dt.timezone.utc) if decision == "rejected" else None
    r.updated_by = claims.user_id
    session.add(
        OnboardingApproval(
            request_id=r.id,
            approver_user_id=claims.user_id,
            approver_org_id=claims.org_id,
            approver_role=claims.role,
            decision=decision,
            reason=reason,
        )
    )
    verb = "rejected" if decision == "rejected" else "returned for changes"
    await notifier.notify(
        session,
        r.requester_org_id,
        f"Your onboarding request for {r.proposed_name} was {verb}: {reason}",
        "network",
        {"onboarding_id": str(r.id)},
    )
    await audit.log(
        session, f"onboarding.{decision}",
        f"Onboarding {r.reference_code} ({r.proposed_name}) {verb}",
        [r.id, r.requester_org_id, claims.org_id],
    )
    return _row(r)


async def _approve(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> dict[str, Any]:
    """One call into the database function; the whole creation is one
    transaction there — org, profile, first user, grant, invitation."""
    raw_token, token_hash = new_opaque_token()

    new_org_id = (
        await session.execute(
            text(
                "SELECT approve_onboarding_request(:rid, :uid, :oid, :role, :thash, "
                "make_interval(days => :ttl))"
            ),
            {
                "rid": request_id,
                "uid": claims.user_id,
                "oid": claims.org_id,
                "role": claims.role,
                "thash": token_hash,
                "ttl": settings.invitation_ttl_days,
            },
        )
    ).scalar_one()

    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one()

    await notifier.notify(
        session,
        r.requester_org_id,
        f"{r.proposed_name} was approved and is now in your network.",
        "network",
        {},
    )
    await audit.log(
        session, "onboarding.approved",
        f"Approved {r.reference_code}: {r.proposed_name} onboarded as a {r.target_org_kind}",
        [r.id, new_org_id, r.requester_org_id, claims.org_id],
    )

    # Email is best-effort: the org exists either way, and the invitation can
    # be re-sent. A dead SMTP must not roll back an approval.
    email = (r.contact or {}).get("email")
    if email:
        from sourcehub.platform.mail.smtp import send_mail

        link = f"{settings.app_base_url}/accept-invitation?token={raw_token}"
        try:
            await send_mail(
                email,
                f"You're invited to {BRAND} — {r.proposed_name}",
                f"Hello {(r.contact or {}).get('full_name', '')},\n\n"
                f"{r.proposed_name} has been approved on {BRAND} and you are its first\n"
                f"user. Set your password within {settings.invitation_ttl_days} days:\n\n"
                f"  {link}\n\n"
                f"No one at {BRAND} knows this link's token or your future password.",
            )
        except OSError:
            pass

    return _row(r)


async def resend_invitation(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> None:
    """A fresh token for an approved request whose email went astray."""
    r = (
        await session.execute(select(OnboardingRequest).where(OnboardingRequest.id == request_id))
    ).scalar_one_or_none()
    if r is None or r.status != "approved" or r.created_org_id is None:
        raise OnboardingError("Only an approved request has an invitation to resend.")

    inv = (
        await session.execute(
            select(Invitation).where(
                Invitation.request_id == request_id, Invitation.accepted_at.is_(None)
            )
        )
    ).scalar_one_or_none()
    if inv is None:
        raise OnboardingError("The invitation was already accepted.")

    raw_token, token_hash = new_opaque_token()
    inv.token_hash = token_hash
    inv.expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(
        days=settings.invitation_ttl_days
    )
    inv.reminder_count = inv.reminder_count + 1
    inv.last_reminder_at = dt.datetime.now(dt.timezone.utc)

    from sourcehub.platform.mail.smtp import send_mail

    link = f"{settings.app_base_url}/accept-invitation?token={raw_token}"
    try:
        await send_mail(
            inv.email,
            f"Reminder: your {BRAND} invitation — {r.proposed_name}",
            f"Your invitation link was refreshed. Set your password here:\n\n  {link}\n",
        )
    except OSError:
        pass
