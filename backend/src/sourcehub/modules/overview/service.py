"""overview — the numbers behind a landing page, in one call.

Business rules, and the ONLY public surface of this module.

This module owns no tables. It reads the ones other modules own and answers a
single question: what does this organisation need to know when it signs in?

Three rules it obeys, each learned from something already in this codebase:

1. NO APPLICATION TENANCY FILTER. Every query runs under the caller's own
   session GUCs (api/deps.get_session), so RLS decides which rows exist. A
   `WHERE client_org_id = :me` here would be a second, weaker copy of a rule
   the database already enforces — and the copy is the one that rots.

2. NOT THE VIEWS. contract_progress looks like exactly the primitive this
   module wants, and using it would be a tenancy hole: it is not declared
   security_invoker, so it runs with its owner's rights and would hand a client
   every contract on the platform. The aggregates below hit base tables, where
   the policies apply.

3. THE SAME DERIVED STATUS THE LIST ENDPOINTS SHOW. A request's API status is
   not its stored status — marketplace.service derives it from the contract,
   and delivery.service derives `in_qa` from submissions in review. Those rules
   are restated in SQL here rather than approximated, because a dashboard whose
   totals disagree with the page behind it is worse than no dashboard.

The one deliberate narrowing: the capture series counts `ready` assets only.
RLS would happily let a client read the quarantined and discarded ones, but
media.list_assets withholds them from anyone outside the supplier org, and a
chart is not the place to leak what the list endpoint hides.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class OverviewError(Exception):
    pass


# Requests a client has not finished, in the order a person reads them.
_REQUEST_STAGES = (
    "draft",
    "published",
    "proposals_received",
    "accepted",
    "in_progress",
    "delivered",
    "completed",
    "cancelled",
)

# Contract status -> request status, transcribed from marketplace.service's
# _CONTRACT_TO_REQUEST so the two cannot drift silently.
_EFFECTIVE_REQUEST_STATUS = """
  CASE
    WHEN c.status IS NULL THEN
      CASE WHEN r.status = 'published' AND pc.n > 0 THEN 'proposals_received'
           ELSE r.status::text END
    WHEN c.status = 'active' AND tc.n = 0 THEN 'accepted'
    WHEN c.status IN ('active', 'in_qa', 'disputed') THEN 'in_progress'
    WHEN c.status = 'cancelled' THEN 'accepted'
    ELSE c.status::text
  END
