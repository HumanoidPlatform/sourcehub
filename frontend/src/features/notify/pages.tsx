// notify — every notification, not only the eight the bell has room for.
//
// The bell shows the latest few; until this page existed the rest were
// unreachable, and the backend returned only the latest 30 anyway. The list
// pages backwards with `before=<last id>` (see api/v1/notify.py).

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { NotificationPage } from "@api/types";
import { Button, Empty, Loadable, Panel, useToast, View } from "@ds/primitives";
import { fmtAgo, fmtDateTime } from "@shared/format";
import { markRead, notificationHref } from "@shared/notifications";

type Filter = "all" | "unread";
const PAGE = 25;

export function NotificationsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [marking, setMarking] = useState(false);

  const q = useInfiniteQuery({
    queryKey: ["notifications", "page", filter],
    queryFn: ({ pageParam }) =>
      get<NotificationPage>(
        `/notifications?limit=${PAGE}` +
          (filter === "unread" ? "&unread_only=true" : "") +
          (pageParam ? `&before=${pageParam}` : ""),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.has_more ? (last.items.at(-1)?.id ?? null) : null),
  });

  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const unread = q.data?.pages[0]?.unread ?? 0;

  const markAll = async () => {
    setMarking(true);
    try {
      await markRead(qc);
    } catch (e) {
      toast("Could not mark them read", e instanceof Error ? e.message : undefined, "critical");
    } finally {
      setMarking(false);
    }
  };

  const markOne = (id: string) =>
    markRead(qc, id).catch((e: unknown) =>
      toast("Could not mark it read", e instanceof Error ? e.message : undefined, "critical"),
    );

  return (
    <View
      title="Notifications"
      sub={q.data ? (unread ? `${unread} unread` : "All read") : undefined}
      actions={
        <Button disabled={!unread || marking} onClick={() => void markAll()}>
          {marking ? "Marking…" : "Mark all read"}
        </Button>
      }
    >
      <Panel
        flush
        tabs={
          <div role="tablist" aria-label="Show">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                id={`ntab_${f}`}
                aria-selected={filter === f}
                aria-controls="npanel"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
        }
        foot={
          q.hasNextPage ? (
            <Button disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
              {q.isFetchingNextPage ? "Loading…" : "Load older"}
            </Button>
          ) : undefined
        }
      >
        <div id="npanel" role="tabpanel" aria-labelledby={`ntab_${filter}`}>
          <Loadable q={q} what="your notifications">
            {items.length === 0 ? (
              filter === "unread" ? (
                <Empty title="You're all caught up" hint="Nothing unread." />
              ) : (
                <Empty
                  title="No notifications yet"
                  hint="When something needs you — a proposal, a decision, a delivery — it appears here and on the bell."
                />
              )
            ) : (
              <ul className="nlist">
                {items.map((n) => {
                  const href = notificationHref(n);
                  return (
                    <li key={n.id} data-unread={n.read ? undefined : ""}>
                      <span className="dot" aria-hidden="true" />
                      <div className="nbody">
                        {!n.read && <span className="sr">Unread: </span>}
                        {href ? (
                          <Link className="txt" to={href} onClick={() => !n.read && void markOne(n.id)}>
                            {n.body}
                          </Link>
                        ) : (
                          <span className="txt">{n.body}</span>
                        )}
                        <time className="ts" dateTime={n.created_at} title={fmtDateTime(n.created_at)}>
                          {fmtAgo(n.created_at)}
                        </time>
                      </div>
                      {!n.read && (
                        // named with its row: a column of identical "Mark read"
                        // buttons says nothing to someone moving through them
                        <Button size="sm" variant="quiet" aria-label={`Mark read: ${n.body}`}
                          onClick={() => void markOne(n.id)}>
                          Mark read
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Loadable>
        </div>
      </Panel>
    </View>
  );
}
