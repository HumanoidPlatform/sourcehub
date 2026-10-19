// The Workers dialog as a campaign view: the offer panel must count how far
// the crowd has come, show what each recipient has been sent, and offer the
// two manual reminders — with the API's refusal shown in words, not lost.
//
// Offers and reminders reach the crowd only through the app (db/550): each
// unanswered chip says how far the offer got (pushed, seen, no app, push
// failed), and the offer dialog says who has no app before it is sent.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Assignment, OfferNotice, Task, TaskOffer, TaskOfferRecipient, WorkerRow } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);
// "Captured so far" is the paged gallery (db/530); this is about the campaign
// view, so it draws nothing.
vi.mock("./GalleryGrid", () => ({ GalleryGrid: () => null }));
// The dialog reads the session for the worker-rating button (db/380): the
// aggregator that opens it, holding rating.write.
vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Anita Rao", org_id: "o-bengaluru", org_name: "Bengaluru Crowd Collective",
    org_kind: "aggregator", role: "aggregator", capabilities: ["rating.write"] as string[],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { ToastProvider } from "@ds/primitives";
import { OfferTaskDialog, TaskAssignmentsDialog } from "./assignments";

const TASK = {
  id: "t1", reference_code: "TSK-07", title: "Metro shelf capture", status: "in_progress",
  target_unit: "photos", target_quantity: 30,
} as unknown as Task;

function assignment(over: Partial<Assignment>): Assignment {
  return {
    id: "a1", task_id: "t1", contract_id: "c1", supplier_org_id: "o1", worker_user_id: "u1",
    worker_name: "Priya Nair", worker_ref: "WKR-01", quantity: 10, status: "assigned",
    instructions: null, due_on: null, worker_note: null, decision_note: null,
    assigned_at: "2026-09-14T10:00:00Z", started_at: null, submitted_at: null, decided_at: null,
    reminder_count: 0, last_reminded_at: null,
    assets: { pending: 0, ready: 0, quarantined: 0, total: 0 },
    task: { id: "t1", reference_code: "TSK-07", title: "Metro shelf capture", instructions: null, capture_spec: {}, target_unit: "photos", due_on: null, status: "in_progress" },
    ...over,
  } as Assignment;
}

/** What reached a recipient: pushed to their phone unless a test says otherwise. */
function notice(over: Partial<OfferNotice> = {}): OfferNotice {
  return {
    state: "pushed", last_at: "2026-09-21T10:00:00Z", pushed_at: "2026-09-21T10:00:05Z",
    failure: null, seen_at: null, ...over,
  };
}

const OFFER: TaskOffer = {
  id: "o1", task_id: "t1", status: "open", effective_status: "open", worker_limit: 3, quantity: 10,
  accepted_count: 2, declined_count: 0, pending_count: 1, instructions: null, due_on: null,
  respond_by: "2026-10-05T10:00:00Z", created_at: "2026-09-21T10:00:00Z", closed_at: null,
  recipients: [
    { id: "r1", worker_user_id: "u1", worker_name: "Priya Nair", worker_ref: "WKR-01", email: "p@x", sent_at: "2026-09-21T10:00:00Z", send_error: null, response: "accepted", responded_at: "2026-09-21T11:00:00Z", assignment_id: "a1", reminders: [],
      app_connected: true, notice: notice({ state: "seen", seen_at: "2026-09-21T10:30:00Z" }) },
    { id: "r2", worker_user_id: "u2", worker_name: "Arjun Rao", worker_ref: "WKR-02", email: "a@x", sent_at: "2026-09-21T10:00:00Z", send_error: null, response: "accepted", responded_at: "2026-09-21T12:00:00Z", assignment_id: "a2", reminders: [],
      app_connected: true, notice: notice({ state: "seen", seen_at: "2026-09-21T11:30:00Z" }) },
    { id: "r3", worker_user_id: "u3", worker_name: "Meera Iyer", worker_ref: "WKR-03", email: "m@x", sent_at: "2026-09-21T10:00:00Z", send_error: null, response: null, responded_at: null, assignment_id: null,
      reminders: [{ kind: "offer_nudge", step: 0, sent_at: "2026-09-28T10:00:00Z", send_error: null, manual: false }],
      app_connected: true, notice: notice() },
  ],
};

