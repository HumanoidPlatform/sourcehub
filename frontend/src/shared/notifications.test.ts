// Where a notification leads. The backend stores a deep link on every one, in
// the prototype's page vocabulary, and this switch is the only thing that
// translates it — so a page missing from it is a row in the bell that renders
// as a dead <div> (Shell.tsx:349): unclickable, unfocusable, never even marked
// read. It had no test at all.
//
// The cases below are the link_page values actually present on the pilot
// database, not invented ones.

import { describe, expect, it } from "vitest";
import { notificationHref } from "./notifications";
import type { NotificationRow } from "@api/types";

const row = (link_page: string | null, id?: string): NotificationRow => ({
  id: "n1",
  body: "…",
  link_page,
  link_params: id ? { id } : null,
  read: false,
  created_at: "2026-09-22T09:16:00Z",
});

const TASK = "774987d8-b61d-4740-b81c-7fc7df54b44a";

describe("a task notification", () => {
  it("opens the task, not the list", () => {
    // Bug 32. It returned "/tasks" and dropped the id — and since /tasks is
    // the aggregator's own page, clicking from there changed nothing visible.
    expect(notificationHref(row("tasks", TASK))).toBe(`/tasks?task=${TASK}`);
  });

  it("still falls back to the list when there is no id", () => {
    expect(notificationHref(row("tasks"))).toBe("/tasks");
  });
});

describe("a gate 1 notification", () => {
  it("leads to the review queue instead of nowhere", () => {
    // Never in the switch, so it fell to `default: return null`. Org-wide, so
    // it reached every user at the aggregator.
    expect(notificationHref(row("gate1"))).toBe("/review");
  });
});

describe("the links that already worked", () => {
  // Guards. Bug 32 edited this switch; none of these may move.
  it.each([
    ["requestDetail", "r7", "/requests/r7"],
    ["contracts", "c1", "/contracts/c1"],
    ["deliveries", "c1", "/deliveries/c1"],
    ["deliveryDetail", "c1", "/deliveries/c1"],
    ["opportunities", "r7", "/opportunities"],
    ["onboarding", "o1", "/onboarding"],
    ["qa", undefined, "/qa"],
    ["proposals", undefined, "/proposals"],
    // db/320: the bell row names the invoice, and the Billing page opens it
    ["billing", "i9", "/billing?invoice=i9"],
    ["billing", undefined, "/billing"],
  ])("%s -> %s", (page, id, want) => {
    expect(notificationHref(row(page as string, id as string | undefined))).toBe(want);
  });
});

describe("a network notification", () => {
  it("opens the partner's network page instead of nowhere", () => {
    // This test used to assert null, which enshrined the bug: /network is in
    // the tenant's own sidebar and the route has always existed, but
    // onboarding/service.py's two alerts had no case, so "X was approved and
    // is now in your network" was unclickable.
    expect(notificationHref(row("network"))).toBe("/network");
  });

  it("ignores link_params.onboarding_id, which is not an :id route", () => {
    // onboarding/service.py:326 sends {"onboarding_id": ...}, not {"id": ...},
    // so there is nothing for the switch to interpolate even if /network/:id
    // existed — which it does not.
    expect(notificationHref(row("network", "o1"))).toBe("/network");
  });
});

describe("a loan alert", () => {
  const loan = "0f0c2f2e-0000-4000-8000-000000000001";

  it("opens the sponsor's loan queue, not the RFP list", () => {
    // The bug this file used to enshrine. request_loan tagged the SPONSOR's
    // notification "requests", which is the CLIENT's RFP list, so a device
    // sponsor clicking "X requests 40 × Helmet camera" landed on a page
    // offering to publish an RFP — empty, because RLS returns them none. The
    // sponsor's own queue is /loans, the sidebar item they see as "Requests".
    // network/service.py now sends "loans"; this case was always here waiting.
    expect(notificationHref(row("loans", loan))).toBe("/loans");
  });

  it("does not put the loan id in the path", () => {
    // The original trap, kept. /loans is a queue, not a detail page, and there
    // is no /loans/:id route — so "finishing the job" by making every case use
    // its id would send the sponsor to a 404.
    expect(notificationHref(row("loans", loan))).not.toContain(loan);
  });
});

describe("the id that must NOT be used", () => {
  it('sends an RFP-list alert to /requests, never to /requests/<id>', () => {
    // Unchanged intent: /requests/:id exists and renders RequestDetailPage, so
    // a case that appended an id here would fetch whatever uuid it was handed.
    // Nothing emits "requests" any more, but the case remains correct for a
    // client, and this is what stops it acquiring an id later.
    const id = "0f0c2f2e-0000-4000-8000-000000000001";
    const href = notificationHref(row("requests", id));
    expect(href).toBe("/requests");
    expect(href).not.toContain(id);
  });
});

describe("a conversation notification", () => {
  // The one case that reads more than `id`: the thread lives on the RFP page,
  // so the link needs the request as well, and the page selects the thread
  // from ?thread=.
  const thread = (params: Record<string, string> | null): NotificationRow => ({
    ...row("thread"), link_params: params,
  });

  it("opens the RFP with that thread selected", () => {
    expect(notificationHref(thread({ id: "t1", request: "r1" }))).toBe("/requests/r1?thread=t1");
  });

  it("falls back to the RFP page without a thread id", () => {
    expect(notificationHref(thread({ request: "r1" }))).toBe("/requests/r1");
  });

  it("goes nowhere without the request", () => {
    expect(notificationHref(thread({ id: "t1" }))).toBeNull();
    expect(notificationHref(thread(null))).toBeNull();
  });
});

describe("an unknown page", () => {
  it.each([["assignment"], ["somethingNew"], [null]])("%s yields no link", (page) => {
    expect(notificationHref(row(page as string | null))).toBeNull();
  });
});
