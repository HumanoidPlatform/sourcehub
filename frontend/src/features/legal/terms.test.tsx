// The Onboarding Terms & Conditions in the console (db/470).
//
// Drives the real router and auth provider over a stubbed fetch, as
// session.test.tsx does. Pins: a person with the Terms due sees only the gate,
// whatever address they open; "I Accept" stays disabled until the box is
// ticked; accepting records the version and refreshes into the console; the
// invitation cannot be finished without ticking; /terms reads signed out.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { AuthProvider } from "@shared/auth";
import { AppRouter } from "../../app/router";

const TERMS = {
  version: "1.0",
  title: "DataMind360 Onboarding Terms & Conditions",
  effective_at: "2026-10-14T18:30:00Z",
  body: "These Terms apply to every Participant.\n\n## 1. Definitions and roles\n\n- Platform: the site.\n- Data: anything.\n\n"
    + "## 14. General provisions\n\n14.9 Grievance contact. Write to [name], [email].",
  checkbox_text: "I have read, understood and agree to be bound by the Terms.",
  declaration: ["I am at least 18 years old.", "I accept Sections 10 and 11."],
  sha256: "ab".repeat(32),
};

const session = (terms_due: string | null) => ({
  access_token: terms_due ? "access-due" : "access-ok",
  refresh_token: "refresh-u1",
  user_id: "u1",
  full_name: "User u1",
  email: "u1@example.com",
  org_id: "o1",
  org_kind: "client",
  org_name: "Acme Retail Analytics",
  role: "client",
  scope: "owner",
  capabilities: [],
  must_change_password: false,
  terms_due,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Call = { url: string; body: unknown };

function stubApi(invitation?: { terms: { version: string; title: string } | null }) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (u.endsWith("/public/terms")) return json(200, TERMS);
    if (u.endsWith("/terms/accept")) return new Response(null, { status: 204 });
    if (u.endsWith("/auth/refresh")) return json(200, session(null));
    if (u.includes("/auth/invitation/accept")) return new Response(null, { status: 204 });
    if (u.includes("/auth/invitation/")) {
      return json(200, { email: "new@acme.example", org_name: "Acme", role_code: "client", valid: true,
                        terms: invitation?.terms ?? null });
    }
    if (u.includes("/notifications")) return json(200, { unread: 0, items: [] });
    return json(200, []);
  }));
  return calls;
}

function Where() {
  const l = useLocation();
  return <output data-testid="where">{l.pathname}</output>;
}

function renderApp(at: string) {
  const router = createMemoryRouter(
    [{ path: "*", element: <AuthProvider><ToastProvider><AppRouter /><Where /></ToastProvider></AuthProvider> }],
    { initialEntries: [at] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("the Terms gate", () => {
  it("holds a person with the Terms due, whatever they open", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("1.0")));
    stubApi();
    renderApp("/datahub");
    expect(await screen.findByRole("heading", { name: "Terms & Conditions" })).toBeTruthy();
    expect(await screen.findByText("These Terms apply to every Participant.")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /main/i })).toBeNull();
  });

  it("enables I Accept only once ticked, records the version and refreshes into the console", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("1.0")));
    const calls = stubApi();
    renderApp("/datahub");
    const button = await screen.findByRole("button", { name: "I Accept" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(await screen.findByRole("checkbox", { name: TERMS.checkbox_text }));
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(screen.queryByRole("button", { name: "I Accept" })).toBeNull());
    expect(calls.find((c) => c.url.endsWith("/terms/accept"))?.body).toEqual({ version: "1.0" });
    expect(calls.some((c) => c.url.endsWith("/auth/refresh"))).toBe(true);
    expect(JSON.parse(localStorage.getItem("sourcehub.session") ?? "{}").terms_due).toBeNull();
    expect(screen.getByTestId("where").textContent).toBe("/datahub");
  });

  it("still opens the full text from the gate", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("1.0")));
    stubApi();
    renderApp("/terms");
    expect(await screen.findByRole("heading", { name: TERMS.title })).toBeTruthy();
  });
});

describe("the invitation", () => {
  it("cannot be finished without ticking the Terms, and sends the version ticked", async () => {
    const calls = stubApi({ terms: { version: "1.0", title: TERMS.title } });
    renderApp("/accept-invitation?token=t1");
    const finish = await screen.findByRole("button", { name: "Set password and finish" });
    fireEvent.change(screen.getByLabelText(/Choose a password/), { target: { value: "long-enough-1" } });
    fireEvent.change(screen.getByLabelText(/Repeat it/), { target: { value: "long-enough-1" } });
    expect((finish as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(await screen.findByRole("checkbox", { name: TERMS.checkbox_text }));
    expect((finish as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(finish);
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/auth/invitation/accept"))).toBe(true));
    expect(calls.find((c) => c.url.endsWith("/auth/invitation/accept"))?.body).toEqual({
      token: "t1", password: "long-enough-1", terms_version: "1.0",
    });
  });

  it("asks a crowd worker for no Terms", async () => {
    stubApi({ terms: null });
    renderApp("/accept-invitation?token=t1");
    await screen.findByRole("button", { name: "Set password and finish" });
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

describe("/terms", () => {
  it("reads signed out, says it is a draft while [values] remain, and anchors section 14", async () => {
    stubApi();
    renderApp("/terms");
    expect(await screen.findByRole("heading", { name: TERMS.title })).toBeTruthy();
    expect(screen.getByText("Draft — not yet approved")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "14. General provisions" }).id).toBe("s14");
    expect(screen.getByText("Platform: the site.").tagName).toBe("LI");
  });
});
