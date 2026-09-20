// Notifications, shared by the bell (app/shell) and the notifications page
// (features/notify): where each one leads, and marking them read.

import type { QueryClient } from "@tanstack/react-query";
import { post } from "@api/client";
import type { NotificationRow } from "@api/types";

// The backend stores a deep link on every notification — "so the bell can take
// the reader to the thing itself", as notify/service.py puts it — in the
// prototype's page vocabulary. Nothing ever translated it, so clicking a
// "A proposal arrived" notification did nothing at all.
export function notificationHref(n: NotificationRow): string | null {
  const id = n.link_params?.id;
  switch (n.link_page) {
    case "requestDetail": return id ? `/requests/${id}` : "/requests";
    case "requests": return "/requests";
    case "opportunities": return "/opportunities";
    case "proposals": return "/proposals";
    case "contracts": return id ? `/contracts/${id}` : "/contracts";
    case "deliveries": return id ? `/deliveries/${id}` : "/deliveries";
    case "deliveryDetail": return id ? `/deliveries/${id}` : "/deliveries";
    case "tasks": return "/tasks";
    case "qa": return "/qa";
    case "equipment": return "/equipment";
    case "loans": return "/loans";
    case "billing": return "/billing";
    // The operator's pages were missing from this map entirely, and Ops has
    // exactly one inbound notification: onboarding/service.py sends
    // link_page "onboarding" when a tenant asks for a network entity. It fell
    // through to null, so the one alert the platform operator receives was the
    // one row in the bell that did nothing when clicked.
    case "onboarding": return "/onboarding";
    case "accounts": return "/accounts";
    case "activity": return "/activity";
    default: return null;
  }
}

/**
 * Marks one notification read, or every one with no id, then refreshes every
 * notifications query — the bell and the page share the ["notifications"]
 * prefix. Opening a notification used to leave it unread: the per-item
 * endpoint existed and nothing called it, so the only way to clear the badge
 * was "Mark all read".
 */
export function markRead(qc: QueryClient, id?: string): Promise<void> {
  return post<void>(id ? `/notifications/${id}/read` : "/notifications/read").finally(() => {
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  });
}
