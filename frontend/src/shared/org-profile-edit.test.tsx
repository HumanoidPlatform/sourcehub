// Editing a profile after onboarding: the owner's view and Ops' view.
//
// The server refuses an Ops-only field from an owner (update_org_profile); the
// dialog must show those locked and never send them, and must send only what
// changed — an omitted field is left alone, a cleared one is removed.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Org } from "@api/types";
import { ToastProvider } from "@ds/primitives";
import { EditProfileDialog } from "./org-profile-edit";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve({ url: "https://blob.example/logo.png", expires_in: 900 })),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> =>
    Promise.resolve({ storage_key: "_staging/o1/k/new.png", url: "https://blob.example/put", headers: {} })),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  put: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve({})),
  putFile: vi.fn((): Promise<void> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

const ORG: Org = {
  id: "o1", reference_code: "CL-0001", kind: "client", name: "Meridian", status: "active",
  parent_org_id: null, country: "India", residency_region: "APAC", billing_status: "current",
  rating: null, legal_name: "Meridian Private Limited",
  profile: { industry: "Retail", plan: "Enterprise", dpa_signed: false },
  public_profile: { website: "https://meridian.example" },
  logo_version: "2026-09-28T10:00:00+00:00",
};

function open(ops: boolean, onClose = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <EditProfileDialog org={ORG} ops={ops} onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return onClose;
}

const input = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

beforeEach(() => {
  for (const f of Object.values(api)) f.mockClear();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("an owner editing their own profile", () => {
  it("sees the account's terms locked", () => {
    open(false);
    for (const label of [/Organisation name/, /Legal name/, /Plan/]) {
      expect(input(label).disabled).toBe(true);
    }
    expect(input(/Website/).disabled).toBe(false);
    expect(screen.getAllByText(/Only DataMind360 can change this/).length).toBeGreaterThan(0);
  });

  it("sends only what changed", async () => {
    const onClose = open(false);
    fireEvent.change(input(/Website/), { target: { value: "https://meridian.example/about" } });
    fireEvent.change(input(/City/), { target: { value: "Pune" } });
    fireEvent.change(screen.getAllByLabelText(/^Country/)[1]!, { target: { value: "India" } });
    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(api.patch).toHaveBeenCalledWith("/organisations/o1", {
      website: "https://meridian.example/about",
      registered_address: { city: "Pune", country: "India" },
    });
    expect(api.put).not.toHaveBeenCalled();
    expect(api.del).not.toHaveBeenCalled();
  });

  it("cannot save with nothing changed", () => {
    open(false);
    expect((screen.getByRole("button", { name: "Save profile" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Ops editing an account", () => {
  it("may change the legal name", async () => {
    const onClose = open(true);
    expect(input(/Legal name/).disabled).toBe(false);
    fireEvent.change(input(/Legal name/), { target: { value: "Meridian Retail Limited" } });
    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith("/organisations/o1", { legal_name: "Meridian Retail Limited" });
  });
});

describe("the logo", () => {
  it("files a new upload through the logo endpoint", async () => {
    const onClose = open(false);
    const file = new File(["png"], "new.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Logo image"), { target: { files: [file] } });
    await waitFor(() => expect(api.putFile).toHaveBeenCalled());
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Save profile" }) as HTMLButtonElement).disabled).toBe(false),
    );
    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.put).toHaveBeenCalledWith("/organisations/o1/logo", { storage_key: "_staging/o1/k/new.png" });
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("removes the current one on request", async () => {
    const onClose = open(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove logo" }));
    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.del).toHaveBeenCalledWith("/organisations/o1/logo");
  });
});
