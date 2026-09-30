// delivery/components — the capture gallery. The same tiles serve the
// aggregator's gate-1 review, the delivery partner's gate 2 and the client's
// delivery drawer; RLS decides which captures each of them is handed.
//
// Bytes never pass through the API: a tile asks for a short-lived signed URL
// only when it scrolls into view and renders the original straight from
// object storage. Clicking a tile opens an inline preview above the grid
// rather than a second dialog, so a gallery inside a dialog stays one dialog.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type RefObject } from "react";
import { get } from "@api/client";
import type { AssetRow, AssetUrl, DeviceCheck } from "@api/types";
import { Button, Dl, Empty, inputCls, selectCls } from "@ds/primitives";
import { fmtDateTime } from "@shared/format";
import { assetStatus, statusMeta } from "@shared/status";

export function useTaskAssets(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["task-assets", taskId],
    queryFn: () => get<AssetRow[]>(`/tasks/${taskId}/assets`),
    enabled: !!taskId && enabled,
  });
}

export function useAssignmentAssets(assignmentId: string | null | undefined) {
  return useQuery({
    queryKey: ["assignment-assets", assignmentId],
    queryFn: () => get<AssetRow[]>(`/assignments/${assignmentId}/assets`),
    enabled: !!assignmentId,
  });
}

// A signed URL lives 15 minutes; refetch a little before it dies.
function useAssetUrl(assetId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["asset-url", assetId],
    queryFn: () => get<AssetUrl>(`/assets/${assetId}/url`),
    enabled,
    staleTime: 13 * 60 * 1000,
    retry: false,
  });
}

function useInView<T extends Element>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

