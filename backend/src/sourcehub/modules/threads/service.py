"""threads — one private conversation per request per delivery partner.

Business rules, and the ONLY public surface of this module.

A thread is (request, partner): the partner opens it with its first question
while the request is open for proposals, the client replies, and it stays
beside the bid, through delivery for the winner, and read-only afterwards.
The database decides who may read and post (db/250): this file decides what
to say when it refuses, numbers the messages, keeps the read stamps, tells the
other side, and closes threads when the marketplace and delivery say so.

Messages carry a seq — 1, 2, 3 within their thread, assigned under the
thread's advisory lock. The read stamp is a seq and so is the page cursor: a
total order, which a timestamp under concurrent transactions is not.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit
from sourcehub.modules.notify import service as notifier


class ThreadError(Exception):
    pass


MAX_BODY = 4000
EXCERPT_CHARS = 80
MAX_MESSAGES_PER_THREAD = 500

AWARDED_ELSEWHERE = "awarded_elsewhere"
CONTRACT_COMPLETED = "contract_completed"
CLOSED_MESSAGES = {
    AWARDED_ELSEWHERE: (
        "This conversation is read-only: the request was awarded to another partner."
    ),
    CONTRACT_COMPLETED: "This conversation is read-only: the contract was completed.",
}

_WS = re.compile(r"\s+")


# ---------------------------------------------------------------------------
# The pure rules
# ---------------------------------------------------------------------------


def clean_body(body: str | None) -> str:
    """The message as stored: trimmed, never blank, never over the cap. The
    CHECK on the column says the same; this is the wording."""
    s = (body or "").strip()
    if not s:
        raise ThreadError("Write a message first.")
    if len(s) > MAX_BODY:
        raise ThreadError(f"A message is at most {MAX_BODY} characters.")
    return s


def excerpt(body: str, limit: int = EXCERPT_CHARS) -> str:
    """The first line of a bell notification: whitespace collapsed, cut short."""
    s = _WS.sub(" ", body).strip()
    return s if len(s) <= limit else s[:limit].rstrip() + "…"


def open_problem(
    org_kind: str, stored_status: str, *, awarded_to_me_and_active: bool = False
) -> str | None:
    """Why this caller may not start a conversation on this request, or None.
    Only a delivery partner opens one, while the request is open for
    proposals — or, as the winner, while its contract is not completed."""
    if org_kind != "tenant":
        return "Only a delivery partner can start a conversation on a request."
    if stored_status != "published" and not awarded_to_me_and_active:
        return "Questions can be asked while the request is open for proposals."
    return None


def closed_message(reason: str | None) -> str | None:
    if reason is None:
        return None
    return CLOSED_MESSAGES.get(reason, "This conversation is read-only.")


def post_problem(
    closed_reason: str | None,
    org_id: uuid.UUID,
    client_org_id: uuid.UUID,
    partner_org_id: uuid.UUID,
) -> str | None:
    """Why this caller may not post in this thread, or None. The INSERT policy
    refuses the same two cases; this is what the person is told."""
    if org_id not in (client_org_id, partner_org_id):
        return "You are not a party to this conversation."
    return closed_message(closed_reason)


def ops_read_is_new(last_up_to: int | None, seq_hi: int, paging_back: bool) -> bool:
    """Whether an Ops read deserves its own audit line: the first look, any
    look that shows a message the last line did not cover, or paging back
    into history. A poll that returns nothing new writes nothing."""
    return paging_back or last_up_to is None or seq_hi > last_up_to


# ---------------------------------------------------------------------------
# Reading
# ---------------------------------------------------------------------------


async def _lock(session: AsyncSession, key: str) -> None:
    """Serialise on a name rather than a row: under RLS a FOR UPDATE needs the
    UPDATE policy, which a partner never holds on the thread."""
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"), {"k": key}
    )


async def _headers(
    session: AsyncSession,
    *,
    request_id: uuid.UUID | None = None,
    thread_id: uuid.UUID | None = None,
) -> list[dict[str, Any]]:
    """Every thread RLS lets the caller see, for one request or one id, with
    the counts the list shows. unread_count is the OTHER side's messages
    above the caller's own stamp; for Ops, who is nobody's other side, 0."""
    rows = (
        await session.execute(
            text(
                "SELECT t.id, t.request_id, t.client_org_id, t.partner_org_id, t.created_at, "
                "       t.closed_at, t.closed_reason, "
                "       r.reference_code AS request_ref, r.title AS request_title, "
                "       (SELECT count(*) FROM rfp_message m WHERE m.thread_id = t.id) "
                "         AS message_count, "
                "       (SELECT max(m.seq) FROM rfp_message m WHERE m.thread_id = t.id) "
                "         AS last_seq, "
                "       (SELECT max(m.created_at) FROM rfp_message m WHERE m.thread_id = t.id) "
                "         AS last_message_at, "
                "       (SELECT m.body FROM rfp_message m WHERE m.thread_id = t.id "
                "         ORDER BY m.seq DESC LIMIT 1) AS last_body, "
                "       coalesce(cr.last_read_seq, 0) AS client_read_seq, "
                "       coalesce(pr.last_read_seq, 0) AS partner_read_seq, "
                "       (SELECT count(*) FROM rfp_message m "
                "         WHERE m.thread_id = t.id AND m.sender_org_id <> current_org_id() "
                "           AND m.seq > CASE "
                "             WHEN t.client_org_id  = current_org_id() "
                "               THEN coalesce(cr.last_read_seq, 0) "
                "             WHEN t.partner_org_id = current_org_id() "
                "               THEN coalesce(pr.last_read_seq, 0) "
                "             ELSE m.seq END) AS unread_count "
                "FROM rfp_thread t "
                "LEFT JOIN request r ON r.id = t.request_id "
                "LEFT JOIN rfp_thread_read cr "
                "       ON cr.thread_id = t.id AND cr.org_id = t.client_org_id "
                "LEFT JOIN rfp_thread_read pr "
                "       ON pr.thread_id = t.id AND pr.org_id = t.partner_org_id "
                "WHERE (CAST(:rid AS uuid) IS NULL OR t.request_id = :rid) "
                "  AND (CAST(:tid AS uuid) IS NULL OR t.id = :tid) "
                "ORDER BY last_message_at DESC NULLS LAST, t.created_at DESC"
            ),
            {"rid": request_id, "tid": thread_id},
        )
    ).mappings().all()
    if not rows:
        return []
    names = await _org_names(
        session, [r["client_org_id"] for r in rows] + [r["partner_org_id"] for r in rows]
    )
    return [_thread_dict(r, names) for r in rows]


async def _org_names(
    session: AsyncSession, org_ids: list[uuid.UUID]
) -> dict[uuid.UUID, str]:
    """One statement for the page. RLS decides: db/250 opens the two parties
    of a thread to each other, and Ops sees every account."""
    rows = (
        await session.execute(
            text("SELECT id, name FROM organisation WHERE id = ANY(:ids)"),
            {"ids": list({*org_ids})},
        )
    ).all()
    return {r[0]: r[1] for r in rows}


def _thread_dict(r: Any, names: dict[uuid.UUID, str]) -> dict[str, Any]:
    return {
        "id": r["id"],
        "request_id": r["request_id"],
        "request_ref": r["request_ref"],
        "request_title": r["request_title"],
        "client_org_id": r["client_org_id"],
        "client_org_name": names.get(r["client_org_id"]),
        "partner_org_id": r["partner_org_id"],
        "partner_org_name": names.get(r["partner_org_id"]),
        "created_at": r["created_at"],
        "closed_at": r["closed_at"],
        "closed_reason": r["closed_reason"],
        "closed_message": closed_message(r["closed_reason"]),
        "message_count": int(r["message_count"] or 0),
        "last_seq": int(r["last_seq"] or 0),
        "last_message_at": r["last_message_at"],
        "last_message_preview": excerpt(r["last_body"]) if r["last_body"] else None,
        "client_read_seq": int(r["client_read_seq"] or 0),
        "partner_read_seq": int(r["partner_read_seq"] or 0),
        "unread_count": int(r["unread_count"] or 0),
    }


async def list_threads(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID
) -> list[dict[str, Any]]:
    """Every conversation on a request the caller may see: all of them for
    the client and for Ops, its own for a partner, none for anyone else."""
    seen = (
        await session.execute(
            text("SELECT 1 FROM request WHERE id = :rid AND deleted_at IS NULL"),
            {"rid": request_id},
        )
    ).first()
    if seen is None:
        raise LookupError("request not found")
    return await _headers(session, request_id=request_id)


async def get_thread(
    session: AsyncSession, claims: AccessClaims, thread_id: uuid.UUID
) -> dict[str, Any]:
    rows = await _headers(session, thread_id=thread_id)
    if not rows:
        raise LookupError("conversation not found")
    return rows[0]


async def list_messages(
    session: AsyncSession,
    claims: AccessClaims,
    thread_id: uuid.UUID,
    *,
    limit: int = 50,
    before: uuid.UUID | None = None,
) -> tuple[list[dict[str, Any]], bool]:
    """A page of messages, newest first; `before` is the id of the oldest one
    the reader already has. An Ops read is audited here and nowhere else —
    this is the call that shows the words."""
    t = await get_thread(session, claims, thread_id)
    cursor: int | None = None
    if before is not None:
        cursor = (
            await session.execute(
                text("SELECT seq FROM rfp_message WHERE id = :m AND thread_id = :t"),
                {"m": before, "t": thread_id},
            )
        ).scalar_one_or_none()
        if cursor is None:
            return [], False
    rows = (
        await session.execute(
            text(
                "SELECT id, thread_id, seq, sender_org_id, sender_user_id, sender_name, "
                "       body, created_at "
                "FROM rfp_message "
                "WHERE thread_id = :t "
                "  AND (CAST(:cursor AS integer) IS NULL OR seq < CAST(:cursor AS integer)) "
                "ORDER BY seq DESC LIMIT :lim"
            ),
            {"t": thread_id, "cursor": cursor, "lim": limit + 1},
        )
    ).mappings().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    if claims.role == "platform_admin" and rows:
        await _audit_ops_read(
            session, t, seq_lo=rows[-1]["seq"], seq_hi=rows[0]["seq"],
            paging_back=before is not None,
        )
    return [dict(r) for r in rows], has_more


async def _audit_ops_read(
    session: AsyncSession, t: dict[str, Any], *, seq_lo: int, seq_hi: int, paging_back: bool
) -> None:
    """One line per look that shows something new — never one per poll. The
    scope names the thread and the request, not the parties: the line is for
    Ops' own accountability, and the parties are not told."""
    last = (
        await session.execute(
            text(
                "SELECT CAST(payload->>'up_to_seq' AS integer) FROM audit_event "
                "WHERE event_type = 'thread.read_by_ops' "
                "  AND actor_user_id = current_user_id() AND :t = ANY(scope) "
                "ORDER BY occurred_at DESC LIMIT 1"
            ),
            {"t": t["id"]},
        )
    ).scalar_one_or_none()
    if not ops_read_is_new(last, seq_hi, paging_back):
        return
    await audit.log(
        session, "thread.read_by_ops",
        f"Ops read the conversation on {t['request_ref']} (messages {seq_lo} to {seq_hi})",
        [t["id"], t["request_id"]],
        {"from_seq": seq_lo, "up_to_seq": seq_hi, "partner_org_id": str(t["partner_org_id"])},
    )


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------


