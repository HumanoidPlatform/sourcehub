// CON-1 / db/590: a client's delivery destinations, as the Delivery storage
// section of its Organisation profile.
//
// A destination could be added from the RFP builder and never changed. A
// rotated or revoked key read Not reachable with only Test again to offer, and
// the only way out was a duplicate. What is pinned here:
//
//   * the section says it is private, though the profile above it is what
//     others see; adding one opens a dialog that takes focus and hands it
//     back; and the list is read afresh whenever the section opens;
//   * each destination says where it is, whether it works and what uses it,
//     with links to the contracts and RFPs;
//   * a failed test is shown with its reason (the API now keeps it and
//     answers 200, where it used to roll it back with an error);
//   * Replace key sends only the new key, the Azure account staying put, and
//     a key that fails its test is reported in the dialog;
//   * Rename sends the new name and shows a clash where it was typed;
//   * Delete is offered only for a destination nothing uses, and a refusal the
//     list had not caught up with is shown in its dialog.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

import { DeliveryStorage } from "./section";

const STAMPS = { owner_org_id: "o-acme", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z" };

// Shape of a live GET /storage-targets row.
const USED = {
  ...STAMPS, id: "t1", label: "Field capture", provider: "s3", region: "ap-south-1", endpoint: null,
  bucket: "acme-field", key_prefix: "captures/",
  verified_at: "2026-10-01T09:00:00Z", verify_error: null,
  used_by: {
    contracts: [{ id: "c1", reference_code: "CTR-0003", title: "Storefront photos, Pune", status: "active" }],
    requests: [
      { id: "r2", reference_code: "RFP-1012", title: "Shelf audit, Nashik", status: "published" },
      { id: "r3", reference_code: "RFP-1013", title: "Kiosks, Nagpur", status: "draft" },
    ],
  },
  can_delete: false,
};
const UNUSED = {
  ...STAMPS, id: "t2", label: "Old archive", provider: "azure_blob", region: null, endpoint: null,
  bucket: "archive", key_prefix: "",
  verified_at: null, verify_error: "AuthenticationFailed: the key was revoked",
  used_by: { contracts: [], requests: [] },
  can_delete: true,
};

function show(
  rows: unknown[] = [USED, UNUSED],
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  api.get.mockImplementation((path: string) =>
    Promise.resolve(path === "/storage-targets" ? rows : null),
  );
  const router = createMemoryRouter(
    [{ path: "/organisation", element: <DeliveryStorage orgName="Acme Retail Analytics" /> }],
    { initialEntries: ["/organisation"] },
  );
  render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const row = async (label: string) => (await screen.findByText(label)).closest("tr")!;

async function menu(label: string, item: string) {
  fireEvent.click(await screen.findByRole("button", { name: `More actions for ${label}` }));
  fireEvent.click(await screen.findByRole("menuitem", { name: item }));
  return screen.findByRole("dialog");
}

const items = () => screen.getAllByRole("menuitem").map((e) => e.textContent);

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.patch.mockReset().mockResolvedValue({ ...USED, label: "Mumbai captures" });
  api.del.mockReset().mockResolvedValue(undefined);
});

