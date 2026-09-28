// Raising a client or partner onboarding request, on the real page.
//
// What matters is what reaches the server: approval creates the organisation
// from this payload, and the server refuses keys it does not know. So these
// walk the steps the way Ops does and assert on the body that is posted.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { OnboardingNewPage } from "./new";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  putFile: vi.fn((_url: string, _file: File, _headers?: Record<string, string>): Promise<void> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

function show(at = "/onboarding/new") {
  const router = createMemoryRouter(
    [
      { path: "/onboarding/new", element: <OnboardingNewPage /> },
      { path: "/onboarding/:id/edit", element: <OnboardingNewPage /> },
      { path: "/onboarding", element: <p>the queue</p> },
    ],
    { initialEntries: [at] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return router;
}

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const pick = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

function fillOrganisation() {
  type(/Organisation name/, "Meridian Grocery Group");
  type(/Legal name/, "Meridian Grocery Group Private Limited");
  type(/Website/, "meridian.example");
  pick(/^Country/, "India");
  type(/Industry/, "Retail");
}

beforeEach(() => {
  api.get.mockReset().mockImplementation(() => Promise.resolve(null));
  api.post.mockReset().mockImplementation((path: string) =>
    Promise.resolve(
      path === "/attachments/presign"
        ? { storage_key: "_staging/ops/abc/logo.png", url: "https://blob.example/put", headers: { "x-ms-blob-type": "BlockBlob" } }
        : { id: "n1" },
    ),
  );
  api.patch.mockReset().mockImplementation(() => Promise.resolve({}));
  api.putFile.mockReset().mockImplementation(() => Promise.resolve());
  // jsdom has no object URLs
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("raising a request", () => {
  it("will not continue without the core company details", async () => {
    show();
    await screen.findByRole("heading", { name: "Onboard a client or partner" });
    type(/Organisation name/, "Meridian");
    click("Continue");
    expect(await screen.findByText("3 fields need attention.")).toBeTruthy();
    expect(screen.getByText("The registered legal name is needed.")).toBeTruthy();
    expect(screen.getByText("Add the company website.")).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("walks every step and posts the profile in the server's shape", async () => {
    const router = show();
    await screen.findByRole("heading", { name: "Onboard a client or partner" });
    fillOrganisation();
    click("Continue");

    // the registered address starts in the company's country
    const addressCountry = (await screen.findByLabelText(/^Country/)) as HTMLSelectElement;
    expect(addressCountry.value).toBe("India");
    click("Continue");
    expect(await screen.findByText("The city is needed.")).toBeTruthy();
    type(/City/, "Pune");
    type(/Address line 1/, "1 MG Road");
    click("Continue");

    await screen.findByLabelText(/Full name/);
    type(/Plan/, "Enterprise");
    type(/Full name/, "Asha Rao");
    type(/Email/, "asha@meridian.example");
    click("Continue");

    // the review: the address as it will be shown, assembled from its parts
    expect(await screen.findByText("1 MG Road, Pune, India")).toBeTruthy();
    click("Raise request");

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/onboarding", expect.anything()));
    const body = api.post.mock.calls.find(([p]) => p === "/onboarding")![1] as Record<string, unknown>;
    expect(body).toEqual({
      target_org_kind: "client",
      proposed_name: "Meridian Grocery Group",
      submit: true,
      contact: { full_name: "Asha Rao", email: "asha@meridian.example" },
      payload: {
        legal_name: "Meridian Grocery Group Private Limited",
        website: "meridian.example",
        country: "India",
        industry: "Retail",
        plan: "Enterprise",
        registered_address: { line1: "1 MG Road", city: "Pune", country: "India" },
      },
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/onboarding"));
  });

  it("uploads the logo straight away and sends its staged key", async () => {
    show();
    await screen.findByRole("heading", { name: "Onboard a client or partner" });
    fillOrganisation();
    const file = new File(["png"], "meridian.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Logo image"), { target: { files: [file] } });

    await waitFor(() => expect(api.putFile).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith("/attachments/presign", {
      filename: "meridian.png", content_type: "image/png", size_bytes: 3,
    });
    expect(api.putFile.mock.calls[0]![0]).toBe("https://blob.example/put");
    expect(api.putFile.mock.calls[0]![2]).toEqual({ "x-ms-blob-type": "BlockBlob" });

    click("Continue");
    await screen.findByLabelText(/City/);
    type(/City/, "Pune");
    click("Continue");
    await screen.findByLabelText(/Full name/);
    type(/Full name/, "Asha Rao");
    type(/Email/, "asha@meridian.example");
    click("Continue");
    await screen.findByRole("button", { name: "Raise request" });
    click("Raise request");

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/onboarding", expect.anything()));
    const body = api.post.mock.calls.find(([p]) => p === "/onboarding")![1] as { payload: Record<string, unknown> };
    expect(body.payload.logo_staging_key).toBe("_staging/ops/abc/logo.png");
  });

  it("refuses an SVG before uploading anything", async () => {
    show();
    await screen.findByRole("heading", { name: "Onboard a client or partner" });
    const svg = new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" });
    fireEvent.change(screen.getByLabelText("Logo image"), { target: { files: [svg] } });
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Choose a PNG, JPEG or WebP image.");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("asks a partner for its headquarters and capabilities, not an industry", async () => {
    show();
    await screen.findByRole("heading", { name: "Onboard a client or partner" });
    pick(/Kind/, "tenant");
    expect(screen.queryByLabelText(/Industry/)).toBeNull();
    expect(screen.getByLabelText(/Headquarters/)).toBeTruthy();
    expect(screen.getByLabelText(/Capabilities/)).toBeTruthy();
  });
});

describe("a request sent back for changes", () => {
  const RETURNED = {
    id: "n1", reference_code: "ONB-7", target_org_kind: "tenant", proposed_name: "Harbour Field Services",
    status: "changes_requested", payload: {
      legal_name: "Harbour Field Services LLP", website: "https://harbour.example", country: "India",
      hq: "Chennai", registered_address: { city: "Chennai", country: "India" },
    },
    contact: { full_name: "Ravi K", email: "ravi@harbour.example" },
    approvals: [{ step: 1, decision: "changes_requested", reason: "Add the capabilities.", approver_role: "platform_admin", decided_at: "2026-09-28T10:00:00Z" }],
  };

  it("reopens with what was sent, says why, and resubmits it", async () => {
    api.get.mockImplementation((path: string) => Promise.resolve(path === "/onboarding/n1" ? RETURNED : null));
    show("/onboarding/n1/edit");
    expect(await screen.findByText("Add the capabilities.")).toBeTruthy();
    expect((screen.getByLabelText(/Legal name/) as HTMLInputElement).value).toBe("Harbour Field Services LLP");
    type(/Capabilities/, "Retail shelf imagery");
    click("Continue");
    click("Continue");
    await screen.findByLabelText(/Full name/);
    click("Continue");
    await screen.findByRole("button", { name: "Resubmit request" });
    click("Resubmit request");

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/onboarding/n1/submit"));
    const [path, body] = api.patch.mock.calls[0]!;
    expect(path).toBe("/onboarding/n1");
    expect((body as { payload: Record<string, unknown> }).payload).toMatchObject({
      capabilities: "Retail shelf imagery", hq: "Chennai",
    });
  });
});
