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
  it("sits in the client's rail, between Deliverables for Review and DataHub", () => {
    const links = rail("client", "client");
    const labels = links.map(([label]) => label);
    expect(labels).toEqual([
      "Overview", "RFPs", "Deliverables for Review", "Vendors", "DataHub", "Billing",
    ]);
    const at = labels.indexOf("Vendors");
    expect(links[at]).toEqual(["Vendors", "/vendors"]);
    expect(labels[at - 1]).toBe("Deliverables for Review");
    expect(links[at + 1]).toEqual(["DataHub", "/datahub"]);
  });

  it.each([
    ["tenant", "tenant"], ["aggregator", "aggregator"], ["business", "business"],
    ["sponsor", "sponsor"], ["worker", "aggregator"], ["platform_admin", "platform"],
  ])("is not in the %s rail", (role, kind) => {
    expect(rail(role, kind).map(([label]) => label)).not.toContain("Vendors");
  });
});

describe("DataHub", () => {
  it("is not in the aggregator's rail: an aggregator takes no part in it (0048)", () => {
    expect(rail("aggregator", "aggregator").map(([label]) => label)).not.toContain("DataHub");
  });

  it.each([["client", "client"], ["tenant", "tenant"]])("is in the %s rail", (role, kind) => {
    expect(rail(role, kind).map(([label]) => label)).toContain("DataHub");
  });
});

describe("the Mail link", () => {
  it("ends the operations rail, after Activity (db/480: every e-mail the platform sent)", () => {
    const links = rail("platform_admin", "platform");
    const labels = links.map(([label]) => label);
    expect(labels.slice(-2)).toEqual(["Activity", "Mail"]);
    expect(links[links.length - 1]).toEqual(["Mail", "/mail"]);
  });

  it.each([["client", "client"], ["tenant", "tenant"], ["aggregator", "aggregator"]])(
    "is not in the %s rail",
    (role, kind) => {
      expect(rail(role, kind).map(([label]) => label)).not.toContain("Mail");
    },
  );
});
