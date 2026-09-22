// The worker's upload dialog: the phone's assignment and capture screens,
// folded into one dialog on the console. Opened from a row of My assignments;
// the same API the phone speaks, and nothing the phone does not.
//
// Everything a browser cannot verify about a file — a live fix, the tilt of
// the camera — is said plainly at the top rather than pretended.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { del, post } from "@api/client";
import type { Assignment, AssetRow, CaptureSpec } from "@api/types";
import { Button, Callout, Dialog, Dl, Field, Meter, Pill, textareaCls, useToast } from "@ds/primitives";
import { AttachmentList, slotRows } from "@shared/attachments";
import { useSession } from "@shared/auth";
import { fmtDate } from "@shared/format";
import { can } from "@shared/rbac";
import { assignmentStatus, statusMeta } from "@shared/status";
import { AssetGallery, fmtBytes, useAssignmentAssets } from "@features/delivery/components/AssetGallery";
import { ACCEPT } from "./config";
import { useUploadQueue } from "./hooks";
import { groupRefusals, refusalLabel } from "./intake";
import type { QueueItem } from "./item";
import { useUploadProgress } from "./progress";
import { mediaKinds } from "./rules";
import { uploadQueue } from "./uploader";

/* --- what the client asked for ---------------------------------------------- */

const SPEC_LABEL: Record<string, string> = {
  media: "Media",
  min_megapixels: "Minimum megapixels",
  orientation: "Orientation",
  require_gps: "GPS fix",
  max_tilt_deg: "Squareness",
  min_duration_s: "Minimum length",
  max_duration_s: "Maximum length",
  min_video_lines: "Video size",
  allow_library: "Gallery picks",
  subject: "Subject",
  notes: "Notes",
  languages: "Languages",
};

function specRows(spec: CaptureSpec | null | undefined, targetUnit: string | null): [string, string][] {
  const rows: [string, string][] = [];
  // The API sends every declared key, set or not; a requirement nobody
  // stated is not one — the phone makes the same cut.
  for (const [k, v] of Object.entries(spec ?? {})) {
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    let text: string;
    if (k === "media") text = mediaKinds(spec, targetUnit).join(" or ");
    else if (k === "require_gps") text = v ? "required on every capture" : "not required";
    else if (k === "max_tilt_deg") text = `within ${String(v)}° of square`;
    else if (k === "max_duration_s" || k === "min_duration_s") text = `${String(v)} s`;
    else if (k === "min_video_lines") text = `at least ${String(v)}p`;
    else if (k === "allow_library") text = v ? "allowed" : "not allowed";
    else if (k === "subject") text = typeof v === "object" && v && "domain" in v ? String((v as { domain: string }).domain) : String(v);
    else text = Array.isArray(v) ? v.join(", ") : String(v);
    rows.push([SPEC_LABEL[k] ?? k.replace(/_/g, " "), text]);
  }
  return rows;
}

/** The conditions a reviewer will judge instead, because a file on disk
 *  cannot answer them. Said before the first file is picked. */
function unverifiable(spec: CaptureSpec | null | undefined): string[] {
  const out: string[] = [];
  if (typeof spec?.max_tilt_deg === "number" && spec.max_tilt_deg > 0) {
    out.push(`Squareness within ${spec.max_tilt_deg}° — the camera's tilt is not in the file.`);
  }
  if (spec?.require_gps) {
    out.push("A GPS fix — only what the file's own EXIF carries can be checked, and a file with none is flagged rather than refused.");
  }
  return out;
}

/* --- one file in the queue ---------------------------------------------------- */

const ITEM_LABEL: Record<QueueItem["status"], string> = {
  captured: "Preparing",
  presigned: "Waiting",
  uploading: "Uploading",
  uploaded: "Confirming",
  confirmed: "Uploaded",
  failed: "Failed",
};

