// A delivery partner's own profile page, now that clients can find it in the
// vendors directory: it shows the expertise it has declared, prompts for it
// when there is none, and leads to its page as clients see it. A client's own
// page gains none of that.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Org } from "@api/types";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
}));
vi.mock("@api/client", () => api);

const session = vi.hoisted(() => ({
  current: {
    full_name: "Ravi Menon", org_id: "t1", org_name: "NorthStar", org_kind: "tenant",
    role: "tenant", scope: "owner", capabilities: ["profile.manage"],
  },
}));
vi.mock("@shared/auth", () => ({ useSession: () => session.current }));

import { OrganisationProfilePage } from "./organisation";

const PARTNER: Org = {
  id: "t1", reference_code: "TN-01", kind: "tenant", name: "NorthStar", status: "active",
  parent_org_id: null, country: "India", residency_region: "APAC", billing_status: "current",
  rating: 4.6, legal_name: "NorthStar Private Limited",
  profile: { hq: "Pune", plan: "Partner Pro", capabilities: null, fair_work_attested: true, since: "2024-03-01" },
  public_profile: {
    website: "https://northstar.example",
    expertise: { data_types: ["video", "image"], regions: ["IN"], certifications: ["iso_27001"] },
  },
  performance: {
    contracts_completed: 14, on_time_pct: 94, accepted_first_time_pct: 92, qa_pass_pct: 88,
    rating_avg: 4.6, rating_count: 12,
  },
  logo_version: null,
};

let org: Org = PARTNER;

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ToastProvider><OrganisationProfilePage /></ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  org = PARTNER;
  session.current = {
    full_name: "Ravi Menon", org_id: "t1", org_name: "NorthStar", org_kind: "tenant",
    role: "tenant", scope: "owner", capabilities: ["profile.manage"],
  };
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/organisations/me" ? org : null));
});

describe("a delivery partner's own profile", () => {
  it("leads to its page as clients see it", async () => {
    show();
    const link = await screen.findByRole("link", { name: "See how clients see you" });
    expect(link.getAttribute("href")).toBe("/vendors/t1");
  });

  it("shows the expertise it has declared and the figures that were calculated", async () => {
    show();
    expect(await screen.findByText("Video, Image")).toBeTruthy();
    expect(screen.getByText("ISO 27001")).toBeTruthy();
    expect(screen.getByText("★ 4.6 (12)")).toBeTruthy();
    expect(screen.getByText("94%")).toBeTruthy();
    expect(screen.getByText("Accepted first time")).toBeTruthy();
    expect(screen.queryByText("Your expertise is not listed yet")).toBeNull();
  });

  it("says what is at stake while no expertise is listed", async () => {
    org = { ...PARTNER, public_profile: { website: "https://northstar.example" } };
    show();
    expect(await screen.findByText("Your expertise is not listed yet")).toBeTruthy();
    expect(screen.getByText(/Add it from Edit profile/)).toBeTruthy();
  });

  it("tells a member who cannot edit who can", async () => {
    org = { ...PARTNER, public_profile: {} };
    session.current = { ...session.current, scope: "member" };
    show();
    expect(await screen.findByText(/An owner or manager can add it/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit profile" })).toBeNull();
  });

  it("says a partner with no record has none, not that its figures are zero", async () => {
    org = { ...PARTNER, rating: null, performance: undefined };
    show();
    expect(await screen.findByText("No completed work yet")).toBeTruthy();
    expect(screen.queryByText("0%")).toBeNull();
  });
});

describe("a client's own profile", () => {
  it("has no vendor page and is asked for no expertise", async () => {
    session.current = {
      full_name: "Priya Shah", org_id: "c1", org_name: "Acme", org_kind: "client",
      role: "client", scope: "owner", capabilities: ["profile.manage", "vendor.read"],
    };
    org = {
      ...PARTNER, id: "c1", reference_code: "CL-01", kind: "client", name: "Acme", rating: null,
      profile: { industry: "Retail", plan: "Enterprise", dpa_signed: true, since: "2024-01-01" },
      public_profile: { website: "https://acme.example" }, performance: undefined,
    };
    show();
    expect(await screen.findByRole("button", { name: "Edit profile" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "See how clients see you" })).toBeNull();
    expect(screen.queryByText("Your expertise is not listed yet")).toBeNull();
    expect(screen.queryByText("Track record")).toBeNull();
  });
});
