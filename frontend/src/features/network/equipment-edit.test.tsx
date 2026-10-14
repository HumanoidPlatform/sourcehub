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
  ensureFreshSession: vi.fn(() => Promise.resolve(null)),
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
  api.post.mockReset().mockResolvedValue({});
  api.putFile.mockReset().mockResolvedValue(undefined);
  api.ensureFreshSession.mockReset().mockResolvedValue(null);
  (globalThis.URL as typeof URL & { createObjectURL: () => string; revokeObjectURL: () => void }).createObjectURL = vi.fn(() => "blob:device-photo");
  (globalThis.URL as typeof URL & { createObjectURL: () => string; revokeObjectURL: (url: string) => void }).revokeObjectURL = vi.fn();
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

describe("the Add dialog", () => {
  it("saves make, model, location, spec fields, photos and documentation through the real API fields", async () => {
    const created = row({
      id: "e-new", reference_code: "DV-02", equipment_type: "Helmet camera",
      make: "GoPro", model: "HERO12 Black", location: "Bengaluru warehouse",
      specifications: {
        year: "2026",
        power: "Rechargeable battery",
        connectivity: "Wi-Fi",
        storage: "256 GB microSD",
      },
      photos: [], documentation: [],
    });
    api.post.mockImplementation((path: string, body?: unknown) => {
      if (path === "/network/equipment") return Promise.resolve(created);
      if (path === "/attachments/presign") {
        const filename = (body as { filename: string }).filename;
        return Promise.resolve({
          storage_key: `_staging/o-sponsor/${filename}`,
          url: `https://blob.example/${filename}`,
          headers: { "x-ms-blob-type": "BlockBlob" },
        });
      }
      if (path === "/network/equipment/e-new/attachments") return Promise.resolve([]);
      return Promise.resolve({});
    });

    show([row({ id: "e-existing", reference_code: "DV-01", equipment_type: "Tripod" })]);
    fireEvent.change(await screen.findByLabelText("Search inventory"), { target: { value: "nothing-here" } });
    expect(await screen.findByText("Nothing matches that")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Add equipment" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.change(within(dlg).getByLabelText(/^Equipment type/), { target: { value: "Helmet camera" } });
    fireEvent.change(within(dlg).getByLabelText(/^Make/), { target: { value: "GoPro" } });
    fireEvent.change(within(dlg).getByLabelText(/^Model/), { target: { value: "HERO12 Black" } });
    fireEvent.change(within(dlg).getByLabelText(/^Location/), { target: { value: "Bengaluru warehouse" } });
    fireEvent.change(within(dlg).getByLabelText(/^Units/), { target: { value: "4" } });
    fireEvent.change(within(dlg).getByLabelText(/^Calibrated on/), { target: { value: "2026-10-01" } });
    fireEvent.change(within(dlg).getByLabelText(/^Calibration expires/), { target: { value: "2027-10-01" } });
    fireEvent.change(within(dlg).getByLabelText(/^Year/), { target: { value: "2026" } });
    fireEvent.change(within(dlg).getByLabelText(/^Power/), { target: { value: "Rechargeable battery" } });
    fireEvent.change(within(dlg).getByLabelText(/^Connectivity/), { target: { value: "Wi-Fi" } });
    fireEvent.change(within(dlg).getByLabelText(/^Storage/), { target: { value: "256 GB microSD" } });
    const inputs = Array.from(dlg.querySelectorAll("input[type=file]")) as HTMLInputElement[];
    expect(inputs).toHaveLength(2);
    const photo = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const manual = new File(["manual"], "manual.pdf", { type: "application/pdf" });
    fireEvent.change(inputs[0]!, { target: { files: [photo] } });
    fireEvent.change(inputs[1]!, { target: { files: [manual] } });
    await waitFor(() => expect(api.putFile).toHaveBeenCalledWith("https://blob.example/manual.pdf", manual, { "x-ms-blob-type": "BlockBlob" }));

    fireEvent.click(within(dlg).getByRole("button", { name: "Add to inventory" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/network/equipment", {
      equipment_type: "Helmet camera",
      make: "GoPro",
      model: "HERO12 Black",
      location: "Bengaluru warehouse",
      specifications: {
        year: "2026",
        power: "Rechargeable battery",
        connectivity: "Wi-Fi",
        storage: "256 GB microSD",
      },
      total_units: 4,
      calibrated_on: "2026-10-01",
      calibration_expires_on: "2027-10-01",
    }));
    await waitFor(() => expect(api.putFile).toHaveBeenCalledWith("https://blob.example/photo.jpg", photo, { "x-ms-blob-type": "BlockBlob" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/network/equipment/e-new/attachments", {
      attachments: [
        { storage_key: "_staging/o-sponsor/manual.pdf", filename: "manual.pdf", content_type: "application/pdf", slot: "documentation" },
        { storage_key: "_staging/o-sponsor/photo.jpg", filename: "photo.jpg", content_type: "image/jpeg", slot: "photos" },
      ],
    }));
    const attachOrder = api.post.mock.invocationCallOrder.find((_, i) =>
      api.post.mock.calls[i]?.[0] === "/network/equipment/e-new/attachments",
    ) ?? Number.POSITIVE_INFINITY;
    expect(api.ensureFreshSession.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(api.ensureFreshSession.mock.invocationCallOrder.some((order) => order < attachOrder)).toBe(true);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByText("Helmet camera")).toBeTruthy();
  });

  it("closes as soon as the equipment row is saved while photo upload continues", async () => {
    const created = row({
      id: "e-lag", reference_code: "DV-05", equipment_type: "Thermal camera",
      make: null, model: null, location: null, specifications: {},
      photos: [], documentation: [],
    });
    let finishUpload!: () => void;
    api.putFile.mockImplementationOnce(() => new Promise<void>((resolve) => {
      finishUpload = resolve;
    }));
    api.post.mockImplementation((path: string, body?: unknown) => {
      if (path === "/network/equipment") return Promise.resolve(created);
      if (path === "/attachments/presign") {
        const filename = (body as { filename: string }).filename;
        return Promise.resolve({
          storage_key: `_staging/o-sponsor/${filename}`,
          url: `https://blob.example/${filename}`,
          headers: { "x-ms-blob-type": "BlockBlob" },
        });
      }
      if (path === "/network/equipment/e-lag/attachments") {
        return Promise.resolve([{ id: "a-photo", slot: "photos", filename: "thermal.jpg", content_type: "image/jpeg", size_bytes: 5 }]);
      }
      return Promise.resolve({});
    });

    show([]);
    fireEvent.click(await screen.findByRole("button", { name: "Add equipment" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.change(within(dlg).getByLabelText(/^Equipment type/), { target: { value: "Thermal camera" } });
    fireEvent.change(within(dlg).getByLabelText(/^Units/), { target: { value: "1" } });
    const photoInput = dlg.querySelector("input[type=file]") as HTMLInputElement;
    const photo = new File(["photo"], "thermal.jpg", { type: "image/jpeg" });
    fireEvent.change(photoInput, { target: { files: [photo] } });

    fireEvent.click(within(dlg).getByRole("button", { name: "Add to inventory" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/network/equipment", expect.objectContaining({
      equipment_type: "Thermal camera",
      total_units: 1,
    })));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByText("Thermal camera")).toBeTruthy();
    await waitFor(() => expect(api.putFile).toHaveBeenCalledWith("https://blob.example/thermal.jpg", photo, { "x-ms-blob-type": "BlockBlob" }));
    expect(api.post).not.toHaveBeenCalledWith("/network/equipment/e-lag/attachments", expect.anything());

    finishUpload();

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/network/equipment/e-lag/attachments", {
      attachments: [
        { storage_key: "_staging/o-sponsor/thermal.jpg", filename: "thermal.jpg", content_type: "image/jpeg", slot: "photos" },
      ],
    }));
  });

  it("closes once equipment is saved even if attaching photos fails", async () => {
    const created = row({
      id: "e-new2", reference_code: "DV-03", equipment_type: "Body camera",
      make: null, model: null, location: null, specifications: {},
      photos: [], documentation: [],
    });
    api.post.mockImplementation((path: string, body?: unknown) => {
      if (path === "/network/equipment") return Promise.resolve(created);
      if (path === "/attachments/presign") {
        const filename = (body as { filename: string }).filename;
        return Promise.resolve({
          storage_key: `_staging/o-sponsor/${filename}`,
          url: `https://blob.example/${filename}`,
          headers: { "x-ms-blob-type": "BlockBlob" },
        });
      }
      if (path === "/network/equipment/e-new2/attachments") {
        return Promise.reject(new Error("Session expired"));
      }
      return Promise.resolve({});
    });

    show([]);
    fireEvent.click(await screen.findByRole("button", { name: "Add equipment" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.change(within(dlg).getByLabelText(/^Equipment type/), { target: { value: "Body camera" } });
    fireEvent.change(within(dlg).getByLabelText(/^Units/), { target: { value: "2" } });
    fireEvent.change(within(dlg).getByLabelText(/^Calibrated on/), { target: { value: "2026-10-01" } });
    fireEvent.change(within(dlg).getByLabelText(/^Calibration expires/), { target: { value: "2027-10-01" } });
    const photoInput = dlg.querySelector("input[type=file]") as HTMLInputElement;
    const photo = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(photoInput, { target: { files: [photo] } });

    fireEvent.click(within(dlg).getByRole("button", { name: "Add to inventory" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByText("Body camera")).toBeTruthy();
    expect(await screen.findByText(/Saved without photos or documents/)).toBeTruthy();
  });

  it("still lets the sponsor add inventory when an optional document upload failed", async () => {
    const created = row({
      id: "e-new3", reference_code: "DV-04", equipment_type: "Sensor kit",
      make: null, model: null, location: null, specifications: {},
      photos: [], documentation: [],
    });
    api.post.mockImplementation((path: string) => {
      if (path === "/network/equipment") return Promise.resolve(created);
      if (path === "/attachments/presign") return Promise.reject(new Error("storage down"));
      return Promise.resolve({});
    });

    show([]);
    fireEvent.click(await screen.findByRole("button", { name: "Add equipment" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.change(within(dlg).getByLabelText(/^Equipment type/), { target: { value: "Sensor kit" } });
    fireEvent.change(within(dlg).getByLabelText(/^Units/), { target: { value: "3" } });

    const inputs = Array.from(dlg.querySelectorAll("input[type=file]")) as HTMLInputElement[];
    const manual = new File(["manual"], "manual.pdf", { type: "application/pdf" });
    fireEvent.change(inputs[1]!, { target: { files: [manual] } });
    await screen.findByText("storage down");

    const add = within(dlg).getByRole("button", { name: "Add to inventory" }) as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    fireEvent.click(add);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/network/equipment", expect.objectContaining({
      equipment_type: "Sensor kit",
      total_units: 3,
    })));
    expect(api.post).not.toHaveBeenCalledWith("/network/equipment/e-new3/attachments", expect.anything());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByText("Sensor kit")).toBeTruthy();
    expect(await screen.findByText(/1 document could not be uploaded and was skipped/)).toBeTruthy();
  });
});

describe("the Edit dialog", () => {
  it("opens prefilled from the row, with Save disabled until something changes", async () => {
    show([row({
      make: "GoPro",
      model: "HERO12 Black",
      location: "Bengaluru warehouse",
      specifications: {
        year: "2026",
        power: "Rechargeable battery",
        connectivity: "Wi-Fi",
        storage: "256 GB microSD",
      },
    })]);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    const dlg = await screen.findByRole("dialog");
    expect((within(dlg).getByLabelText(/^Equipment type/) as HTMLInputElement).value).toBe("Helmet camera, 4K");
    expect((within(dlg).getByLabelText(/^Make/) as HTMLInputElement).value).toBe("GoPro");
    expect((within(dlg).getByLabelText(/^Model/) as HTMLInputElement).value).toBe("HERO12 Black");
    expect((within(dlg).getByLabelText(/^Location/) as HTMLInputElement).value).toBe("Bengaluru warehouse");
    expect((within(dlg).getByLabelText(/^Units/) as HTMLInputElement).value).toBe("120");
    expect((within(dlg).getByLabelText(/^Calibrated on/) as HTMLInputElement).value).toBe("2026-07-14");
    expect((within(dlg).getByLabelText(/^Calibration expires/) as HTMLInputElement).value).toBe("2027-07-14");
    expect((within(dlg).getByLabelText(/^Year/) as HTMLInputElement).value).toBe("2026");
    expect((within(dlg).getByLabelText(/^Power/) as HTMLInputElement).value).toBe("Rechargeable battery");
    expect((within(dlg).getByLabelText(/^Connectivity/) as HTMLInputElement).value).toBe("Wi-Fi");
    expect((within(dlg).getByLabelText(/^Storage/) as HTMLInputElement).value).toBe("256 GB microSD");
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

  it("sends specification fields as a JSON object when they change", async () => {
    const dlg = await openEdit();
    fireEvent.change(within(dlg).getByLabelText(/^Power/), { target: { value: "USB-C battery pack" } });
    fireEvent.change(within(dlg).getByLabelText(/^Connectivity/), { target: { value: "LTE" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith("/network/equipment/e1", {
      specifications: { power: "USB-C battery pack", connectivity: "LTE" },
    });
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
