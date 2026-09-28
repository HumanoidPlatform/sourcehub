// messages — the private conversation between a client and one delivery
// partner on an RFP. The data layer; the panels are beside it.
//
// New messages arrive by polling, like the rest of the console: the open
// thread refetches every POLL_MS while a party is looking at it, and react-query
// pauses the interval while the tab is hidden. Ops never polls — every read
// that shows new content is audited, and a timer would write a line a minute.

import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData,
} from "@tanstack/react-query";
import { get, post, type Session } from "@api/client";
import type { Thread, ThreadList, ThreadMessage, ThreadMessagePage } from "@api/types";

export const POLL_MS = 10_000;
export const MESSAGE_MAX = 4000;
const PAGE = 50;

export type Viewer = "client" | "partner" | "ops";

/** Who is looking: the client, a delivery partner, Ops — or nobody who has
 *  any business here (aggregators, sponsors, businesses, crowd). */
export function viewerOf(s: Session): Viewer | null {
  if (s.role === "platform_admin") return "ops";
  if (s.org_kind === "client") return "client";
  if (s.org_kind === "tenant") return "partner";
  return null;
}

export const threadKeys = {
  list: (requestId: string) => ["threads", requestId] as const,
  messages: (threadId: string) => ["thread-messages", threadId] as const,
};

// A stable select, so react-query hands back the same array until the data
// changes; an inline arrow would rebuild it on every render, and the panels
// key effects on it. Page tests answer unknown GETs with null.
const pickItems = (d: ThreadList | null): Thread[] => d?.items ?? [];

/** Every thread on a request the caller may see. */
export function useThreads(requestId: string | undefined, poll: boolean) {
  return useQuery({
    queryKey: threadKeys.list(requestId ?? ""),
    queryFn: () => get<ThreadList | null>(`/requests/${requestId}/threads`),
    enabled: !!requestId,
    select: pickItems,
    refetchInterval: poll ? POLL_MS : false,
  });
}

/** The messages of one thread, oldest first for display. The wire is newest
 *  first with `before=<oldest id>` paging back (the /notifications shape). */
export function useMessages(threadId: string | null, poll: boolean) {
  const q = useInfiniteQuery({
    queryKey: threadKeys.messages(threadId ?? ""),
    queryFn: ({ pageParam }) =>
      get<ThreadMessagePage>(
        `/threads/${threadId}/messages?limit=${PAGE}` + (pageParam ? `&before=${pageParam}` : ""),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last?.has_more ? (last.items.at(-1)?.id ?? null) : null),
    enabled: !!threadId,
    refetchInterval: poll ? POLL_MS : false,
  });
  const messages = (q.data?.pages ?? []).flatMap((p) => p?.items ?? []).slice().reverse();
  return { q, messages };
}

/** "My organisation has seen up to this message." The stamp is a message,
 *  never a clock, so it can only be exact. Unread counts and the bell rows this
 *  thread produced clear on the server. */
export function useMarkRead(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, messageId }: { threadId: string; messageId: string }) =>
      post<void>(`/threads/${threadId}/read`, { last_seen_message_id: messageId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: threadKeys.list(requestId) });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Send: a partner's first message opens the thread and posts in one call;
 *  every later message posts into the thread. No optimistic append — the
 *  server's row carries the number and the time, and a refusal must leave the
 *  text in the box. */
export function useSend(requestId: string, thread: Thread | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string): Promise<{ thread: Thread; message: ThreadMessage }> => {
      if (thread) {
        const message = await post<ThreadMessage>(`/threads/${thread.id}/messages`, { body });
        return { thread, message };
      }
      return post<{ thread: Thread; message: ThreadMessage }>(`/requests/${requestId}/threads`, { body });
    },
    onSuccess: ({ thread: t, message }) => {
      qc.setQueryData<InfiniteData<ThreadMessagePage>>(threadKeys.messages(t.id), (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        if (!first || first.items.some((m) => m.id === message.id)) return old;
        return { ...old, pages: [{ ...first, items: [message, ...first.items] }, ...rest] };
      });
      void qc.invalidateQueries({ queryKey: threadKeys.list(requestId) });
    },
  });
}
