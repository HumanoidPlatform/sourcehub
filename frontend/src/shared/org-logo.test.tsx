// Showing a logo. Storage is private, so the image needs a signed URL from the
// API; an organisation with no logo must not cost a request, and must still
// look like something.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initials, LogoPicker, logoProblem, OrgLogo, useStagedLogo, type LogoUpload } from "./org-logo";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> =>
    Promise.resolve({ url: "https://blob.example/orgs/o1/logo/a.png?sig=1", expires_in: 900 })),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> =>
    Promise.resolve({ storage_key: "_staging/o1/k/logo.png", url: "https://blob.example/put", headers: {} })),
  putFile: vi.fn((): Promise<void> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

function show(version: string | null) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OrgLogo orgId="o1" version={version} name="Meridian Grocery" />
    </QueryClientProvider>,
  );
}

beforeEach(() => api.get.mockClear());

describe("OrgLogo", () => {
  it("shows initials and asks for nothing when there is no logo", () => {
    show(null);
    expect(screen.getByText("MG")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("loads the signed URL once and shows the image", async () => {
    show("2026-09-28T10:00:00+00:00");
    const img = await screen.findByRole("img", { name: "Meridian Grocery logo" });
    expect(img.getAttribute("src")).toBe("https://blob.example/orgs/o1/logo/a.png?sig=1");
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(api.get).toHaveBeenCalledWith("/organisations/o1/logo-url");
  });
});

describe("what counts as a logo", () => {
  const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

  it("takes PNG, JPEG and WebP", () => {
    for (const name of ["a.png", "a.jpg", "a.JPEG", "a.webp"]) expect(logoProblem(file(name))).toBeNull();
  });

  it("refuses SVG, GIF and anything without an extension", () => {
    for (const name of ["a.svg", "a.gif", "logo"]) expect(logoProblem(file(name))).toMatch(/PNG, JPEG or WebP/);
  });

  it("refuses anything over 2 MB", () => {
    expect(logoProblem(file("a.png", 2 * 1024 * 1024 + 1))).toMatch(/2 MB/);
  });

  it("initials take the first two words", () => {
    expect(initials("harbour field services")).toBe("HF");
    expect(initials("  ")).toBe("?");
  });
});

describe("LogoPicker", () => {
  // The picker is controlled; this holds its value the way a form does and
  // records every value it was given.
  const seen: (LogoUpload | null)[] = [];
  function Form() {
    const [v, setV] = useState<LogoUpload | null>(null);
    seen.push(v);
    return <LogoPicker value={v} onChange={setV} />;
  }
  const choose = (name = "logo.png") =>
    fireEvent.change(screen.getByLabelText("Logo image"), {
      target: { files: [new File(["png"], name, { type: "image/png" })] },
    });

  let n = 0;
  beforeEach(() => {
    seen.length = 0;
    n = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++n}`);
    URL.revokeObjectURL = vi.fn();
    api.putFile.mockReset().mockImplementation(() => Promise.resolve());
  });

  it("keeps the preview alive when the picker unmounts", async () => {
    // The onboarding form unmounts the picker on every step change and shows
    // the same preview on Review. Revoking on unmount left a broken image.
    const { unmount } = render(<Form />);
    choose();
    await waitFor(() => expect(seen.at(-1)?.status).toBe("done"));
    unmount();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("frees the old preview when another image replaces it", async () => {
    render(<Form />);
    choose("one.png");
    await waitFor(() => expect(seen.at(-1)?.status).toBe("done"));
    choose("two.png");
    await waitFor(() => expect(seen.at(-1)?.name).toBe("two.png"));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
  });

  it("does not bring a removed logo back when its upload lands", async () => {
    let land!: () => void;
    api.putFile.mockImplementation(() => new Promise<void>((r) => { land = r; }));
    render(<Form />);
    choose();
    await waitFor(() => expect(seen.at(-1)?.status).toBe("uploading"));
    await waitFor(() => expect(api.putFile).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(seen.at(-1)).toBeNull();
    land();
    await new Promise((r) => setTimeout(r, 20));
    expect(seen.at(-1)).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
  });
});

describe("useStagedLogo", () => {
  it("asks again when a request carries a different staged file, and shows none once removed", async () => {
    // A request sent back, given a new logo and resubmitted used to show the
    // reviewer the OLD logo from cache: the key was the request alone.
    let n = 0;
    api.get.mockImplementation(() => Promise.resolve({ url: `https://blob.example/${++n}.png`, expires_in: 900 }));
    function Probe({ k }: { k: string | null }) {
      const q = useStagedLogo("r1", k);
      return <span>{q.data?.url ?? "none"}</span>;
    }
    const qc = new QueryClient();
    const wrap = (k: string | null) => (
      <QueryClientProvider client={qc}><Probe k={k} /></QueryClientProvider>
    );
    const { rerender } = render(wrap("_staging/ops/a/old.png"));
    expect(await screen.findByText("https://blob.example/1.png")).toBeTruthy();
    rerender(wrap("_staging/ops/b/new.png"));
    expect(await screen.findByText("https://blob.example/2.png")).toBeTruthy();
    rerender(wrap(null));
    expect(await screen.findByText("none")).toBeTruthy();
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
