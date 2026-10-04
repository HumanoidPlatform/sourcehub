// What a client sees of a bidder beside its price: the calculated figures its
// vendor page shows, led by what its clients decided. Not the rate the seed
// wrote, and not zeros for a partner that is simply new.

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Proposal } from "@api/types";

vi.mock("@api/client", () => ({
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), del: vi.fn(), putFile: vi.fn(),
}));
vi.mock("@shared/auth", () => ({
  useSession: () => ({ org_id: "o", org_kind: "client", role: "client", capabilities: [] }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { BidderRecord } from "./pages";

const bid = (over: Partial<Proposal>): Proposal => ({
  id: "p1", reference_code: "PRO-01", request_id: "r1", partner_org_id: "t1",
  partner_name: "NorthStar", price: "1000.00", currency: "USD",
  duration_days: 10, methodology: "m", notes: null, status: "submitted",
  submitted_at: "2026-09-28T09:00:00Z",
  ...over,
});

const cell = (p: Proposal) => render(<table><tbody><tr><td><BidderRecord p={p} /></td></tr></tbody></table>).container;

describe("a bidder's record beside its bid", () => {
  it("leads with what its clients decided, then its own gate and its rating", () => {
    const td = cell(bid({
      partner_accepted_first_time: 92, partner_qa_pass_rate: 88, partner_rating: 4.6,
      partner_rating_count: 12, partner_contracts_completed: 14,
    }));
    expect(screen.getByText("92% accepted first time")).toBeTruthy();
    expect(screen.getByText("88% QA pass")).toBeTruthy();
    expect(screen.getByText("★ 4.6 (12)")).toBeTruthy();
    expect(td.textContent!.indexOf("accepted first time")).toBeLessThan(td.textContent!.indexOf("QA pass"));
  });

  it("says a bidder with no record has none", () => {
    cell(bid({
      partner_accepted_first_time: null, partner_qa_pass_rate: null, partner_rating: null,
      partner_rating_count: 0, partner_contracts_completed: 0,
    }));
    expect(screen.getByText("No completed work yet")).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("does the same for a row an older API sent without the figures", () => {
    cell(bid({}));
    expect(screen.getByText("No completed work yet")).toBeTruthy();
  });

  it("shows what there is when only some of it could be measured", () => {
    const td = cell(bid({ partner_accepted_first_time: null, partner_qa_pass_rate: 90, partner_rating_count: 0 }));
    expect(screen.getByText("90% QA pass")).toBeTruthy();
    expect(td.textContent).toContain("—");
    expect(screen.queryByText(/★/)).toBeNull();
  });

  it("keeps a zero: 0% accepted first time is a record, not an absence", () => {
    cell(bid({ partner_accepted_first_time: 0, partner_qa_pass_rate: 100, partner_rating: 2, partner_rating_count: 1 }));
    expect(screen.getByText("0% accepted first time")).toBeTruthy();
    expect(screen.getByText("★ 2.0 (1)")).toBeTruthy();
  });
});