async def _stamp(
    session: AsyncSession, thread_id: uuid.UUID, org_id: uuid.UUID, seq: int
) -> None:
    """My organisation has seen everything up to seq. Never moves backwards:
    two tabs stamping in either order leave the higher mark. Replying counts
    as reading, so post_message stamps too."""
    await session.execute(
        text(
            "INSERT INTO rfp_thread_read (thread_id, org_id, last_read_seq) "
            "VALUES (:t, :org, :seq) "
            "ON CONFLICT (thread_id, org_id) DO UPDATE "
            "  SET last_read_seq = "
            "        GREATEST(rfp_thread_read.last_read_seq, EXCLUDED.last_read_seq), "
            "      updated_at = now()"
        ),
        {"t": thread_id, "org": org_id, "seq": seq},
    )
    # The bell rows this thread produced are read too: the person is looking
    # at the thing they announce.
    await session.execute(
        text(
            "UPDATE notification SET read_at = now() "
            "WHERE org_id = :org AND read_at IS NULL "
            "  AND link_page = 'thread' AND link_params->>'id' = :tid"
        ),
        {"org": org_id, "tid": str(thread_id)},
    )


async def mark_read(
    session: AsyncSession,
    claims: AccessClaims,
    thread_id: uuid.UUID,
    last_seen_message_id: uuid.UUID,
) -> None:
    """Stamp the newest message the reader actually rendered — not now(): a
    message whose transaction began earlier but committed after the reader
    counted would otherwise be marked read unseen."""
    t = await get_thread(session, claims, thread_id)
    if claims.org_id not in (t["client_org_id"], t["partner_org_id"]):
        raise ThreadError("You are not a party to this conversation.")
    seq = (
        await session.execute(
            text("SELECT seq FROM rfp_message WHERE id = :m AND thread_id = :t"),
            {"m": last_seen_message_id, "t": thread_id},
        )
    ).scalar_one_or_none()
    if seq is None:
        raise LookupError("message not found")
    await _stamp(session, thread_id, claims.org_id, seq)