function QueueRow({ item }: { item: QueueItem }) {
  const progress = useUploadProgress();
  const pct = item.status === "uploading" ? Math.round((progress.get(item.id) ?? 0) * 100) : item.status === "confirmed" ? 100 : 0;
  const waiting = item.status === "presigned" && item.next_attempt_at > Date.now();
  const warnings = item.checks.filter((c) => c.code !== "web_upload");
  return (
    <div className="filelist-row" data-status={item.status === "failed" ? "error" : item.status === "confirmed" ? "done" : "uploading"} style={{ flexWrap: "wrap" }}>
      <span className="filelist-name" style={{ flex: "1 1 200px" }}>{item.filename}</span>
      <span className="filelist-size">{fmtBytes(item.size)}</span>
      <span className="chip">{waiting ? "Retrying" : ITEM_LABEL[item.status]}</span>
      {item.status === "failed" && item.file && (
        <Button size="sm" onClick={() => uploadQueue.retry(item.id)}>Retry</Button>
      )}
      {item.status !== "confirmed" && (
        <button type="button" className="iconbtn" aria-label={`Remove ${item.filename}`} onClick={() => void uploadQueue.discard(item.id)}>×</button>
      )}
      {item.status === "confirmed" && (
        <button type="button" className="iconbtn" aria-label={`Clear ${item.filename} from the list`} onClick={() => uploadQueue.forget(item.id)}>×</button>
      )}
      {(item.status === "uploading" || item.status === "uploaded") && (
        <div style={{ flexBasis: "100%" }}><Meter pct={item.status === "uploaded" ? 100 : pct} /></div>
      )}
      {(item.last_error || item.note || warnings.length > 0) && (
        <div className="small muted" style={{ flexBasis: "100%" }}>
          {item.last_error ?? item.note}
          {warnings.length > 0 && (
            <span>{item.last_error || item.note ? " · " : ""}{warnings.map((w) => w.message).join(" ")}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* --- the dialog ------------------------------------------------------------------ */

export function AssignmentUploadDialog({ assignment: a, onClose }: { assignment: Assignment; onClose: () => void }) {
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const mayUpload = can(session, "asset.upload");
  const spec = a.task.capture_spec;
  const m = statusMeta(assignmentStatus, a.status);

  const assets = useAssignmentAssets(a.id);
  const rows = assets.data ?? [];
  const queue = useUploadQueue(a.id);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadable = a.status === "in_progress";
  const startable = a.status === "assigned" || a.status === "rejected";

  // Whatever an earlier session left half-done is still on the server and
  // still holds a slot; give the queue a chance to finish or free it.
  useEffect(() => {
    if (uploadable && assets.data) uploadQueue.adopt(a.id, assets.data);
  }, [uploadable, assets.data, a.id]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["my-assignments"] });
    void qc.invalidateQueries({ queryKey: ["assignment-assets", a.id] });
  };

  const start = useMutation({
    mutationFn: () => post<Assignment>(`/assignments/${a.id}/start`),
    onSuccess: invalidate,
    onError: (e) => toast("Cannot start", e instanceof Error ? e.message : "", "critical"),
  });
  const submit = useMutation({
    mutationFn: () => post<Assignment>(`/assignments/${a.id}/submit`, { note: note.trim() || null }),
    onSuccess: () => {
      invalidate();
      setConfirming(false);
      toast("Submitted", "Your supplier will review it.", "success");
    },
    onError: (e) => {
      setConfirming(false);
      toast("Cannot submit", e instanceof Error ? e.message : "", "critical");
    },
  });
  const remove = useMutation({
    mutationFn: (asset: AssetRow) => del(`/assets/${asset.id}`),
    onSuccess: invalidate,
    onError: (e) => toast("Cannot remove", e instanceof Error ? e.message : "", "critical"),
  });

  const pick = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    void uploadQueue.add(a.id, list, { spec, targetUnit: a.task.target_unit, quantity: a.quantity, serverRows: rows });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (uploadable && mayUpload) pick(e.dataTransfer.files);
  };

  const ready = rows.filter((r) => r.status === "ready").length;
  // the server's own rule (delivery/service.py submit_assignment), not the phone's looser one
  const canSubmit = uploadable && ready >= 1 && (!a.quantity || ready >= a.quantity) && queue.active === 0 && queue.failed === 0;
  const busy = queue.active > 0 || start.isPending || submit.isPending;
  const grouped = groupRefusals(queue.refusals);
  const caveats = unverifiable(spec);
  // the coordinator's own files first, then the client's — a slot with nothing
  // in it renders no row
  const referenceRows: [string, React.ReactNode][] = [
    ...((a.task.attachments ?? []).length
      ? [["From your coordinator", <AttachmentList key="tf" items={a.task.attachments ?? []} />] as [string, React.ReactNode]]
      : []),
    ...slotRows(a.task.client_documents),
  ];

  return (
    <Dialog
      size="wide"
      title={a.task.title}
      sub={<>{a.task.reference_code} · {ready} of {a.quantity} ready · due {fmtDate(a.due_on ?? a.task.due_on)} · <Pill tone={m.tone}>{m.label}</Pill></>}
      onClose={onClose}
      busy={busy}
      foot={
        confirming ? (
          <>
            <span className="small muted" style={{ marginRight: "auto" }}>Submit {ready} capture{ready === 1 ? "" : "s"} for review? You cannot add more afterwards.</span>
            <Button onClick={() => setConfirming(false)} disabled={submit.isPending}>Not yet</Button>
            <Button variant="primary" onClick={() => submit.mutate()} disabled={submit.isPending}>Submit</Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>{busy ? "Close — uploads continue" : "Close"}</Button>
            {startable && mayUpload && (
              <Button variant="primary" onClick={() => start.mutate()} disabled={start.isPending}>
                {a.status === "rejected" ? "Reopen and upload" : "Start and upload"}
              </Button>
            )}
            {uploadable && mayUpload && (
              <Button
                variant="primary"
                disabled={!canSubmit}
                title={canSubmit ? undefined : queue.active > 0 ? "Wait for the uploads to finish" : queue.failed > 0 ? "Retry or remove the failed files first" : `${a.quantity} required, ${ready} uploaded`}
                onClick={() => setConfirming(true)}
              >
                Submit for review
              </Button>
            )}
          </>
        )
      }
    >
      {a.status === "rejected" && a.decision_note && (
        <Callout tone="critical" title="Sent back by your supplier">{a.decision_note}</Callout>
      )}

      <div className="formgrid" style={{ marginTop: 8 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Capture requirements</div>
          {specRows(spec, a.task.target_unit).length > 0 ? (
            <Dl rows={specRows(spec, a.task.target_unit)} />
          ) : (
            <p className="small muted">The client stated no conditions beyond the media kind.</p>
          )}
        </div>
        <div>
          {(a.task.instructions || a.instructions) && (
            <>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Instructions</div>
              {a.task.instructions && <p className="small" style={{ whiteSpace: "pre-wrap" }}>{a.task.instructions}</p>}
              {a.instructions && <p className="small" style={{ whiteSpace: "pre-wrap" }}>{a.instructions}</p>}
            </>
          )}
        </div>
      </div>

      {/* The files behind the words. What gets a capture rejected is written in
          these, and until now the person capturing was never shown them. */}
      {referenceRows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Reference documents</div>
          <Dl rows={referenceRows} />
        </div>
      )}

      {caveats.length > 0 && uploadable && (
        <Callout tone="attention" title="A reviewer will judge these on uploaded files">
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {caveats.map((c) => <li key={c} className="small">{c}</li>)}
          </ul>
        </Callout>
      )}

      {!mayUpload && (
        <Callout tone="attention" title="This account cannot upload captures" />
      )}

      {startable && mayUpload && (
        <Callout title="Start the assignment to add files">
          Uploads are accepted only against an assignment in progress — the same rule the phone follows.
        </Callout>
      )}

      {uploadable && mayUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            marginTop: 12,
            padding: 14,
            border: `1px dashed ${dragging ? "var(--accent)" : "var(--line)"}`,
            borderRadius: "var(--r-control)",
            background: dragging ? "var(--surface-2)" : undefined,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              if (e.target.files?.length) pick(e.target.files);
              e.target.value = ""; // allow re-picking the same file
            }}
          />
          <div className="btnrow" style={{ alignItems: "center" }}>
            <Button variant="primary" onClick={() => inputRef.current?.click()}>Add files</Button>
            <span className="small muted">or drop them here · photos {ACCEPT.split(",").filter((x) => !/mp4|mov/.test(x)).join(" ")} · videos .mp4 .mov · 25 MB per photo, 2 GB per video</span>
          </div>

          {queue.items.length > 0 && (
            <div className="filelist" style={{ marginTop: 10 }}>
              {queue.items.map((i) => <QueueRow key={i.id} item={i} />)}
            </div>
          )}

          {grouped.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary className="small" style={{ cursor: "pointer" }}>
                {queue.refusals.length} refused on this computer — not sent for review
                {" · "}
                {grouped.map((g) => `${g.n} × ${refusalLabel[g.code] ?? g.code.replace(/_/g, " ")}`).join(", ")}
              </summary>
              <ul className="small muted" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {queue.refusals.map((r) => (
                  <li key={r.id}>
                    <b>{r.filename}</b> — {r.findings.map((f) => f.message).join(" ")}
                  </li>
                ))}
              </ul>
              <Button size="sm" onClick={() => uploadQueue.clearRefusals(a.id)}>Clear</Button>
            </details>
          )}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>On the server · {ready} ready{rows.length > ready ? `, ${rows.length - ready} not` : ""}</div>
        <AssetGallery
          assets={rows}
          loading={assets.isLoading}
          emptyTitle="Nothing uploaded yet"
          emptyHint={uploadable ? "Files you add above appear here once the server has them." : undefined}
          onRemove={uploadable && mayUpload ? (asset) => remove.mutate(asset) : undefined}
        />
      </div>

      {uploadable && mayUpload && (
        <div className="formgrid" style={{ marginTop: 12 }}>
          <Field label="Note for your supplier" span hint="Optional — anything the reviewer should know about this batch.">
            {(id) => <textarea id={id} className={textareaCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </div>
      )}

      {!uploadable && !startable && (
        <div style={{ marginTop: 12 }}>
          <Dl rows={[
            ["Submitted", fmtDate(a.submitted_at)],
            ["Your note", a.worker_note ?? "—"],
            ["Decision", a.decided_at ? `${m.label} · ${fmtDate(a.decided_at)}` : "Awaiting review"],
            ["Reviewer's note", a.decision_note ?? "—"],
          ]} />
        </div>
      )}
    </Dialog>
  );
}
