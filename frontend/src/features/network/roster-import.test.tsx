// Importing a roster from a file, on the real Roster page.
//
// The browser parses the file and the server judges the rows, so what matters
// here is the contract between them: the rows the check is asked about, the
// verdicts shown back, that only the agreed rows are imported and in batches
// of fifty, and that the summary and the error report reflect the answers.

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

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Asha Rao", org_id: "o-crowd", org_name: "Bengaluru Crowd Collective",
    org_kind: "aggregator", role: "supplier", capabilities: [] as string[],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { RosterPage } from "./pages";

type Row = { row: number; display_name: string; email: string | null; phone: string | null; skills: string[]; trained: boolean };

/** A server that judges like the real one for the cases this file uses. */
function judge(rows: Row[]) {
  const seen = new Set<string>();
  return rows.map((r) => {
    const reasons: string[] = [];
    let status: "ready" | "warning" | "error" | "skipped" = "ready";
    if (r.display_name.length < 2) { status = "error"; reasons.push("Name is missing or too short."); }
    else if (r.email && !r.email.includes("@")) { status = "error"; reasons.push(`Not an email address: ${r.email}.`); }
    else if (r.email && seen.has(r.email)) { status = "error"; reasons.push("Duplicate (same email)."); }
    else if (r.email === "already@example.com") { status = "skipped"; reasons.push("Already on your roster."); }
    else if (!r.email) { status = "warning"; reasons.push("No email: added to the roster only, and cannot be offered work until invited."); }
    if (r.email) seen.add(r.email);
    return { row: r.row, status, reasons, normalized: r };
  });
}

function show() {
  const router = createMemoryRouter([{ path: "/roster", element: <RosterPage /> }], { initialEntries: ["/roster"] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function openImport() {
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Import crowd" }));
  return await screen.findByRole("dialog", { name: "Import crowd resources" });
}

const pickCsv = (text: string, name = "crowd.csv") =>
  fireEvent.change(screen.getByLabelText("Roster file"), {
    target: { files: [new File([text], name, { type: "text/csv" })] },
  });

const SMALL = [
  "Name,Email,Phone,Skills,Trained",
  "Asha Rao,asha@example.com,+91 98765 43210,Shelf capture; Retail audit,yes",
  "Dev Nair,,99,,no",
  ",bad-row@example.com,,,",
  "Eve,not-an-email,,,",
  "Farah,already@example.com,,,",
].join("\r\n");

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockReset().mockImplementation((path: string) => Promise.resolve(path === "/network/workers" ? [] : []));
  api.post.mockReset().mockImplementation((path: string, body?: unknown) => {
    const rows = (body as { rows: Row[] }).rows;
    if (path === "/network/workers/import/check") {
      const judged = judge(rows);
      const counts = { ready: 0, warning: 0, error: 0, skipped: 0 };
      for (const v of judged) counts[v.status] += 1;
      return Promise.resolve({ rows: judged, counts });
    }
    if (path === "/network/workers/import") {
      return Promise.resolve({
        added: rows.filter((r) => !r.email).length,
        invited: rows.filter((r) => !!r.email).length,
        skipped: 0,
        invitation_failures: 0,
        rows: rows.map((r) => ({ row: r.row, outcome: r.email ? "invited" : "added", worker_id: `w${r.row}` })),
      });
    }
    return Promise.resolve({});
  });
  URL.createObjectURL = vi.fn(() => "blob:report");
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
});

describe("the preview", () => {
  it("asks the server about the parsed rows and shows each verdict", async () => {
    const dlg = await openImport();
    pickCsv(SMALL);
    await within(dlg).findByText("Asha Rao");
    const sent = (api.post.mock.calls[0]![1] as { rows: Row[] }).rows;
    expect(api.post.mock.calls[0]![0]).toBe("/network/workers/import/check");
    expect(sent[0]).toEqual({
      row: 2, display_name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210",
      skills: ["shelf_capture", "retail_audit"], trained: true,
    });
    expect(sent).toHaveLength(5);
    expect(within(dlg).getAllByText("Ready")).toHaveLength(1);
    expect(within(dlg).getAllByText("Warning")).toHaveLength(1);
    expect(within(dlg).getAllByText("Error")).toHaveLength(2);
    expect(within(dlg).getAllByText("Already on roster")).toHaveLength(1);
    expect(within(dlg).getByText(/Not an email address: not-an-email/)).toBeTruthy();
    expect(within(dlg).getByRole("button", { name: "Import 2 crowd resources" })).toBeTruthy();
    // nothing written yet
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("refuses a file with no name column before asking the server", async () => {
    const dlg = await openImport();
    pickCsv("id,notes\r\n1,x\r\n");
    expect(await within(dlg).findByText(/No 'name' column/)).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe("the import", () => {
  it("sends only the agreed rows, in batches of fifty, and refreshes the roster", async () => {
    const lines = ["name,email"];
    for (let i = 1; i <= 120; i++) lines.push(`Person ${i},p${i}@example.com`);
    lines.push("Zed,already@example.com");
    const dlg = await openImport();
    pickCsv(lines.join("\n"));
    fireEvent.click(await within(dlg).findByRole("button", { name: "Import 120 crowd resources" }));
    await within(dlg).findByRole("button", { name: "Done" });
    const imports = api.post.mock.calls.filter(([p]) => p === "/network/workers/import");
    expect(imports.map(([, b]) => (b as { rows: Row[] }).rows.length)).toEqual([50, 50, 20]);
    const sentRows = imports.flatMap(([, b]) => (b as { rows: Row[] }).rows);
    expect(sentRows.some((r) => r.email === "already@example.com")).toBe(false);
    expect(within(dlg).getByText("120 of 120 rows processed.")).toBeTruthy();
    expect(within(dlg).getByText("Invited").nextElementSibling?.textContent).toBe("120");
    // the roster list is read again once the import is done
    await waitFor(() => expect(api.get.mock.calls.filter(([p]) => p === "/network/workers").length).toBeGreaterThan(1));
  });

  it("offers an error report naming what was not imported", async () => {
    const dlg = await openImport();
    pickCsv(SMALL);
    fireEvent.click(await within(dlg).findByRole("button", { name: "Import 2 crowd resources" }));
    const report = await within(dlg).findByRole("button", { name: "Download error report" });
    expect(within(dlg).getByText("Not imported").nextElementSibling?.textContent).toBe("3");
    fireEvent.click(report);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (URL.createObjectURL as unknown as { mock: { calls: [Blob][] } }).mock.calls[0]![0];
    expect(blob.type).toBe("text/csv");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("says how far it got when a batch fails", async () => {
    api.post.mockImplementation((path: string, body?: unknown) => {
      const rows = (body as { rows: Row[] }).rows;
      if (path === "/network/workers/import/check") return Promise.resolve({ rows: judge(rows), counts: { ready: rows.length, warning: 0, error: 0, skipped: 0 } });
      return Promise.reject(new Error("Mail server refused the login"));
    });
    const dlg = await openImport();
    pickCsv("name,email\nA B,a@example.com\nC D,c@example.com\n");
    fireEvent.click(await within(dlg).findByRole("button", { name: "Import 2 crowd resources" }));
    expect(await within(dlg).findByText(/Mail server refused the login/)).toBeTruthy();
    expect(within(dlg).getByText(/0 of 2 rows were processed/)).toBeTruthy();
  });
});