/** An unanswered recipient of the offer, for the chip tests. */
function silent(id: string, name: string, n: OfferNotice, app_connected = true): TaskOfferRecipient {
  return {
    id, worker_user_id: `u-${id}`, worker_name: name, worker_ref: null, email: `${id}@x`,
    sent_at: "2026-09-21T10:00:00Z", send_error: null, response: null, responded_at: null,
    assignment_id: null, reminders: [], app_connected, notice: n,
  };
}

const ROWS = [
  assignment({ id: "a1", status: "assigned", reminder_count: 2, last_reminded_at: "2026-09-18T09:00:00Z" }),
  assignment({ id: "a2", worker_user_id: "u2", worker_name: "Arjun Rao", status: "submitted", submitted_at: "2026-09-20T10:00:00Z", assets: { pending: 0, ready: 10, quarantined: 0, total: 10 } }),
];

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <TaskAssignmentsDialog task={TASK} onClose={() => {}} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path.endsWith("/offers") ? [OFFER] : ROWS),
  );
  api.post.mockReset();
});

it("counts the funnel and shows each recipient's reminder history", async () => {
  show();
  // every recipient is told on the phone the moment the offer is made, so the
  // funnel starts at "notified", not at whose email went out
  expect(await screen.findByText("3 notified · 2 answered · 2 accepted · 1 started · 1 submitted")).toBeTruthy();
  expect(screen.getByText("reminded ×1")).toBeTruthy();
  // the one still to answer was pushed to their phone
  expect(screen.getByText("Pushed · waiting")).toBeTruthy();
  // the assignments table: how often each worker has been chased
  expect(screen.getByText(/^2× · /)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remind the silent (1)" })).toBeTruthy();
});

it("sends the manual reminders and shows the API's refusal", async () => {
  api.post.mockImplementation((path: string) =>
    path === "/offers/o1/remind"
      ? Promise.resolve(OFFER)
      : Promise.reject(new Error("Priya Nair was reminded 3 minutes ago.")),
  );
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Remind the silent (1)" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/offers/o1/remind", {}));
  expect(await screen.findByText("Reminders sent")).toBeTruthy();

  // one Remind per live, unsubmitted row: a1 (assigned) yes, a2 (submitted) no
  const remind = screen.getAllByRole("button", { name: "Remind" });
  expect(remind).toHaveLength(1);
  fireEvent.click(remind[0]!);
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/assignments/a1/remind", {}));
  expect(await screen.findByText("Priya Nair was reminded 3 minutes ago.")).toBeTruthy();
});

/** The chip that names this recipient: their name, then the pills. */
function chipOf(name: string): Promise<HTMLElement> {
  return screen.findByText(name, { exact: false, selector: ".chip" });
}

it("shows how far the offer got to each recipient who has not answered", async () => {
  const offer: TaskOffer = {
    ...OFFER,
    accepted_count: 1, pending_count: 5,
    recipients: [
      OFFER.recipients[0]!,
      silent("p", "Kavya Menon", notice()),
      silent("s", "Rohan Das", notice({ state: "seen", seen_at: "2026-09-21T10:20:00Z" })),
      silent("n", "Lata Pillai", notice({ state: "no_app", pushed_at: null }), false),
      silent("f", "Imran Khan", notice({ state: "failed", pushed_at: null, failure: "expo: DeviceNotRegistered" })),
      silent("w", "Nisha Rao", notice({ state: "sending", pushed_at: null })),
    ],
  };
  api.get.mockImplementation((path: string) => Promise.resolve(path.endsWith("/offers") ? [offer] : ROWS));
  api.post.mockImplementation(() => Promise.resolve(offer));
  show();

  // an answer wins over whatever reached them
  expect(within(await chipOf("Priya Nair")).getByText("Accepted")).toBeTruthy();
  const pushed = await chipOf("Kavya Menon");
  expect(within(pushed).getByText("Pushed · waiting")).toBeTruthy();
  expect(pushed.title).toMatch(/^pushed /);
  const seen = await chipOf("Rohan Das");
  expect(within(seen).getByText("Seen · waiting")).toBeTruthy();
  expect(seen.title).toMatch(/^seen /);
  const noApp = await chipOf("Lata Pillai");
  expect(within(noApp).getByText("No app")).toBeTruthy();
  expect(noApp.title).toMatch(/no phone connected/);
  // the reason it was not pushed is in the tooltip, not lost
  const failed = await chipOf("Imran Khan");
  expect(within(failed).getByText("Push failed")).toBeTruthy();
  expect(failed.title).toContain("expo: DeviceNotRegistered");
  expect(within(await chipOf("Nisha Rao")).getByText("Sending…")).toBeTruthy();
  // the bare "Waiting" is only for offers from before, which went by mail
  expect(screen.queryByText("Waiting")).toBeNull();
  // no mail went, so there is no mail error to report
  expect(screen.queryByText(/did not go out/)).toBeNull();

  // a reminder goes the same way, so the one with no app is called out
  fireEvent.click(screen.getByRole("button", { name: "Remind the silent (5)" }));
  expect(await screen.findByText("Reminders sent")).toBeTruthy();
  expect(screen.getByText(/1 of them has no app connected/)).toBeTruthy();
});