async def post_message(
    session: AsyncSession, claims: AccessClaims, thread_id: uuid.UUID, body: str
) -> dict[str, Any]:
    """Append one message and tell the other organisation. No audit line of
    its own: the row is the record, and the audit chain's global lock is the
    wrong cost per keystroke."""
    body = clean_body(body)
    await _lock(session, f"rfp-thread:{thread_id}")
    t = await get_thread(session, claims, thread_id)
    problem = post_problem(
        t["closed_reason"], claims.org_id, t["client_org_id"], t["partner_org_id"]
    )
    if problem:
        raise ThreadError(problem)
    seq = (
        await session.execute(
            text("SELECT coalesce(max(seq), 0) + 1 FROM rfp_message WHERE thread_id = :t"),
            {"t": thread_id},
        )
    ).scalar_one()
    if seq > MAX_MESSAGES_PER_THREAD:
        raise ThreadError(
            f"This conversation has reached its limit of {MAX_MESSAGES_PER_THREAD} messages."
        )
    try:
        row = (
            await session.execute(
                text(
                    "INSERT INTO rfp_message "
                    "  (thread_id, seq, sender_org_id, sender_user_id, sender_name, body) "
                    "VALUES (:t, :seq, :org, :user, "
                    "        coalesce(nullif(:name, ''), "
                    "                 (SELECT full_name FROM app_user WHERE id = :user), "
                    "                 'Someone'), "
                    "        :body) "
                    "RETURNING id, thread_id, seq, sender_org_id, sender_user_id, sender_name, "
                    "          body, created_at"
                ),
                {
                    "t": thread_id, "seq": seq, "org": claims.org_id, "user": claims.user_id,
                    "name": claims.full_name or "", "body": body,
                },
            )
        ).mappings().one()
    except DBAPIError as e:
        # The policy's refusal is the truth the header row may have missed by
        # a moment: the award closed it between our read and our write.
        if "row-level security" in str(e.orig):
            raise ThreadError(
                closed_message(t["closed_reason"]) or "You cannot post in this conversation."
            ) from None
        raise
    await _stamp(session, thread_id, claims.org_id, seq)
    other = t["partner_org_id"] if claims.org_id == t["client_org_id"] else t["client_org_id"]
    await notifier.notify(
        session, other,
        f"{claims.org_name} on {t['request_title']}: {excerpt(body)}",
        "thread", {"id": str(thread_id), "request": str(t["request_id"])},
    )
    return dict(row)


