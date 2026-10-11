// A client can deliver to their own Google Cloud Storage bucket.
//
// The destination form had two providers and a two-way secretFor: anything not
// Azure was sent as an S3 key pair. Google Cloud Storage takes neither — it
// takes the service account's .json key — so the form must ask for that file,
// show whose key it is, and send exactly {service_account_json} and nothing an
// S3 or Azure destination would carry.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Nair", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: [] as string[],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { RequestNewPage } from "./pages";

const DRAFT = {
  id: "r1", reference_code: "RFP-1011", title: "Storefront photos, Pune",
  category: "image", status: "draft", stored_status: "draft",
  client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  proposal_count: 0, compliance_notes: null,
  objective: "Shelf-level imagery.", use_case: "audit_compliance",
  spec: { target_quantity: 4000, target_unit: "photos", capture: {}, countries: ["IN"], location_type: "public_outdoor" },
  acceptance: null,
  quality: { thresholds: {}, rejection_policy: {} },
  compliance: {
    people_in_frame: "none", minors_policy: "prohibited", deidentification: [],
    regulations: [], lawful_basis: "legitimate_interest", permitted_uses: ["audit"],
    partner_reuse_allowed: false, biometric_processing: false,
  },
  people_requirements: null,
  budget_disclosed: true, currency: "USD",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "1500.00",
    estimated_total: "1500.00", currency: "USD", text: "USD 1,500.00" },
  pilot: { required: false, quantity: null, due_on: null },
  proposals_close_at: null, bidding_open: true, starts_on: "2030-09-30", delivery_due_on: "2030-11-15",
  storage_target_id: null, created_at: "2026-09-01T00:00:00+00:00", attachments: [], proposals: [],
};

const KEY = JSON.stringify({
  type: "service_account", project_id: "acme-capture",
  client_email: "uploader@acme-capture.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIItest\n-----END PRIVATE KEY-----\n",
});

function showBudgetStep() {
  const router = createMemoryRouter(
    [{ path: "/requests/:id/edit", element: <RequestNewPage /> }],
    { initialEntries: ["/requests/r1/edit"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) => Promise.resolve(path === "/requests/r1" ? DRAFT : []));
  api.post.mockReset().mockImplementation((_path: string, body?: unknown) =>
    Promise.resolve({
      id: "t1", owner_org_id: "o-acme", label: "Field captures", provider: "gcs", region: null,
      endpoint: null, bucket: (body as { bucket: string }).bucket, key_prefix: "",
      verified_at: "2030-01-01T00:00:00Z", verify_error: null,
    }),
  );
});

async function openNewDestination() {
  showBudgetStep();
  await screen.findByRole("heading", { name: /Edit RFP-1011/ });
  click("Continue");
  click("Continue");
  fireEvent.click(await screen.findByRole("button", { name: /Add a destination/ }));
  await screen.findByText("Add a destination", { selector: "h2, h3, .panel-title, *" });
}

describe("a Google Cloud Storage destination", () => {
  it("is offered, and the S3 option no longer claims GCS", async () => {
    await openNewDestination();
    const provider = screen.getByLabelText(/Provider/) as HTMLSelectElement;
    const options = Array.from(provider.options).map((o) => o.textContent);
    expect(options).toContain("Google Cloud Storage");
    expect(options.join(" ")).not.toMatch(/GCS interop/);
  });

  it("asks for the key file, shows whose it is, and sends only that", async () => {
    await openNewDestination();
    fireEvent.change(screen.getByLabelText(/Provider/), { target: { value: "gcs" } });
    // No S3 or Azure credential fields for GCS
    expect(screen.queryByLabelText(/Access key ID/)).toBeNull();
    expect(screen.queryByLabelText(/Account key/)).toBeNull();

    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Field captures" } });
    fireEvent.change(screen.getByLabelText(/^Bucket/), { target: { value: "acme-field-capture" } });
    const file = new File([KEY], "acme-capture-key.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText(/Service account key/), { target: { files: [file] } });
    expect(await screen.findByText("Key for uploader@acme-capture.iam.gserviceaccount.com")).toBeTruthy();
    expect(document.body.textContent).not.toContain("MIItest");

    click("Test and save");
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [path, body] = api.post.mock.calls[0]! as [string, Record<string, unknown>];
    expect(path).toBe("/storage-targets");
    expect(body).toMatchObject({ provider: "gcs", bucket: "acme-field-capture", label: "Field captures" });
    expect(body.secret).toEqual({ service_account_json: KEY });
  });

  it("does not carry an S3 endpoint or region typed before switching to it", async () => {
    await openNewDestination();
    fireEvent.change(screen.getByLabelText(/Provider/), { target: { value: "s3" } });
    fireEvent.change(screen.getByLabelText(/^Endpoint/), { target: { value: "https://minio.example:9000" } });
    fireEvent.change(screen.getByLabelText(/^Region/), { target: { value: "us-east-1" } });
    fireEvent.change(screen.getByLabelText(/Provider/), { target: { value: "gcs" } });

    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Field captures" } });
    fireEvent.change(screen.getByLabelText(/^Bucket/), { target: { value: "acme-field-capture" } });
    const file = new File([KEY], "acme-capture-key.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText(/Service account key/), { target: { files: [file] } });
    await screen.findByText(/^Key for /);

    click("Test and save");
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const body = api.post.mock.calls[0]![1] as Record<string, unknown>;
    expect(body).toMatchObject({ provider: "gcs", endpoint: null, region: null });
  });
});
