// Attaching a file to a field, wherever one helps.
//
// One component for four surfaces — a request's compliance notes and
// acceptance criteria, a bid's methodology, a task's instructions, a QA
// verdict's evidence — because the interaction is identical every time and
// four copies would drift into four behaviours.
//
// The upload starts the moment a file is picked, before the thing it belongs
// to exists: a method statement is chosen while the proposal is still a form.
// The presign hands back a key; the save that follows attaches the keys it was
// given. Abandon the form and the object is an orphan in the documents bucket,
// which is the same bargain request samples have always made.

import { useState, type Dispatch, type SetStateAction } from "react";
import { del, get, post, putFile } from "@api/client";
import type { Attachment } from "@api/types";
import { Field, FileField, useToast } from "@ds/primitives";
import { fmtDate } from "@shared/format";

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

// Mirrors the server's list so most rejections never leave the browser. The
// server re-checks every one of them.
const ACCEPT =
  ".csv,.tsv,.json,.jsonl,.xml,.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.mp3,.wav,.zip,.xlsx,.docx,.pptx,.ppt,.parquet";

export interface AttachmentDraft {
  /** Set once the row exists server-side; absent while it is only an upload. */
  id?: string;
  /** The presigned object key. Empty for a file already attached. */
  key: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  status: "uploading" | "done" | "error";
  /** Already attached to the saved record. */
  existing?: boolean;
}

/** Rows to send with the parent's save. Files already attached are never
 *  re-sent — the server would reject the duplicate key anyway. */
export function attachmentPayload(items: AttachmentDraft[], slot: string) {
  return items
    .filter((a) => a.status === "done" && !a.existing)
    .map((a) => ({
      storage_key: a.key,
      filename: a.filename,
      content_type: a.content_type,
      slot,
    }));
}

export function fromServer(rows: Attachment[] | undefined): AttachmentDraft[] {
  return (rows ?? []).map((a) => ({
    id: a.id,
    key: "",
    filename: a.filename,
    content_type: a.content_type,
    size_bytes: a.size_bytes,
    status: "done" as const,
    existing: true,
  }));
}

export function AttachmentsField({
  label,
  hint,
  span,
  items,
  onChange,
  max = MAX_ATTACHMENTS,
}: {
  label: string;
  hint?: string;
  span?: boolean;
  items: AttachmentDraft[];
  /** Takes React's updater form. It must: each file uploads on its own
   *  promise, and a callback that rebuilt the list from the array captured at
   *  pick time reset every sibling's status back to "uploading" as it landed.
   *  Attaching two files left the form permanently un-submittable. */
  onChange: Dispatch<SetStateAction<AttachmentDraft[]>>;
  /** How many files THIS field takes. Eight screens share this component, so
   *  the allowance belongs to the caller: a request's document slot wants a
   *  handful, an RFP response wants a whole tender reply. The server's
   *  MAX_PER_SLOT is the ceiling above whatever is passed here. */
  max?: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const pick = (files: FileList) => {
    setError(null);
    const room = max - items.length;
    const picked = Array.from(files);
    if (picked.length > room) {
      setError(
        room === 0
          ? `Already at ${max} files. Remove one to add another.`
          : `Only ${room} more file${room === 1 ? "" : "s"} fit here.`,
      );
      return;
    }

    const accepted: AttachmentDraft[] = [];
    const rejected: string[] = [];
    for (const file of picked) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        rejected.push(`${file.name} is over the 25 MB cap`);
        continue;
      }
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!file.name.includes(".") || !ACCEPT.split(",").includes(ext)) {
        rejected.push(`${file.name} is not an accepted file type`);
        continue;
      }
      accepted.push({
        key: "", filename: file.name, content_type: file.type || null,
        size_bytes: file.size, status: "uploading",
      });
    }
    // Every rejection, not just the last one — picking three bad files and
    // being told about one of them is a worse form than being told about all.
    if (rejected.length) setError(rejected.join(". ") + ".");
    if (!accepted.length) return;

    const next = [...items, ...accepted];
    onChange(next);

    for (const draft of accepted) {
      void (async () => {
        try {
          const pre = await post<{
            storage_key: string; url: string; headers: Record<string, string>;
          }>("/attachments/presign", {
            filename: draft.filename,
            content_type: draft.content_type,
            size_bytes: draft.size_bytes,
          });
          const file = picked.find((f) => f.name === draft.filename)!;
          await putFile(pre.url, file, pre.headers);
          onChange((prev) =>
            prev.map((a) =>
              a === draft ? { ...a, key: pre.storage_key, status: "done" as const } : a,
            ),
          );
        } catch (e) {
          onChange((prev) => prev.map((a) => (a === draft ? { ...a, status: "error" as const } : a)));
          setError(e instanceof Error ? e.message : `Could not upload ${draft.filename}`);
        }
      })();
    }
  };

  const remove = (i: number) => {
    const row = items[i];
    if (!row) return;
    // An attached file has a row on the record, so removing it is a request,
    // not a filter. Anything else would be the remove button that pretended.
    if (row.existing && row.id) {
      const id = row.id;
      void (async () => {
        try {
          await del(`/attachments/${id}`);
          onChange((prev) => prev.filter((a) => a !== row));
        } catch (e) {
          toast("Could not remove it", e instanceof Error ? e.message : "", "critical");
        }
      })();
      return;
    }
    onChange((prev) => prev.filter((a) => a !== row));
  };

  return (
    <Field label={label} span={span} hint={hint} error={error ?? undefined}>
      {() => (
        <FileField
          label="Attach a file"
          accept={ACCEPT}
          disabled={items.length >= max}
          files={items.map((a) => ({
            name: a.filename, size: a.size_bytes, status: a.status,
          }))}
          onPick={pick}
          onRemove={remove}
        />
      )}
    </Field>
  );
}