async def open_thread(
    session: AsyncSession, claims: AccessClaims, request_id: uuid.UUID, body: str
) -> dict[str, Any]:
    """The partner's first question opens its conversation on the request.
    Idempotent: a second call posts into the thread that already exists."""
    body = clean_body(body)
    req = (
        await session.execute(
            text(
                "SELECT id, client_org_id, status, reference_code, title FROM request "
                "WHERE id = :rid AND deleted_at IS NULL"
            ),
            {"rid": request_id},
        )
    ).mappings().first()
    if req is None:
        raise LookupError("request not found")
    awarded_active = (
        await session.execute(
            text(
                "SELECT 1 FROM contract WHERE request_id = :rid AND partner_org_id = :org "
                "  AND status <> 'completed'"
            ),
            {"rid": request_id, "org": claims.org_id},
        )
    ).first() is not None
    problem = open_problem(
        claims.org_kind, req["status"], awarded_to_me_and_active=awarded_active
    )
    if problem:
        raise ThreadError(problem)

    await _lock(session, f"rfp-thread:{request_id}:{claims.org_id}")
    thread_id = (
        await session.execute(
            text("SELECT id FROM rfp_thread WHERE request_id = :rid AND partner_org_id = :org"),
            {"rid": request_id, "org": claims.org_id},
        )
    ).scalar_one_or_none()
    if thread_id is None:
        try:
            thread_id = (
                await session.execute(
                    text(
                        "INSERT INTO rfp_thread "
                        "  (request_id, client_org_id, partner_org_id, opened_by) "
                        "VALUES (:rid, :client, :org, :user) "
                        "ON CONFLICT (request_id, partner_org_id) DO NOTHING RETURNING id"
                    ),
                    {
                        "rid": request_id, "client": req["client_org_id"],
                        "org": claims.org_id, "user": claims.user_id,
                    },
                )
            ).scalar_one_or_none()
        except DBAPIError as e:
            if "row-level security" in str(e.orig):
                raise ThreadError(
                    "Questions can be asked while the request is open for proposals."
                ) from None
            raise
        if thread_id is None:
            raise ThreadError("Try again — the conversation was being opened.")
        await audit.log(
            session, "thread.opened",
            f"Opened a conversation on {req['reference_code']}",
            [thread_id, request_id, req["client_org_id"], claims.org_id],
        )
    message = await post_message(session, claims, thread_id, body)
    return {"thread": await get_thread(session, claims, thread_id), "message": message}


