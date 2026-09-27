// The request builder asks for the medium ONCE.
//
// Category / Content Type offers Image and Video; a Media control offered
// Photo and Video a few fields below, and nothing made the two agree — a
// request could say category "video" and media ["photo"], and it is media the
// phone enforces. The form was built to suppress the second question, but the
// suppression was keyed on the target unit, which stopped naming a medium when
// the unit became a consequence of the category (9417b35). So it never fired:
// the medium was asked twice and the capture block showed the photo-only
// megapixel floor next to the video-only clip bounds on every request.
//
// Drives the real page the way request-builder-guard.test.tsx does, because
// what is being tested is which controls render for which category.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { RequestNewPage } from "./pages";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Nair", org_name: "Acme Retail Analytics", org_kind: "client",
    role: "client", capabilities: [],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

/** The old Media checkboxes, by their own hint — gone for every category. */
const MEDIA_CHECKBOXES = /What the capture app will let them upload/;

function builder() {
  const router = createMemoryRouter(
    [
      { path: "/requests/new", element: <RequestNewPage /> },
      { path: "/requests/:id", element: <p>saved request</p> },
    ],
    { initialEntries: ["/requests/new"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function pickCategory(value: string) {
  builder();
  const select = await screen.findByLabelText(/Category/);
  fireEvent.change(select, { target: { value } });
  return select;
}

const addCaptureDetail = () =>
  fireEvent.click(screen.getByRole("checkbox", { name: /Add capture detail/ }));

beforeEach(() => {
  api.get.mockReset().mockImplementation(() => Promise.resolve([]));
  api.post.mockReset().mockImplementation(() => Promise.resolve({ id: "r9", reference_code: "REQ-9" }));
  api.patch.mockReset();
});

describe("the medium is asked once", () => {
  it("states the media on a Video request instead of asking again", async () => {
    await pickCategory("video");
    expect(screen.getByText(/may upload/).textContent).toMatch(/video only/);
    expect(screen.queryByText(MEDIA_CHECKBOXES)).toBeNull();
  });

  it("states it on an Image request too", async () => {
    await pickCategory("image");
    expect(screen.getByText(/may upload/).textContent).toMatch(/photo only/);
    expect(screen.queryByText(MEDIA_CHECKBOXES)).toBeNull();
  });

  it("saves the medium the category named, without the client ticking anything", async () => {
    await pickCategory("video");
    fireEvent.change(screen.getByLabelText(/RFP title/), { target: { value: "Aisle clips, Pune" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/requests",
        expect.objectContaining({
          category: "video",
          capture_spec: expect.objectContaining({ media: ["video"] }),
        }),
      ),
    );
  });
});

describe("capture detail follows the category", () => {
  it("offers the clip bounds and not the megapixel floor on a Video request", async () => {
    await pickCategory("video");
    addCaptureDetail();
    expect(screen.getByLabelText(/Shortest clip/)).toBeTruthy();
    expect(screen.getByLabelText(/Longest clip/)).toBeTruthy();
    expect(screen.queryByLabelText(/Minimum megapixels/)).toBeNull();
  });

  it("offers the megapixel floor and not the clip bounds on an Image request", async () => {
    await pickCategory("image");
    addCaptureDetail();
    expect(screen.getByLabelText(/Minimum megapixels/)).toBeTruthy();
    expect(screen.queryByLabelText(/Shortest clip/)).toBeNull();
    expect(screen.queryByLabelText(/Video size/)).toBeNull();
  });

  it("asks neither on a category where nothing is filmed", async () => {
    await pickCategory("structured_data");
    expect(screen.queryByText(/may upload/)).toBeNull();
    expect(screen.queryByText(MEDIA_CHECKBOXES)).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Add capture detail/ })).toBeNull();
  });
});
