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
import type { AssetRow, AssetUrl } from "@api/types";
import { Button, Dl, Empty } from "@ds/primitives";
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

export function isVideo(a: AssetRow): boolean {
  return (a.mime_type ?? "").startsWith("video/") || /\.(mp4|mov)$/i.test(a.filename ?? "");
}

const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

function AssetThumb({
  asset,
  selected,
  onOpen,
  onRemove,
}: {
  asset: AssetRow;
  selected: boolean;
  onOpen: (a: AssetRow) => void;
  onRemove?: (a: AssetRow) => void;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const viewable = asset.status === "ready";
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
        outline: selected ? "2px solid var(--accent, #0E7C86)" : undefined,
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
      <span className="tag">{meta.label}</span>
      {subjectCheck(asset) && (
        // The phone thought this showed the wrong thing and the worker kept
        // it anyway. A hint for the reviewer's eye, not a verdict.
        <span
          className="tag"
          title={subjectCheck(asset)!.message}
          style={{ top: 3, left: 3, bottom: "auto", background: "#B45309" }}
        >
          subject?
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

/** the phone's domain verdict on this capture, if it gave one */
function subjectCheck(asset: AssetRow) {
  return (asset.device_checks ?? []).find((c) => c.code === "wrong_subject") ?? null;
}

function AssetPreview({ asset, onClose }: { asset: AssetRow; onClose: () => void }) {
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
          ...((asset.device_checks ?? []).length
            ? ([["Phone check", <span key="dc">
                {(asset.device_checks ?? []).map((c, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {c.message}
                    {c.score != null && <span className="muted"> · score {c.score.toFixed(2)}</span>}
                  </span>
                ))}
              </span>]] as [string, React.ReactNode][])
            : []),
        ]} />
        <div className="btnrow" style={{ marginTop: 10, display: "flex", gap: 8 }}>
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
  onRemove,
}: {
  assets: AssetRow[];
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  /** offered only where a capture is still the uploader's to withdraw */
  onRemove?: (a: AssetRow) => void;
}) {
  const [open, setOpen] = useState<AssetRow | null>(null);
  if (loading) return <p className="muted small">Loading captures…</p>;
  if (assets.length === 0) return <Empty title={emptyTitle} hint={emptyHint} />;
  const current = open && assets.find((a) => a.id === open.id) ? open : null;
  return (
    <div>
      {current && <AssetPreview asset={current} onClose={() => setOpen(null)} />}
      <div className="assetgrid">
        {assets.map((a) => (
          <AssetThumb key={a.id} asset={a} selected={current?.id === a.id} onOpen={(x) => setOpen(current?.id === x.id ? null : x)} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