# ---------------------------------------------------------------------------
# Closing — called by the marketplace at award and by delivery at completion,
# both under the CLIENT's session, which is the only one rfp_thread_update
# admits.
# ---------------------------------------------------------------------------


async def _close_threads(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    request_id: uuid.UUID,
    reason: str,
    keep_partner: uuid.UUID | None,
    only_partner: uuid.UUID | None,
) -> list[dict[str, Any]]:
    """Lock the rows, then the one conditional UPDATE, then say so — the same
    order the bidding sweep keeps, so a poster holding the thread lock is
    waited for rather than raced."""
    await session.execute(
        text(
            "SELECT pg_advisory_xact_lock("
            "         hashtextextended('rfp-thread:' || CAST(id AS text), 0)) "
            "FROM rfp_thread "
            "WHERE request_id = :rid AND closed_at IS NULL "
            "  AND (CAST(:keep AS uuid) IS NULL OR partner_org_id <> :keep) "
            "  AND (CAST(:only AS uuid) IS NULL OR partner_org_id = :only)"
        ),
        {"rid": request_id, "keep": keep_partner, "only": only_partner},
    )
    rows = (
        await session.execute(
            text(
                "UPDATE rfp_thread "
                "SET closed_at = now(), closed_reason = :reason, closed_by = :user "
                "WHERE request_id = :rid AND closed_at IS NULL "
                "  AND (CAST(:keep AS uuid) IS NULL OR partner_org_id <> :keep) "
                "  AND (CAST(:only AS uuid) IS NULL OR partner_org_id = :only) "
                "RETURNING id, partner_org_id, client_org_id"
            ),
            {
                "rid": request_id, "reason": reason, "user": claims.user_id,
                "keep": keep_partner, "only": only_partner,
            },
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def close_for_award(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    request_id: uuid.UUID,
    winner_org_id: uuid.UUID,
    request_ref: str,
    request_title: str,
) -> list[uuid.UUID]:
    """Every conversation on the request except the winner's becomes history,
    and each of those partners — bidder or not — is told."""
    closed = await _close_threads(
        session, claims, request_id=request_id, reason=AWARDED_ELSEWHERE,
        keep_partner=winner_org_id, only_partner=None,
    )
    for t in closed:
        await audit.log(
            session, "thread.closed",
            f"Closed the conversation on {request_ref}: awarded to another partner",
            [t["id"], request_id, t["client_org_id"], t["partner_org_id"]],
            {"reason": AWARDED_ELSEWHERE},
        )
        await notifier.notify(
            session, t["partner_org_id"],
            f"Questions on {request_title} are now read-only: it was awarded to another partner.",
            "thread", {"id": str(t["id"]), "request": str(request_id)},
        )
    return [t["id"] for t in closed]


async def close_for_completion(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    request_id: uuid.UUID,
    partner_org_id: uuid.UUID,
    request_ref: str,
) -> list[uuid.UUID]:
    """The winner's conversation ends with the contract. The partner already
    hears "Delivery approved" from delivery; no second notice."""
    closed = await _close_threads(
        session, claims, request_id=request_id, reason=CONTRACT_COMPLETED,
        keep_partner=None, only_partner=partner_org_id,
    )
    for t in closed:
        await audit.log(
            session, "thread.closed",
            f"Closed the conversation on {request_ref}: the contract was completed",
            [t["id"], request_id, t["client_org_id"], t["partner_org_id"]],
            {"reason": CONTRACT_COMPLETED},
        )
    return [t["id"] for t in closed]
