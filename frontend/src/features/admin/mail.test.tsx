// The Ops mail log: today's counts, the failed mails first, and a re-send that
// says what happened — or why the database refused.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { MailPage } from "./mail";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({ id: "new" })),
}));
vi.mock("@api/client", () => api);

const STATS = {
  since: "2026-10-16T00:00:00Z", sent_today: 12, failed_today: 2, waiting: 1, retrying: 1, failed_open: 2,
  days: [{ day: "2026-10-16", sent: 12, failed: 2 }],
};

const row = (over: Record<string, unknown>) => ({
  id: "m1", created_at: "2026-10-16T05:00:00Z", to_email: "partner@northstar.co", to_name: "Ravi Menon",
  template: "rfp_published", label: "RFP-1001 Retail shelf imagery", entity_type: "request", entity_id: "r1",
  org_name: "Acme Retail Analytics", state: "failed", sent_at: null, failed_at: "2026-10-16T05:00:05Z",
  failure_reason: "smtp: 550 no such user", resent_from: null, resent_to: null, can_resend: true,
  attempts: 0, next_attempt_at: null, last_error: null,
  ...over,
});

const ROWS = [
  row({}),
  // a token mail whose link has expired: listed, but not re-sendable from here
  row({
    id: "m2", template: "worker_invitation", to_email: "asha@crowd.co", to_name: "Asha",
    label: "Crowd invitation · WKR-03 Asha", entity_type: "crowd_worker", org_name: "Bengaluru Crowd",
    failure_reason: "smtp: mailbox full", can_resend: false,
  }),
];

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ToastProvider>
          <MailPage />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path.startsWith("/mail/stats") ? STATS : ROWS),
  );
  api.post.mockReset().mockImplementation(() => Promise.resolve({ id: "new" }));
});

describe("the Mail page", () => {
  it("shows today's counts and opens on the failed mails", async () => {
    show();
    expect(await screen.findByText("Sent today")).toBeTruthy();
    expect(await screen.findByText("12")).toBeTruthy();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/mail?status=failed&limit=100"));
    expect(await screen.findByText("New RFP to partners")).toBeTruthy();
    expect(screen.getByText("smtp: 550 no such user")).toBeTruthy();
    expect(screen.getByText("Crowd invitation")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Failed" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("offers a re-send only where the database allows one, and says so when it worked", async () => {
    show();
    const buttons = await screen.findAllByRole("button", { name: "Resend" });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]!);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/mail/m1/resend"));
    expect(await screen.findByText("Queued again")).toBeTruthy();
  });

  it("shows the refusal when the database says no", async () => {
    api.post.mockImplementation(() =>
      Promise.reject(new Error("the link in this mail has expired; use Resend on the account itself")),
    );
    show();
    fireEvent.click((await screen.findAllByRole("button", { name: "Resend" }))[0]!);
    expect(await screen.findByText(/link in this mail has expired/)).toBeTruthy();
  });

  it("switches to every mail", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "All" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/mail?status=all&limit=100"));
  });
});

describe("a mail being retried", () => {
  it("says it is retrying, how many tries so far, and the latest refusal", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path.startsWith("/mail/stats")
          ? STATS
          : [row({
              id: "m3", state: "queued", failed_at: null, failure_reason: null, can_resend: false,
              template: "password_reset", to_email: "ravi@northstar.co", to_name: "Ravi Menon",
              entity_type: "app_user", label: "Password reset",
            }), row({
              id: "m4", state: "retrying", failed_at: null, failure_reason: null, can_resend: false,
              attempts: 1, next_attempt_at: "2026-10-16T05:05:00Z",
              last_error: "smtp: SMTPRecipientsRefused: 452 mailbox full",
            })],
      ),
    );
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Waiting" }));
    expect(await screen.findByText("Retrying")).toBeTruthy();
    expect(screen.getByText(/452 mailbox full · tried 1 time, next/)).toBeTruthy();
    expect(screen.getByText("1 retrying after a temporary refusal")).toBeTruthy();
    // a retrying mail is not re-sent by hand: the clock is already on it
    expect(screen.queryByRole("button", { name: "Resend" })).toBeNull();
  });
});