describe("the Delivery storage section", () => {
  it("says where each destination is, whether it works and what uses it", async () => {
    show();
    const used = within(await row("Field capture"));
    expect(used.getByText("acme-field/captures/ · ap-south-1")).toBeTruthy();
    expect(used.getByText("Reachable")).toBeTruthy();
    expect(used.getByRole("link", { name: "CTR-0003" }).getAttribute("href")).toBe("/deliveries/c1");
    expect(used.getByRole("link", { name: "RFP-1012" }).getAttribute("href")).toBe("/requests/r2");
    expect(used.getByRole("link", { name: "RFP-1013" }).getAttribute("href")).toBe("/requests/r3");
    // a draft is a use, but not an open RFP
    expect(used.getByText("1 contract · 1 open RFP · 1 draft")).toBeTruthy();

    const unused = within(await row("Old archive"));
    expect(unused.getByText("Not reachable")).toBeTruthy();
    expect(unused.getByText("AuthenticationFailed: the key was revoked")).toBeTruthy();
    expect(unused.getByText("Nothing yet")).toBeTruthy();
  });

  it("says so when there are none", async () => {
    show([]);
    expect(await screen.findByText("No destinations yet")).toBeTruthy();
  });

  it("says it is private, on a profile page that is otherwise what others see", async () => {
    show();
    expect(await screen.findByText(/Only people in Acme Retail Analytics see this/)).toBeTruthy();
  });

  it("adds one in a dialog that takes focus and hands it back", async () => {
    show();
    const add = await screen.findByRole("button", { name: "Add a destination" });
    add.focus();
    fireEvent.click(add);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Test and save" })).toBeTruthy();
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(add);
  });

  it("keeps the dialog until the new destination's test is over", async () => {
    let finish: (v: unknown) => void = () => {};
    api.post.mockImplementationOnce(() => new Promise((r) => { finish = r; }));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Add a destination" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Test and save" }));
    const cancel = within(dialog).getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
    await waitFor(() => expect(cancel.disabled).toBe(true));
    finish({ ...UNUSED, id: "t9", label: "New one" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("reads the list afresh when it opens, whatever the cache holds", async () => {
    // the RFP builder filled the cache before an RFP using Old archive was saved
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } });
    qc.setQueryData(["storage-targets"], [UNUSED]);
    show([{ ...UNUSED, used_by: USED.used_by, can_delete: false }], qc);
    const archive = within(await row("Old archive"));
    expect(await archive.findByRole("link", { name: "CTR-0003" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "More actions for Old archive" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(items()).toEqual(["Replace key", "Rename"]);
  });

  it("shows a failed test with its reason, and the row stays red", async () => {
    const failed = { ...USED, verified_at: null, verify_error: "AccessDenied: key revoked" };
    api.post.mockResolvedValueOnce(failed);
    show();
    const tr = await row("Field capture");
    // from now on the server lists it as it kept it: failed
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/storage-targets" ? [failed, UNUSED] : null));
    fireEvent.click(within(tr).getByRole("button", { name: "Test again" }));
    expect(await screen.findByText("Still not reachable")).toBeTruthy();
    expect(await within(tr).findByText("Not reachable")).toBeTruthy();
    expect(within(tr).getByText("AccessDenied: key revoked")).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith("/storage-targets/t1/verify");
  });

  it("says when a test passes", async () => {
    api.post.mockResolvedValueOnce({ ...UNUSED, verified_at: "2026-10-21T10:00:00Z", verify_error: null });
    show();
    fireEvent.click(within(await row("Old archive")).getByRole("button", { name: "Test again" }));
    expect(await screen.findByText("Destination reachable")).toBeTruthy();
  });
});

describe("deleting", () => {
  it("is not offered for a destination something uses", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "More actions for Field capture" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(items()).toEqual(["Replace key", "Rename"]);
  });

  it("deletes one nothing uses", async () => {
    show();
    const dialog = await menu("Old archive", "Delete");
    expect(within(dialog).getByText("Delete Old archive?")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete destination" }));
    await waitFor(() => expect(api.del).toHaveBeenCalledWith("/storage-targets/t2"));
    expect(await screen.findByText("Destination deleted")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(api.get.mock.calls.filter(([p]) => p === "/storage-targets").length).toBeGreaterThan(1);
  });

  it("shows the server's refusal when an RFP named it since the list loaded", async () => {
    const refusal = "Old archive is the destination of RFP-1013, so it cannot be deleted.";
    api.del.mockRejectedValueOnce(new Error(refusal));
    show();
    const dialog = await menu("Old archive", "Delete");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete destination" }));
    expect(await within(dialog).findByText(refusal)).toBeTruthy();
    expect(within(dialog).getByText("It was not deleted")).toBeTruthy();
  });
});

describe("replacing a key", () => {
  it("asks for the whole key before testing it", async () => {
    show();
    const dialog = await menu("Field capture", "Replace key");
    const go = within(dialog).getByRole("button", { name: "Test and replace" }) as HTMLButtonElement;
    expect(go.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/Access key ID/), { target: { value: "AKIANEW" } });
    expect(go.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/Secret access key/), { target: { value: "n3w" } });
    expect(go.disabled).toBe(false);
  });

  it("sends only the new S3 key pair", async () => {
    show();
    const dialog = await menu("Field capture", "Replace key");
    fireEvent.change(within(dialog).getByLabelText(/Access key ID/), { target: { value: "AKIANEW" } });
    fireEvent.change(within(dialog).getByLabelText(/Secret access key/), { target: { value: "n3w" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Test and replace" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/storage-targets/t1", {
        secret: { access_key_id: "AKIANEW", secret_access_key: "n3w" },
      }),
    );
    expect(await screen.findByText("Key replaced")).toBeTruthy();
  });

  it("keeps the dialog open with the reason when the new key fails its test", async () => {
    api.patch.mockRejectedValueOnce(new Error("SignatureDoesNotMatch"));
    show();
    const dialog = await menu("Field capture", "Replace key");
    fireEvent.change(within(dialog).getByLabelText(/Access key ID/), { target: { value: "AKIANEW" } });
    fireEvent.change(within(dialog).getByLabelText(/Secret access key/), { target: { value: "wrong" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Test and replace" }));
    expect(await within(dialog).findByText("SignatureDoesNotMatch")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBe(dialog);
  });

  it("asks Azure for the key alone: the account is part of where the files are", async () => {
    show();
    const dialog = await menu("Old archive", "Replace key");
    expect(within(dialog).queryByLabelText(/Account name/)).toBeNull();
    fireEvent.change(within(dialog).getByLabelText(/Account key/), { target: { value: "k2" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Test and replace" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/storage-targets/t2", { secret: { account_key: "k2" } }),
    );
  });
});

describe("renaming", () => {
  it("sends the new name", async () => {
    show();
    const dialog = await menu("Field capture", "Rename");
    const save = within(dialog).getByRole("button", { name: "Rename" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true); // nothing to save yet
    fireEvent.change(within(dialog).getByLabelText(/Name/), { target: { value: "  Mumbai captures " } });
    fireEvent.click(save);
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/storage-targets/t1", { label: "Mumbai captures" }),
    );
  });

  it("shows a name already in use where it was typed", async () => {
    const clash = "You already have a destination called Old archive. Give this one another name.";
    api.patch.mockRejectedValueOnce(new Error(clash));
    show();
    const dialog = await menu("Field capture", "Rename");
    fireEvent.change(within(dialog).getByLabelText(/Name/), { target: { value: "Old archive" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Rename" }));
    expect(await within(dialog).findByText(clash)).toBeTruthy();
  });
});
