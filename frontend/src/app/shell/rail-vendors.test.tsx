// The directory is the buyer's. It is in the client's rail, between the
// deliveries and the billing, and in nobody else's.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const session = vi.hoisted(() => ({
  current: {
    full_name: "Priya Nair", email: "priya@acme.example", org_id: "o1",
    org_name: "Acme Retail Analytics", org_kind: "client", role: "client", capabilities: [] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));
vi.mock("@api/client", () => ({
  get: vi.fn((): Promise<unknown> => Promise.resolve({ unread: 0, items: [] })),
  post: vi.fn((): Promise<unknown> => Promise.resolve()),
}));

import { Shell } from "./Shell";

function rail(role: string, kind: string) {
  session.current = { ...session.current, role, org_kind: kind };
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <ToastProvider><Shell><p>page</p></Shell></ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return within(screen.getByRole("navigation", { name: "Primary" }))
    .getAllByRole("link")
    .map((a) => [a.textContent, a.getAttribute("href")]);
}

describe("the Vendors link", () => {
  it("sits in the client's rail, between Deliverables for Review and the dataset catalogue", () => {
    const links = rail("client", "client");
    const labels = links.map(([label]) => label);
    expect(labels).toEqual([
      "Overview", "RFPs", "Deliverables for Review", "Vendors", "Datasets", "Billing",
    ]);
    const at = labels.indexOf("Vendors");
    expect(links[at]).toEqual(["Vendors", "/vendors"]);
    expect(labels[at - 1]).toBe("Deliverables for Review");
    expect(links[at + 1]).toEqual(["Datasets", "/catalogue"]);
  });

  it.each([
    ["tenant", "tenant"], ["aggregator", "aggregator"], ["business", "business"],
    ["sponsor", "sponsor"], ["worker", "aggregator"], ["platform_admin", "platform"],
  ])("is not in the %s rail", (role, kind) => {
    expect(rail(role, kind).map(([label]) => label)).not.toContain("Vendors");
  });
});