/** Read-only list with download links. Attaching is a form; reading is not,
 *  so the two do not share a component. */
export function AttachmentList({ items, empty }: { items: Attachment[]; empty?: string }) {
  const toast = useToast();
  // which documents have their earlier versions unfolded
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (!items.length) return empty ? <span className="muted">{empty}</span> : null;

  const download = (a: Attachment) => {
    void (async () => {
      try {
        // Signed on demand and short-lived, so a link cannot be forwarded to
        // someone the policy would refuse.
        const u = await get<{ url: string }>(`/attachments/${a.id}/url`);
        window.open(u.url, "_blank", "noopener");
      } catch (e) {
        toast("Download failed", e instanceof Error ? e.message : "", "critical");
      }
    })();
  };

  return (
    <div className="filelist">
      {documentsOf(items).map(({ key, current, earlier }) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="filelist-row">
            <span className="filelist-name">{current.filename}</span>
            <span className="filelist-size">{fmtSize(current.size_bytes)}</span>
            {earlier.length > 0 && (
              // Every version is kept: what a partner priced against has to
              // stay provable after award, so a revision never replaces.
              <button
                type="button"
                className="btn"
                data-size="sm"
                aria-expanded={!!open[key]}
                onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              >
                v{current.version} · {earlier.length} earlier
              </button>
            )}
            <button type="button" className="btn" data-size="sm" onClick={() => download(current)}>
              Open
            </button>
          </div>
          {open[key] && earlier.map((a) => (
            <div key={a.id} className="filelist-row" style={{ marginLeft: 16, opacity: 0.85 }}>
              <span className="filelist-name">v{a.version} · {fmtDate(a.uploaded_at)}</span>
              <span className="filelist-size">{fmtSize(a.size_bytes)}</span>
              <button type="button" className="btn" data-size="sm" onClick={() => download(a)}>
                Open
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Rows grouped into documents: the newest version of each, and the earlier
 *  ones beneath it, newest first. A row with no doc_no — an API that predates
 *  versions — is simply its own document. */
export function documentsOf(
  items: Attachment[],
): { key: string; current: Attachment; earlier: Attachment[] }[] {
  const groups = new Map<string, Attachment[]>();
  for (const a of items) {
    const key = a.doc_no != null ? `${a.entity_id}:${a.slot}:${a.doc_no}` : a.id;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.entries()].flatMap(([key, rows]) => {
    const [current, ...earlier] = [...rows].sort((x, y) => (y.version ?? 0) - (x.version ?? 0));
    return current ? [{ key, current, earlier }] : [];
  });
}

/** A request's document slots, the ones a person capturing reaches for first
 *  at the top (the server sends them in the same order). Which of these a viewer actually receives is the server's decision (db/150:
 *  the brief stays with client and partner, compliance stops at the
 *  aggregator) — a slot that comes back empty simply renders no row. */
export const REQUEST_SLOTS: readonly (readonly [label: string, slot: string])[] = [
  ["Brief", "brief"],
  ["Guidelines", "guidelines"],
  ["Capture examples", "capture_examples"],
  ["Acceptance", "acceptance"],
  ["Compliance", "compliance"],
];

/** Dl rows, one per slot that has files. Written once because the contract
 *  page, the task dialog and the worker's page all show the same thing. */
export function slotRows(items: Attachment[] | undefined): [string, React.ReactNode][] {
  return REQUEST_SLOTS.flatMap(([label, slot]) => {
    const inSlot = (items ?? []).filter((a) => a.slot === slot);
    return inSlot.length
      ? [[label, <AttachmentList key={slot} items={inSlot} />] as [string, React.ReactNode]]
      : [];
  });
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
