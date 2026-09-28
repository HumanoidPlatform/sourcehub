// messages — one conversation: the log, the composer, and what a read-only
// thread says about itself. Rendered for the client, a partner and Ops; the
// viewer decides what it may do, the server decides what it may see.

import {
  useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent,
} from "react";
import type { Thread, ThreadMessage } from "@api/types";
import { Button, Callout, Field, Skeleton, textareaCls } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtAgo, fmtDateTime } from "@shared/format";
import { useNow } from "@shared/now";
import { MESSAGE_MAX, useMarkRead, useMessages, useSend, type Viewer } from "./hooks";
import {
  counterpartName, isReadOnly, newestFromOthers, readOnlyNote, seenByOtherSide,
} from "./state";

// jsdom has no rAF unless asked; a scroll adjustment is fine a tick late.
const nextFrame = (f: () => void) =>
  typeof requestAnimationFrame === "function" ? requestAnimationFrame(f) : window.setTimeout(f, 0);

export function ThreadPanel({
  thread,
  viewer,
  requestId,
  canStart,
  clientName,
}: {
  /** null only for a partner that has not asked yet */
  thread: Thread | null;
  viewer: Viewer;
  requestId: string;
  /** a partner may open the thread with its first question */
  canStart: boolean;
  /** the client's name while the thread (which carries it) does not exist yet */
  clientName?: string | null;
}) {
  const session = useSession();
  const now = useNow(30_000);
  const party = viewer !== "ops";
  const readOnly = isReadOnly(thread);
  // Ops reads once — each look that shows new content is audited, and a
  // timer would write a line every ten seconds. A closed thread cannot gain
  // a message, so it does not poll either.
  const poll = party && !!thread && !readOnly;
  const { q, messages } = useMessages(thread?.id ?? null, poll);
  const send = useSend(requestId, thread);
  const markRead = useMarkRead(requestId);
  const stampRead = markRead.mutate;

  const [body, setBody] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // the newest other-side message already stamped, so a poll that brings
  // nothing new stamps nothing
  const stamped = useRef<string | null>(null);
  const firstLoad = useRef(true);
  const nearBottom = useRef(true);

  useEffect(() => {
    stamped.current = null;
    firstLoad.current = true;
    nearBottom.current = true;
  }, [thread?.id]);

  // "My organisation has seen this": the newest message rendered, once per
  // new message from the other side, and only while the tab is visible.
  useEffect(() => {
    if (!party || !thread || messages.length === 0) return;
    const newest = newestFromOthers(messages, session.org_id);
    if (!newest || stamped.current === newest.id) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    stamped.current = newest.id;
    stampRead({ threadId: thread.id, messageId: messages[messages.length - 1]!.id });
  }, [party, thread, messages, session.org_id, stampRead]);

  // Follow the conversation: to the bottom on first load, after my own
  // message, and whenever the reader was already at the bottom. A reader
  // scrolled up into history is left where they are; the live region says a
  // message arrived.
  useLayoutEffect(() => {
    const el = logRef.current;
    if (!el || messages.length === 0) return;
    const last = messages[messages.length - 1]!;
    if (firstLoad.current || last.sender_org_id === session.org_id || nearBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
    firstLoad.current = false;
  }, [messages, session.org_id]);

  const onScroll = () => {
    const el = logRef.current;
    if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const loadEarlier = async () => {
    const el = logRef.current;
    const before = el?.scrollHeight ?? 0;
    await q.fetchNextPage();
    // the older page lands above the viewport; keep the reader on the same line
    nextFrame(() => {
      const e = logRef.current;
      if (e) e.scrollTop += e.scrollHeight - before;
    });
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text || send.isPending) return;
    send.mutate(text, {
      onSuccess: () => {
        setBody("");
        nearBottom.current = true;
        taRef.current?.focus();
      },
    });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  const counterpart = counterpartName(thread, viewer, clientName);
  const mine = (m: ThreadMessage) => m.sender_org_id === session.org_id;
  const orgOf = (m: ThreadMessage) =>
    !thread ? "" : (m.sender_org_id === thread.partner_org_id ? thread.partner_org_name : thread.client_org_name) ?? "";
  const lastMine = [...messages].reverse().find(mine);
  const composer = party && (thread ? !readOnly : canStart);

  return (
    <div className="col">
      {viewer === "ops" && (
        <Callout tone="neutral" title="Read-only for platform operations">
          You can read this conversation but not take part in it.
        </Callout>
      )}
      {!thread && canStart && (
        <p className="small muted" style={{ margin: 0 }}>
          Ask the client anything about this RFP. Only you and the client can read the answer.
        </p>
      )}

      {thread && (
        <div
          className="thread"
          role="log"
          aria-live="polite"
          aria-label={`Conversation with ${counterpart}`}
          tabIndex={0}
          ref={logRef}
          onScroll={onScroll}
        >
          {q.isLoading ? (
            <Skeleton rows={3} label="Loading messages" />
          ) : q.isError ? (
            <Callout tone="critical" title="Could not load messages">
              {q.error instanceof Error ? q.error.message : "The request failed."}
            </Callout>
          ) : (
            <>
              {q.hasNextPage && (
                <div className="earlier">
                  <Button size="sm" disabled={q.isFetchingNextPage} onClick={() => void loadEarlier()}>
                    {q.isFetchingNextPage ? "Loading…" : "Load earlier messages"}
                  </Button>
                </div>
              )}
              {messages.length === 0 && <p className="small muted" style={{ margin: 0 }}>No messages yet.</p>}
              <ol>
                {messages.map((m) => (
                  <li key={m.id} className="msg" data-mine={mine(m) ? "" : undefined}>
                    <div className="meta">
                      <b>{m.sender_name || "Someone"}</b>
                      <span>{orgOf(m)}</span>
                      <time dateTime={m.created_at} title={fmtDateTime(m.created_at)}>{fmtAgo(m.created_at, now)}</time>
                    </div>
                    <div className="body">{m.body}</div>
                    {lastMine?.id === m.id && seenByOtherSide(thread, m) && <div className="seen">Seen</div>}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}

      {party && thread && readOnly && (
        <Callout tone="neutral" title="This conversation is read-only">{readOnlyNote(thread, viewer)}</Callout>
      )}

      {composer && (
        <form className="composer" onSubmit={submit}>
          <Field
            label={thread ? "Your message" : "Your question"}
            hint={`${body.length} / ${MESSAGE_MAX} · Ctrl+Enter to send`}
          >
            {(id) => (
              <textarea
                id={id}
                ref={taRef}
                className={textareaCls}
                rows={3}
                maxLength={MESSAGE_MAX}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={onKey}
                disabled={send.isPending}
              />
            )}
          </Field>
          {send.isError && (
            <Callout tone="critical" title="Could not send">
              {send.error instanceof Error ? send.error.message : "The request failed."}
            </Callout>
          )}
          <div className="btnrow">
            <Button type="submit" variant="primary" disabled={!body.trim() || send.isPending}>
              {send.isPending ? "Sending…" : thread ? "Send" : "Ask a question"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
