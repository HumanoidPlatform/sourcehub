// The attachment picker's gate. Eight screens share this component and each
// one sets its own allowance, so the two things worth pinning are that the
// allowance is the caller's and that a refusal says so out loud — a partner
// who is silently refused assumes the field takes one file and zips the rest,
// which is what bug 20 was really reporting.

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: { filename?: string }) =>
    Promise.resolve({ storage_key: "k", url: "http://x", headers: {} }),
  ),
  del: vi.fn(() => Promise.resolve(null)),
  putFile: vi.fn(() => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

import { AttachmentsField, MAX_ATTACHMENTS, type AttachmentDraft } from "./attachments";
import { ToastProvider } from "@ds/primitives";

const draft = (filename: string): AttachmentDraft => ({
  key: "k", filename, content_type: null, size_bytes: 1024, status: "done",
});

/** Renders the field and returns a `pick` that drives the real file input. */
function show(props: Partial<Parameters<typeof AttachmentsField>[0]> = {}) {
  const onChange = vi.fn();
  const items = props.items ?? [];
  render(
    <ToastProvider>
      <AttachmentsField label="RFP response documents" items={items} onChange={onChange} {...props} />
    </ToastProvider>,
  );
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const pick = (...names: string[]) =>
    fireEvent.change(input, {
      target: { files: names.map((n) => new File(["x"], n, { type: "application/octet-stream" })) },
    });
  return { onChange, input, pick };
}

beforeEach(() => vi.clearAllMocks());

describe("attachment picker", () => {
  it("accepts a PowerPoint deck", () => {
    // The one format bug 20 actually added: pdf, jpg, zip, docx and xlsx
    // were already accepted, ppt was not.
    const { onChange, pick } = show();
    pick("capability-deck.pptx");
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]![0]).toHaveLength(1);
  });

  it("refuses a file type that is not on the list, and names it", () => {
    const { onChange, pick } = show();
    pick("payload.exe");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/payload\.exe is not an accepted file type/)).toBeTruthy();
  });

  it("names every rejection, not just the first", () => {
    const { pick } = show();
    pick("a.exe", "b.dll");
    const msg = screen.getByText(/not an accepted file type/).textContent ?? "";
    expect(msg).toContain("a.exe");
    expect(msg).toContain("b.dll");
  });

  it("defaults to the shared allowance when the caller sets none", () => {
    const full = Array.from({ length: MAX_ATTACHMENTS }, (_, i) => draft(`f${i}.pdf`));
    const { onChange, pick } = show({ items: full });
    pick("one-more.pdf");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(new RegExp(`Already at ${MAX_ATTACHMENTS} files`))).toBeTruthy();
  });

  it("takes the caller's allowance instead: ten on an RFP response", () => {
    // The whole point of the max prop. With the shared default this field
    // would have stopped at five and said nothing until it did.
    const nine = Array.from({ length: 9 }, (_, i) => draft(`f${i}.pdf`));
    const { onChange, pick } = show({ items: nine, max: 10 });
    pick("tenth.pdf");
    expect(onChange).toHaveBeenCalled();
  });

  it("refuses the eleventh", () => {
    const ten = Array.from({ length: 10 }, (_, i) => draft(`f${i}.pdf`));
    const { onChange, pick } = show({ items: ten, max: 10 });
    pick("eleventh.pdf");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Already at 10 files/)).toBeTruthy();
  });

  it("says how many more fit when a batch is too big for the room left", () => {
    const eight = Array.from({ length: 8 }, (_, i) => draft(`f${i}.pdf`));
    const { onChange, pick } = show({ items: eight, max: 10 });
    pick("a.pdf", "b.pdf", "c.pdf");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Only 2 more files fit here/)).toBeTruthy();
  });
});

describe("two files at once", () => {
  // The real bug 20. Each upload ran on its own promise and rebuilt the list
  // from the array captured when the files were picked, so whichever landed
  // last reset its siblings to "uploading". Two files in, and the parent's
  // submit button never enabled again.
  function Stateful({ max }: { max?: number }) {
    const [items, setItems] = useState<AttachmentDraft[]>([]);
    return <AttachmentsField label="Docs" items={items} onChange={setItems} max={max} />;
  }

  it("marks BOTH files ready, not just the last one to land", async () => {
    let settle: Array<() => void> = [];
    api.putFile.mockImplementation(() => new Promise<void>((r) => settle.push(r)));
    api.post.mockImplementation((_p: string, body?: { filename?: string }) =>
      Promise.resolve({ storage_key: `key/${body?.filename}`, url: "http://x", headers: {} }),
    );

    render(<ToastProvider><Stateful max={10} /></ToastProvider>);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["a"], "deck.pptx"), new File(["b"], "method.pdf")],
      },
    });

    await waitFor(() => expect(settle).toHaveLength(2));
    // land them in the opposite order to the pick, which is the case that broke
    await act(async () => { settle[1]!(); settle[0]!(); });

    await waitFor(() => {
      expect(screen.queryByText("Uploading…")).toBeNull();
    });
    expect(screen.getAllByText("Ready")).toHaveLength(2);
  });
});
