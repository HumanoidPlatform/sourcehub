// The operator's account list on DataTable: sortable, filterable, and every
// row still opens the account — once.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsPage } from "./pages";

const api = vi.hoisted(() => ({ get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])) }));
vi.mock("@api/client", () => api);

const org = (id: string, name: string, rating: string | null, status = "active") => ({
  id, name, reference_code: `CL-${id}`, kind: "client", status, rating, billing_status: "current",
  country: "IN", residency_region: "APAC", profile: { industry: "Retail", plan: "Growth" },
});

function renderAccounts() {
  const router = createMemoryRouter(
    [
      { path: "/accounts", element: <AccountsPage /> },
      { path: "/accounts/:id", element: <p>account detail</p> },
    ],
    { initialEntries: ["/accounts"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(
      path.includes("kind=client")
        ? [org("7", "Northstar Retail", "4.2"), org("8", "Acme Analytics", null, "suspended"), org("9", "Bluefin Foods", "4.8")]
        : [],
    ),
  );
});

// the panel under the "Clients" heading
const clientsPanel = () => screen.getByRole("heading", { name: "Clients" }).closest("section")!;

describe("accounts", () => {
  const clientRows = () =>
    within(clientsPanel())
      .getAllByRole("row")
      .slice(1)
      .map((tr) => tr.querySelectorAll("td")[1]!.textContent);

  it("sorts clients by rating as numbers, unrated last, and filters them by name", async () => {
    renderAccounts();
    await screen.findByText("Northstar Retail");
    const clients = within(clientsPanel());

    fireEvent.click(clients.getByRole("button", { name: /^Rating/ }));
    expect(clientRows()).toEqual(["Northstar Retail", "Bluefin Foods", "Acme Analytics"]);

    fireEvent.change(clients.getByRole("searchbox", { name: "Filter clients" }), { target: { value: "acme" } });
    expect(clientRows()).toEqual(["Acme Analytics"]);
  });

  it("opens an account from anywhere on its row", async () => {
    const router = renderAccounts();
    fireEvent.click(await screen.findByText("Bluefin Foods"));
    expect(await screen.findByText("account detail")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/accounts/9");
  });

  it("opens it once from the Open button, so Back returns to the list", async () => {
    const router = renderAccounts();
    await screen.findByText("Bluefin Foods");
    const row = screen.getByText("Bluefin Foods").closest("tr")!;
    fireEvent.click(within(row).getByRole("link", { name: "Open" }));
    expect(await screen.findByText("account detail")).toBeTruthy();

    // the row's own click would have pushed the same page a second time
    await router.navigate(-1);
    expect(router.state.location.pathname).toBe("/accounts");
  });
});
