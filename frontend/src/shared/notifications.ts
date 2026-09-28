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
    // ?task= rather than a path segment: the task detail is a dialog on the
    // list, not a page of its own, and every /:id route in this app is a full
    // page. Without the id this landed on /tasks — which, for an aggregator
    // who lives on /tasks, is the page they were already looking at, so the
    // click was indistinguishable from nothing happening.
    case "tasks": return id ? `/tasks?task=${id}` : "/tasks";
    case "qa": return "/qa";
    // Gate 1: a worker submitted and the supplier reviews it. /review has
    // existed all along; this case never did, so every one of these rendered
    // as the dead <div> at Shell.tsx:349 — unclickable, and never marked read.
    // Org-wide, so it reaches every user at the aggregator.
    case "gate1": return "/review";
    case "equipment": return "/equipment";
    case "loans": return "/loans";
    // The sponsor's queue, and the partner's answer to "who wants my kit".
    // Nothing emitted "loans" until network/service.py stopped mislabelling a
    // loan alert as "requests" — which sent a device sponsor to the client's
    // RFP list, empty, with a button offering to publish one.
    //
    // "network" is the same omission as gate1 and onboarding below: the tenant
    // has /network in its own sidebar and the route has always existed, but
    // onboarding/service.py's two alerts ("X was approved and is now in your
    // network") fell through to null, so the moment a partner's network grew
    // was the one row in the bell that did nothing.
    case "network": return "/network";
    case "billing": return "/billing";
    // The operator's pages were missing from this map entirely, and Ops has
    // exactly one inbound notification: onboarding/service.py sends
    // link_page "onboarding" when a tenant asks for a network entity. It fell
    // through to null, so the one alert the platform operator receives was the
    // one row in the bell that did nothing when clicked.
    case "onboarding": return "/onboarding";
    case "accounts": return "/accounts";
    case "activity": return "/activity";
    // A conversation on an RFP. The RFP page shows it for every role in every
    // state and selects it from ?thread=, so link_params carries the request
    // as well as the thread — the one case that reads more than `id`.
    case "thread": {
      const request = n.link_params?.request;
      if (!request) return null;
      return id ? `/requests/${request}?thread=${id}` : `/requests/${request}`;
    }
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
