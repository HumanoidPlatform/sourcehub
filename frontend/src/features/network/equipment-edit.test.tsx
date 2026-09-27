// A device sponsor can edit a device's details from Inventory.
//
// Until now Inventory offered Add and a status control, and the Details dialog
// was read-only: type, unit count and calibration dates were frozen at creation.
// Four things are worth pinning: the Edit action exists for a sponsor and for
// nobody else; the dialog opens prefilled; Save sends ONLY what changed (so an
// untouched date is left alone rather than rewritten); and a refusal from the
// server — "10 units are out on loan" — is shown inside the dialog, not toasted
// and lost.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  putFile: vi.fn(() => Promise.resolve()),
  xhrPut: vi.fn(() => Promise.resolve({ ok: true })),
  api: vi.fn(() => Promise.resolve(null)),
  ApiError: class extends Error {},
  loadSession: vi.fn(() => null),
  saveSession: vi.fn(),
  bindSessionListener: vi.fn(),
  SESSION_KEY: "sourcehub.session",
}));
vi.mock("@api/client", () => api);

// Swappable per test: the page branches on org_kind, and the Edit action must
// exist for a sponsor and for nobody else.
const session = vi.hoisted(() => ({
  current: {
    full_name: "Ops", org_id: "o-sponsor", org_name: "OptiGear Devices",
    org_kind: "sponsor", role: "sponsor", capabilities: ["equipment.manage"] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { EquipmentPage } from "./pages";

const row = (over: Record<string, unknown> = {}) => ({
  id: "e1", reference_code: "DV-01", equipment_type: "Helmet camera, 4K",
  total_units: 120,
  calibrated_on: "2026-07-14", calibration_expires_on: "2027-07-14",
  sponsor_org_id: "o-sponsor", sponsor_name: "OptiGear Devices",
  units_on_loan: 10, units_available: 110,
  ...over,
});

function show(rows: unknown[] = [row()]) {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/network/equipment" ? rows : []),
  );
  const router = createMemoryRouter([{ path: "/inventory", element: <EquipmentPage /> }], {
    initialEntries: ["/inventory"],
  });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const asSponsor = () => {
  session.current = { ...session.current, org_kind: "sponsor", role: "sponsor" };
};
const asAggregator = () => {
  session.current = {
    ...session.current, org_id: "o-crowd", org_name: "Bengaluru Crowd Collective",
    org_kind: "aggregator", role: "aggregator", capabilities: ["equipment.request"],
  };
};

const openEdit = async () => {
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  return await screen.findByRole("dialog");
};

beforeEach(() => {
  api.patch.mockReset().mockResolvedValue({});
  asSponsor();
});

describe("who can edit", () => {
  it("offers Edit to the sponsor who owns the row", async () => {
    show();
    expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  });

  it("offers no Edit to a borrower browsing the same table", async () => {
    asAggregator();
    show();
    await screen.findByText("Helmet camera, 4K");
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    // the borrower's own action is still there
    expect(screen.getByRole("button", { name: "Request" })).toBeTruthy();
  });
});

describe("the Edit dialog", () => {
  it("opens prefilled from the row, with Save disabled until something changes", async () => {
    const dlg = await openEdit();
    expect((within(dlg).getByLabelText(/^Equipment type/) as HTMLInputElement).value).toBe("Helmet camera, 4K");
    expect((within(dlg).getByLabelText(/^Units/) as HTMLInputElement).value).toBe("120");
    expect((within(dlg).getByLabelText(/^Calibrated on/) as HTMLInputElement).value).toBe("2026-07-14");
    expect((within(dlg).getByLabelText(/^Calibration expires/) as HTMLInputElement).value).toBe("2027-07-14");
    // no jest-dom matchers in this repo: read the property
    expect((within(dlg).getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends only the fields that changed", async () => {
    const dlg = await openEdit();
    fireEvent.change(within(dlg).getByLabelText(/^Units/), { target: { value: "60" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    // Not the type, not the dates: an untouched field is left alone.
    expect(api.patch).toHaveBeenCalledWith("/network/equipment/e1", { total_units: 60 });
  });

  it("sends a cleared date as null, so it can actually be removed", async () => {
    const dlg = await openEdit();
    fireEvent.change(within(dlg).getByLabelText(/^Calibration expires/), { target: { value: "" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith("/network/equipment/e1", { calibration_expires_on: null });
  });

  it("shows the server's refusal inside the dialog and stays open", async () => {
    api.patch.mockRejectedValueOnce(
      new api.ApiError("10 units are out on loan — the total cannot go below that until they are returned."),
    );
    const dlg = await openEdit();
    fireEvent.change(within(dlg).getByLabelText(/^Units/), { target: { value: "5" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Save changes" }));
    expect(await within(dlg).findByText(/10 units are out on loan/)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("tells the sponsor how many units are out before they type", async () => {
    const dlg = await openEdit();
    expect(within(dlg).getByText(/10 out on loan/)).toBeTruthy();
  });
});
