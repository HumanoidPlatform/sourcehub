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

import { useState } from "react";
import { del, get, post, putFile } from "@api/client";
import type { Attachment } from "@api/types";
import { Field, FileField, useToast } from "@ds/primitives";

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

// Mirrors the server's list so most rejections never leave the browser. The
// server re-checks every one of them.
const ACCEPT =
  ".csv,.tsv,.json,.jsonl,.xml,.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.mp3,.wav,.zip,.xlsx,.docx,.parquet";

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
}: {
  label: string;
  hint?: string;
  span?: boolean;
  items: AttachmentDraft[];
  onChange: (next: AttachmentDraft[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const pick = (files: FileList) => {
    setError(null);
    const room = MAX_ATTACHMENTS - items.length;
    const picked = Array.from(files);
    if (picked.length > room) {
      setError(
        room === 0
          ? `Already at ${MAX_ATTACHMENTS} files. Remove one to add another.`
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
          onChange(
            next.map((a) =>
              a === draft ? { ...a, key: pre.storage_key, status: "done" as const } : a,
            ),
          );
        } catch (e) {
          onChange(next.map((a) => (a === draft ? { ...a, status: "error" as const } : a)));
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
          onChange(items.filter((_, j) => j !== i));
        } catch (e) {
          toast("Could not remove it", e instanceof Error ? e.message : "", "critical");
        }
      })();
      return;
    }
    onChange(items.filter((_, j) => j !== i));
  };

  return (
    <Field label={label} span={span} hint={hint} error={error ?? undefined}>
      {() => (
        <FileField
          label="Attach a file"
          accept={ACCEPT}
          disabled={items.length >= MAX_ATTACHMENTS}
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
  if (!items.length) return empty ? <span className="muted">{empty}</span> : null;
  return (
    <div className="filelist">
      {items.map((a) => (
        <div key={a.id} className="filelist-row">
          <span className="filelist-name">{a.filename}</span>
          <span className="filelist-size">{fmtSize(a.size_bytes)}</span>
          <button
            type="button"
            className="btn"
            data-size="sm"
            onClick={() => {
              void (async () => {
                try {
                  // Signed on demand and short-lived, so a link cannot be
                  // forwarded to someone the policy would refuse.
                  const u = await get<{ url: string }>(`/attachments/${a.id}/url`);
                  window.open(u.url, "_blank", "noopener");
                } catch (e) {
                  toast("Download failed", e instanceof Error ? e.message : "", "critical");
                }
              })();
            }}
          >
            Open
          </button>
        </div>
      ))}
    </div>
  );
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