"""

_REQUESTS_SQL = text(
    f"""
    SELECT r.id,
           r.reference_code,
           r.title,
           r.status::text          AS stored_status,
           r.proposals_close_at,
           r.delivery_due_on,
           pc.n                    AS proposal_count,
           {_EFFECTIVE_REQUEST_STATUS} AS status
    FROM   request r
    LEFT   JOIN contract c
           ON c.request_id = r.id AND c.deleted_at IS NULL
    CROSS  JOIN LATERAL (
             SELECT count(*) AS n FROM proposal p
             WHERE  p.request_id = r.id AND p.deleted_at IS NULL
           ) pc
    CROSS  JOIN LATERAL (
             SELECT count(*) AS n FROM task t
             WHERE  t.contract_id = c.id AND t.deleted_at IS NULL
           ) tc
    WHERE  r.deleted_at IS NULL
    ORDER  BY r.created_at DESC
    """
)

# One query for what list_contracts spends three per contract on: the names
# join, the in_qa probe and progress_of. The asset roll-up is a scalar
# subquery rather than another LEFT JOIN so the task join cannot fan it out.
_CONTRACTS_SQL = text(
    """
    SELECT c.id,
           c.reference_code,
           c.value,
           c.currency,
           o.name                  AS partner_name,
           req.delivery_due_on,
           count(t.id)                                            AS total,
           count(t.id) FILTER (WHERE t.status = 'qa_passed')       AS done,
           CASE WHEN c.status = 'active' AND EXISTS (
                  SELECT 1 FROM submission s
                  JOIN   task t2 ON t2.id = s.task_id
                  WHERE  t2.contract_id = c.id
                    AND  s.status IN ('submitted', 'under_review'))
                THEN 'in_qa' ELSE c.status::text END              AS status,
           (SELECT coalesce(sum(s.asset_count), 0)
              FROM submission s
              JOIN task t3 ON t3.id = s.task_id
             WHERE t3.contract_id = c.id AND s.status = 'accepted') AS assets_accepted
    FROM   contract c
    LEFT   JOIN task t         ON t.contract_id = c.id AND t.deleted_at IS NULL
    LEFT   JOIN organisation o ON o.id = c.partner_org_id
    LEFT   JOIN request req    ON req.id = c.request_id
    WHERE  c.deleted_at IS NULL
    GROUP  BY c.id, c.reference_code, c.value, c.currency, c.status,
             o.name, req.delivery_due_on
    ORDER  BY req.delivery_due_on NULLS LAST, c.reference_code
    """
)

_INVOICES_SQL = text(
    """
    SELECT status::text AS status, count(*) AS n, coalesce(sum(amount), 0) AS amount
    FROM   invoice
    WHERE  deleted_at IS NULL
    GROUP  BY status
    """
)

# created_at, not captured_at: it is the partition key and carries the BRIN
# index, and it is when the platform took delivery of the file, which is what
# "captures per day" means to the person reading it.
_CAPTURES_SQL = text(
    """
    SELECT created_at::date AS day, count(*) AS n
    FROM   asset
    WHERE  status = 'ready'
      AND  deleted_at IS NULL
      AND  created_at >= (now() - make_interval(days => :days))
    GROUP  BY 1
    ORDER  BY 1
    """
)

_LIVE_CONTRACT = ("active", "in_qa", "delivered", "disputed")


async def client_overview(session: AsyncSession, days: int = 30) -> dict[str, Any]:
    """Everything the client's landing page draws, in four queries.

    Fetching and arithmetic are split so the second half is a pure function:
    the SQL needs a database with rows and policies to mean anything, and the
    roll-up needs neither.
    """
    requests = [dict(r) for r in (await session.execute(_REQUESTS_SQL)).mappings().all()]
    contracts = [dict(r) for r in (await session.execute(_CONTRACTS_SQL)).mappings().all()]
    invoices = [dict(r) for r in (await session.execute(_INVOICES_SQL)).mappings().all()]
    captures = [
        dict(r) for r in (await session.execute(_CAPTURES_SQL, {"days": days})).mappings().all()
    ]
    return build_overview(requests, contracts, invoices, captures, days)


def build_overview(
    requests: list[dict[str, Any]],
    contracts: list[dict[str, Any]],
    invoices: list[dict[str, Any]],
    captures: list[dict[str, Any]],
    days: int,
) -> dict[str, Any]:
    """The roll-up, over rows the caller has already been allowed to see."""
    by_status = dict.fromkeys(_REQUEST_STAGES, 0)
    for r in requests:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1

    deliveries = [
        {
            "contract_id": c["id"],
            "reference_code": c["reference_code"],
            "partner_name": c["partner_name"],
            "value": _money(c["value"]),
            "currency": c["currency"],
            "status": c["status"],
            "delivery_due_on": c["delivery_due_on"],
            "total": c["total"],
            "done": c["done"],
            # Matches progress_of exactly, including 0 rather than null for a
            # contract nobody has broken into tasks yet.
            "pct": round(100 * c["done"] / c["total"]) if c["total"] else 0,
            "assets_accepted": int(c["assets_accepted"]),
        }
        for c in contracts
    ]

    live = [d for d in deliveries if d["status"] in _LIVE_CONTRACT]
    tasks_total = sum(d["total"] for d in live)
    tasks_done = sum(d["done"] for d in live)

    paid = sum(i["amount"] for i in invoices if i["status"] == "paid")
    outstanding = sum(
        i["amount"] for i in invoices if i["status"] in ("pending", "overdue")
    )

    return {
        "generated_at": datetime.now(UTC),
        "requests": {
            "by_status": by_status,
            "total": len(requests),
        },
        "deliveries": deliveries,
        "delivery": {
            "live": len(live),
            "tasks_total": tasks_total,
            "tasks_done": tasks_done,
            "pct": round(100 * tasks_done / tasks_total) if tasks_total else 0,
        },
        "money": {
            # Committed is what is still owed on work in flight — NOT the sum
            # of every contract ever signed, which is what the old landing page
            # showed under the same word while Billing showed something else.
            "committed": _money(sum(Decimal(d["value"]) for d in live)),
            "paid": _money(paid),
            "outstanding": _money(outstanding),
            "currency": _currency(contracts),
        },
        "captures": {
            "accepted": sum(d["assets_accepted"] for d in deliveries),
            "days": days,
            "series": [{"day": c["day"], "count": c["n"]} for c in captures],
        },
        "attention": _attention(requests, deliveries),
    }


def _money(value: Any) -> str:
    """Two decimal places, as a string.

    FastAPI encodes a Decimal as a JSON float, so a numeric(14,2) left alone
    reaches the browser through binary floating point — which is the one thing
    the console's own type file says must never happen to money. Formatting it
    here makes the wire format the same shape the frontend already declares.
    """
    return f"{Decimal(str(value or 0)):.2f}"


def _currency(contracts: list[dict[str, Any]]) -> str:
    """One currency per client in practice; the first contract's is it.

    A client with none yet gets USD rather than a null the console would have
    to guard on every money formatter.
    """
    for c in contracts:
        if c.get("currency"):
            return str(c["currency"])
    return "USD"


def _attention(
    requests: list[dict[str, Any]], deliveries: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """What will not move until this client does something.

    The three states shared/status already marks as owner "client", read off
    the same derived status the requests page shows. Wording and links belong
    to the console, so this returns the facts and not a sentence.
    """
    items: list[dict[str, Any]] = []
    for r in requests:
        if r["status"] == "draft":
            items.append(
                {
                    "kind": "publish_draft",
                    "entity_id": r["id"],
                    "reference_code": r["reference_code"],
                    "title": r["title"],
                    "count": 0,
                    "due_on": None,
                }
            )
        elif r["status"] == "proposals_received":
            items.append(
                {
                    "kind": "review_proposals",
                    "entity_id": r["id"],
                    "reference_code": r["reference_code"],
                    "title": r["title"],
                    "count": r["proposal_count"],
                    "due_on": r["proposals_close_at"],
                }
            )
    for d in deliveries:
        if d["status"] == "delivered":
            items.append(
                {
                    "kind": "approve_delivery",
                    "entity_id": d["contract_id"],
                    "reference_code": d["reference_code"],
                    "title": d["partner_name"],
                    "count": 0,
                    "due_on": d["delivery_due_on"],
                }
            )
    return items
