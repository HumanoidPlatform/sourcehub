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
    ["network", undefined, null],
  ])("%s -> %s", (page, id, want) => {
    expect(notificationHref(row(page as string, id as string | undefined))).toBe(want);
  });
});

describe("the id that must NOT be used", () => {
  it('sends a loan alert to /requests, never to /requests/<loan id>', () => {
    // A trap for anyone "finishing the job" by making every case use its id.
    // network/service.py:146 sends link_page "requests" with a LOAN id, and
    // /requests/:id exists — so that change would route a device sponsor to
    // RequestDetailPage fetching a loan uuid, and 404. The destination it
    // actually wants is /loans.
    const loan = "0f0c2f2e-0000-4000-8000-000000000001";
    const href = notificationHref(row("requests", loan));
    expect(href).toBe("/requests");
    expect(href).not.toContain(loan);
  });
});

describe("an unknown page", () => {
  it.each([["assignment"], ["somethingNew"], [null]])("%s yields no link", (page) => {
    expect(notificationHref(row(page as string | null))).toBeNull();
  });
});