it("keeps an offer from before the change readable, mail error and all", async () => {
  const offer: TaskOffer = {
    ...OFFER,
    accepted_count: 0, pending_count: 1,
    recipients: [
      silent("e", "Kavya Menon", notice({ state: "emailed", pushed_at: null }), false),
      // its mail failed: no bell row either, so the server reads it as e-mailed
      { ...silent("x", "Rohan Das", notice({ state: "emailed", pushed_at: null }), false), sent_at: null, send_error: "mailbox full" },
    ],
  };
  api.get.mockImplementation((path: string) => Promise.resolve(path.endsWith("/offers") ? [offer] : ROWS));
  show();
  expect(within(await chipOf("Kavya Menon")).getByText("Waiting")).toBeTruthy();
  expect(within(await chipOf("Rohan Das")).getByText("Waiting")).toBeTruthy();
  expect(screen.queryByText("Sending…")).toBeNull();
  expect(await screen.findByText("Some emails did not go out")).toBeTruthy();
  expect(screen.getByText("Rohan Das: mailbox full")).toBeTruthy();
});

/* --- the offer dialog ---------------------------------------------------------- */

function crowd(over: Partial<WorkerRow>): WorkerRow {
  return {
    id: "w9", reference_code: "WKR-09", display_name: "Somebody", skills: [], status: "on_shift",
    trained: true, rating: null, rating_count: 0, email: "s@x", phone: null, user_id: "u9",
    invitation_status: "accepted", open_assignments: 0, app_connected: true,
    ...over,
  };
}

function offerDialog(workers: WorkerRow[]) {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/network/workers" ? workers : []),
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <OfferTaskDialog task={TASK} onClose={() => {}} onDone={() => {}} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

it("notifies rather than e-mails, and says who has no app before sending", async () => {
  offerDialog([
    crowd({ id: "w3", user_id: "u3", display_name: "Meera Iyer" }),
    crowd({ id: "w4", user_id: "u4", display_name: "Kabir Shah", app_connected: false }),
    // not known is not "no app": nothing is said about them
    crowd({ id: "w5", user_id: "u5", display_name: "Lata Pillai", app_connected: null }),
  ]);
  const send = await screen.findByRole("button", { name: "Send offer to 3 crowd resources" });
  expect(screen.queryByRole("button", { name: /^Email/ })).toBeNull();
  // the picker marks the one with no app, and only them
  expect(screen.getAllByText("no app")).toHaveLength(1);
  expect(screen.getByRole("checkbox", { name: /Kabir Shah\s*no app/ })).toBeTruthy();
  expect(screen.getByText("1 of 3 has no app connected")).toBeTruthy();
  expect(screen.getByText(/no push and no e-mail/)).toBeTruthy();
  // a warning, not a block
  expect((send as HTMLButtonElement).disabled).toBe(false);

  // without them there is nothing to warn about
  fireEvent.click(screen.getByRole("checkbox", { name: /Kabir Shah/ }));
  expect(await screen.findByRole("button", { name: "Send offer to 2 crowd resources" })).toBeTruthy();
  expect(screen.queryByText(/has no app connected/)).toBeNull();
});

it("says nothing about the app when everyone picked has one", async () => {
  offerDialog([
    crowd({ id: "w3", user_id: "u3", display_name: "Meera Iyer" }),
    crowd({ id: "w4", user_id: "u4", display_name: "Kabir Shah" }),
  ]);
  expect(await screen.findByRole("button", { name: "Send offer to 2 crowd resources" })).toBeTruthy();
  expect(screen.queryByText("no app")).toBeNull();
  expect(screen.queryByText(/no app connected/)).toBeNull();
});