export function fmtBytes(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** The evidence behind a phone check, as one short line.
 *
 * Every check has recorded this since the checks existed and nothing has ever
 * shown it, so a reviewer read "wrong subject" without the one fact that makes
 * it actionable: which word vetoed it, and how sure the phone was. The order is
 * deliberate — the veto first, because that is what the worker has to avoid.
 *
 * Unknown keys are printed rather than dropped: a check added later should
 * appear here without this function being touched.
 */
export function detailText(d: Record<string, unknown> | undefined): string {
  if (!d) return "";
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const parts: string[] = [];
  const veto = list(d.veto);
  const hit = list(d.hit);
  const labels = list(d.labels);
  if (veto.length) parts.push(`vetoed on ${veto.join(", ")}`);
  if (hit.length) parts.push(`matched ${hit.join(", ")}`);
  if (labels.length) parts.push(`saw ${labels.join(", ")}`);
  if (typeof d.hits === "number" && typeof d.frames === "number") {
    parts.push(`${d.hits} of ${d.frames} frames`);
  } else if (typeof d.frames === "number") {
    parts.push(`${d.frames} frames`);
  }
  if (typeof d.share === "number") parts.push(`${Math.round(d.share * 100)}% of frames`);
  // Squareness: the angle the verdict used, and the two it came from.
  if (typeof d.off === "number") parts.push(`${d.off}° off square`);
  if (typeof d.roll === "number" && typeof d.pitch === "number") {
    parts.push(`roll ${d.roll}°, pitch ${d.pitch}°`);
  }
  const known = new Set(["veto", "hit", "labels", "hits", "frames", "share", "off", "roll", "pitch"]);
  for (const [k, v] of Object.entries(d)) {
    if (known.has(k) || v == null || typeof v === "object") continue;
    parts.push(`${k.replace(/_/g, " ")} ${String(v)}`);
  }
  return parts.join(" · ");
}

/** Why a capture is being sent back. The codes are defect_code.code, seeded in
 *  db/900_seed.sql — the server refuses anything not in that table, so a drift
 *  here shows up as a refusal rather than as a bad row. */
export const RETAKE_REASONS: [string, string][] = [
  ["blur", "Blurred"],
  ["occlusion", "Obscured or badly framed"],
  ["wrong_subject", "Wrong subject or place"],
  ["missing_geotag", "No location fix"],
  ["exposure", "Too dark, or glare"],
  // The phone records the degrees on every capture, so the preview pane below
  // usually says how far off square this one was.
  ["tilt", "Tilted — not square"],
  ["other", "Something else"],
];

export type Mark = { outcome: "keep" | "retake"; reason?: string; note?: string };

const reasonLabel = (code: string | null | undefined): string =>
  RETAKE_REASONS.find(([v]) => v === code)?.[1] ?? code ?? "";

export function isVideo(a: AssetRow): boolean {
  return (a.mime_type ?? "").startsWith("video/") || /\.(mp4|mov)$/i.test(a.filename ?? "");
}

const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

function AssetThumb({
  asset,
  selected,
  mark,
  onOpen,
  onRemove,
}: {
  asset: AssetRow;
  selected: boolean;
  mark?: Mark;
  onOpen: (a: AssetRow) => void;
  onRemove?: (a: AssetRow) => void;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  // A capture the aggregator sent back is still viewable by the supplier's own
  // people — the worker has to see which frame to shoot again.
  const viewable = asset.status === "ready" || asset.status === "rejected";
  const url = useAssetUrl(asset.id, inView && viewable);
  const meta = statusMeta(assetStatus, asset.status);
  const label = asset.filename ?? asset.id.slice(0, 8);
  return (
    <div
      ref={ref}
      className="asset"
      role={viewable ? "button" : undefined}
      tabIndex={viewable ? 0 : -1}
      aria-label={`${label}, ${meta.label}`}
      aria-pressed={viewable ? selected : undefined}
      title={viewable ? label : `${label} — ${meta.label}${asset.quarantine_reason ? `: ${asset.quarantine_reason}` : ""}`}
      onClick={() => viewable && onOpen(asset)}
      onKeyDown={(e) => {
        if (viewable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(asset);
        }
      }}
      style={{
        position: "relative", overflow: "hidden", cursor: viewable ? "pointer" : "default",
        outline: selected ? "2px solid var(--accent)" : undefined,
        opacity: viewable ? 1 : 0.6,
      }}
    >
      {url.data?.url ? (
        isVideo(asset) ? (
          <video src={url.data.url} muted preload="metadata" style={fill} />
        ) : (
          <img src={url.data.url} alt={label} loading="lazy" style={fill} />
        )
      ) : (
        <span className="muted" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 18 }}>
          {isVideo(asset) ? "▶" : viewable ? "…" : "◌"}
        </span>
      )}
      {mark && (
        // The reviewer's own mark, over everything else on the tile: it is the
        // thing they are keeping track of as they work down the batch.
        <span
          className="tag"
          aria-hidden
          title={mark.outcome === "retake" ? `Retake — ${reasonLabel(mark.reason)}` : "Keep"}
          style={{
            top: 3, right: 3, bottom: "auto", left: "auto",
            background: mark.outcome === "retake" ? "var(--t-critical)" : "var(--accent)",
          }}
        >
          {mark.outcome === "retake" ? "\u2717" : "\u2713"}
        </span>
      )}
      <span className="tag">{meta.label}</span>
      {subjectCheck(asset) && (
        // Amber: the phone thought this showed the wrong thing and the worker
        // kept it anyway, or a clip stood still or went dark for part of its
        // length. Grey: the phone could not look at all. Either way a hint for
        // the reviewer's eye, not a verdict.
        <span
          className="tag"
          title={subjectCheck(asset)!.message}
          style={{
            top: 3,
            left: 3,
            bottom: "auto",
            background: BADGE[subjectCheck(asset)!.code]?.tone === "grey" ? "#5B6873" : "#B45309",
          }}
        >
          {BADGE[subjectCheck(asset)!.code]?.text ?? subjectCheck(asset)!.code}
        </span>
      )}
      {onRemove && (
        // The worker's own capture, before submission. A quarantined or
        // stuck-pending one occupies a quantity slot until it goes, which is
        // why this is offered on more than the ready tiles.
        <button
          type="button"
          className="iconbtn"
          aria-label={`Remove ${label}`}
          title="Remove this capture"
          style={{ position: "absolute", top: 3, right: 3, width: 22, height: 22 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(asset);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/** The one badge a tile carries, most telling first: the phone's domain
 *  verdict, then what a clip's frames showed, then that it could not look. */
const BADGE: Record<string, { text: string; tone: "amber" | "grey" }> = {
  wrong_subject: { text: "subject?", tone: "amber" },
  // Something the client said must not appear. A separate question from
  // whether the subject is there, and now a separate finding: a capture can
  // show the shelf perfectly and still have a face in it.
  forbidden_subject: { text: "not allowed?", tone: "amber" },
  // A face, on a task whose brief asked for no people. The detector proves
  // presence and never absence — no face found means nothing — so this badge
  // appears only when one was seen, and never as a clean bill of health.
  person_in_frame: { text: "face", tone: "amber" },
  black: { text: "dark", tone: "amber" },
  frozen: { text: "still", tone: "amber" },
  subject_unscored: { text: "unchecked", tone: "grey" },
  clip_unchecked: { text: "unchecked", tone: "grey" },
};

function subjectCheck(asset: AssetRow) {
  const checks = asset.device_checks ?? [];
  for (const code of Object.keys(BADGE)) {
    const c = checks.find((x) => x.code === code);
    if (c) return c;
  }
  return null;
}

/** The phone's findings, split so a complaint is never buried under a
 *  measurement.
 *
 *  Every capture now carries several info findings — how much it looked like
 *  the client's example photos, what text was in it, whether a face was, which
 *  handset took it. Those are worth having in front of a reviewer, but a
 *  warning listed fifth among them is a warning nobody reads. Complaints keep
 *  the "Phone check" heading they always had; measurements get their own. */
function checkRows(checks: DeviceCheck[] | undefined): [string, React.ReactNode][] {
  const all = checks ?? [];
  const lines = (list: DeviceCheck[], key: string) => (
    <span key={key}>
      {list.map((c, i) => (
        <span key={i} style={{ display: "block" }}>
          {c.message}
          {c.score != null && <span className="muted"> · score {c.score.toFixed(2)}</span>}
          {/* What the phone actually saw. The message says "wrong subject";
              this says it was vetoed on `floor` at 0.71, which is the part a
              reviewer can act on. */}
          {detailText(c.detail) && (
            <span className="muted small" style={{ display: "block" }}>{detailText(c.detail)}</span>
          )}
        </span>
      ))}
    </span>
  );
  const complaints = all.filter((c) => c.severity !== "info");
  const measured = all.filter((c) => c.severity === "info");
  const rows: [string, React.ReactNode][] = [];
  if (complaints.length) rows.push(["Phone check", lines(complaints, "dc")]);
  if (measured.length) rows.push(["Measured", lines(measured, "dm")]);
  return rows;
}

function AssetPreview({
  asset,
  mark,
  onMark,
  onClose,
  position,
  onStep,
}: {
  asset: AssetRow;
  mark?: Mark;
  onMark?: (a: AssetRow, m: Mark | null) => void;
  onClose: () => void;
  /** where this capture sits in the batch, 1-based, for "3 of 12" */
  position?: { at: number; of: number };
  /** -1 / +1 through the same order the grid shows */
  onStep?: (by: number) => void;
}) {
  const url = useAssetUrl(asset.id, true);
  const meta = statusMeta(assetStatus, asset.status);
  const where =
    asset.captured_lat != null && asset.captured_lon != null
      ? `${Number(asset.captured_lat).toFixed(5)}, ${Number(asset.captured_lon).toFixed(5)}`
      : "—";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(200px, 2fr)", gap: 14, marginBottom: 12 }}>
      <div style={{ background: "#000", minHeight: 220, display: "grid", placeItems: "center", borderRadius: 6, overflow: "hidden" }}>
        {url.data?.url ? (
          isVideo(asset) ? (
            <video src={url.data.url} controls style={{ maxWidth: "100%", maxHeight: "55vh" }} />
          ) : (
            <img src={url.data.url} alt={asset.filename ?? "capture"} style={{ maxWidth: "100%", maxHeight: "55vh", objectFit: "contain" }} />
          )
        ) : (
          <span className="muted small" style={{ color: "#bbb" }}>{url.isError ? "Could not load this file." : "Loading…"}</span>
        )}
      </div>
      <div>
        <Dl rows={[
          ["File", asset.filename ?? "—"],
          ["Status", meta.label],
          ["Captured", fmtDateTime(asset.captured_at)],
          ["By", asset.captured_by_name ?? "—"],
          ["Location", where],
          ["Size", fmtBytes(asset.size_bytes)],
          ["Checksum", <code key="sha" className="id">{asset.sha256.slice(0, 16)}…</code>],
          ...(asset.review_reason
            ? ([["Sent back", <span key="rv">
                {asset.review_label ?? reasonLabel(asset.review_reason)}
                {asset.review_note && <span className="muted"> · {asset.review_note}</span>}
              </span>]] as [string, React.ReactNode][])
            : []),
          ...checkRows(asset.device_checks),
        ]} />
        {onMark && (
          // A verdict on one capture, taken beside the picture it is about.
          // Retake needs a reason before it means anything, so the picker is
          // the mark: choosing a reason IS choosing retake.
          <div style={{ marginTop: 10 }}>
            <div className="btnrow" style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant={mark?.outcome === "keep" ? "success" : undefined}
                aria-pressed={mark?.outcome === "keep"}
                onClick={() => onMark(asset, mark?.outcome === "keep" ? null : { outcome: "keep" })}
              >
                Keep
              </Button>
              <select
                className={selectCls}
                aria-label="Send this capture back to be shot again"
                value={mark?.outcome === "retake" ? (mark.reason ?? "") : ""}
                onChange={(e) =>
                  onMark(asset, e.target.value ? { outcome: "retake", reason: e.target.value, note: mark?.note } : null)
                }
                style={{ maxWidth: 220 }}
              >
                <option value="">Retake — why?</option>
                {RETAKE_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {mark?.outcome === "retake" && (
              <input
                className={inputCls}
                aria-label="What to change about this capture"
                placeholder="Optional: what to change about this one"
                value={mark.note ?? ""}
                maxLength={500}
                onChange={(e) => onMark(asset, { ...mark, note: e.target.value })}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        )}
        <div className="btnrow" style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
          {onStep && position && (
            // The arrow keys do the same thing; these say that it is possible.
            <>
              <Button size="sm" aria-label="Previous capture" disabled={position.at <= 1} onClick={() => onStep(-1)}>←</Button>
              <span className="small muted" data-testid="preview-position">{position.at} of {position.of}</span>
              <Button size="sm" aria-label="Next capture" disabled={position.at >= position.of} onClick={() => onStep(1)}>→</Button>
            </>
          )}
          {url.data?.url && (
            <a className="btn" data-size="sm" href={url.data.url} target="_blank" rel="noopener noreferrer">Open original</a>
          )}
          <Button size="sm" onClick={onClose}>Close preview</Button>
        </div>
      </div>
    </div>
  );
}

export function AssetGallery({
  assets,
  loading = false,
  emptyTitle = "No captures yet",
  emptyHint,
  marks,
  onMark,
  onRemove,
}: {
  assets: AssetRow[];
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  /** the reviewer's marks so far, by asset id. Absent everywhere but gate 1. */
  marks?: Record<string, Mark>;
  /** null clears the mark on that capture */
  onMark?: (a: AssetRow, m: Mark | null) => void;
  /** offered only where a capture is still the uploader's to withdraw */
  onRemove?: (a: AssetRow) => void;
}) {
  const [open, setOpen] = useState<AssetRow | null>(null);
  const at = open ? assets.findIndex((a) => a.id === open.id) : -1;
  const current = at >= 0 ? assets[at] : null;

  // Walk the batch from the keyboard. Judging fifty captures by opening and
  // closing fifty previews is the slow part of a reviewer's day; the frames are
  // already in one ordered list, so stepping through it costs nothing.
  //
  // Escape is deliberately left alone: Dialog owns it and closes the whole
  // review, which is what someone pressing it expects. Taking it over here
  // would make the same key mean two different things one layer apart.
  const step = (by: number) => {
    if (at < 0) return;
    const next = assets[at + by];
    if (next) setOpen(next);
  };
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // Not while they are in the reason picker or typing a note — there the
      // arrows belong to the control.
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- step is rebuilt
    // each render; rebinding on the position and the list is what keeps its
    // closure current without a listener churn on every keystroke elsewhere.
  }, [at, assets]);

  if (loading) return <p className="muted small">Loading captures…</p>;
  if (assets.length === 0) return <Empty title={emptyTitle} hint={emptyHint} />;
  return (
    <div>
      {current && (
        <AssetPreview
          asset={current}
          mark={marks?.[current.id]}
          onMark={onMark}
          onClose={() => setOpen(null)}
          position={{ at: at + 1, of: assets.length }}
          onStep={step}
        />
      )}
      <div className="assetgrid">
        {assets.map((a) => (
          <AssetThumb
            key={a.id}
            asset={a}
            selected={current?.id === a.id}
            mark={marks?.[a.id]}
            onOpen={(x) => setOpen(current?.id === x.id ? null : x)}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
