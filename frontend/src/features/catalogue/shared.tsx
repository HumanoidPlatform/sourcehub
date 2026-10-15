// catalogue — pieces every catalogue screen uses: labels, sample previews,
// dataset cards.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { DatasetDeal, DatasetSample, PermittedUse } from "@api/types";
import { labelOf, labelsOf, PERMITTED_USES } from "@features/marketplace/vocabularies";
import { fmtBytes } from "@features/delivery/components/AssetGallery";
import { countryLabel } from "@shared/countries";
import type { Tone } from "@shared/status";
import { dealStatus, statusMeta } from "@shared/status";

export { fmtBytes };

export const CATEGORIES = [
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "structured_data", label: "Structured data" },
  { value: "unstructured_data", label: "Unstructured data" },
] as const;

export const categoryLabel = (c: string | null | undefined): string =>
  CATEGORIES.find((x) => x.value === c)?.label ?? (c ? c.replace(/_/g, " ") : "—");

export const usesText = (uses: PermittedUse[] | null | undefined): string => labelsOf(PERMITTED_USES, uses ?? []);
export const useLabel = (u: PermittedUse): string => labelOf(PERMITTED_USES, u);

export const regionsText = (codes: string[]): string =>
  codes.length ? codes.map((c) => (c.length === 2 ? countryLabel(c.toUpperCase()) : c)).join(", ") : "—";

/** "1,240 files · 3.2 GB" */
export function sizeText(count: number | null | undefined, bytes: number | null | undefined): string {
  if (count == null) return "—";
  return `${count.toLocaleString()} file${count === 1 ? "" : "s"}${bytes ? ` · ${fmtBytes(bytes)}` : ""}`;
}

export const isImage = (mime: string | null | undefined) => !!mime && mime.startsWith("image/");
export const isVideo = (mime: string | null | undefined) => !!mime && mime.startsWith("video/");

/** A preview of a listing's sample. The URL lives 15 minutes, so it is
 *  cached for 13, as AssetGallery does. */
export function SamplePreview({ sample, height = 120 }: { sample: DatasetSample; height?: number }) {
  const viewable = sample.copy_status === undefined || sample.copy_status === "copied";
  const url = useQuery({
    queryKey: ["catalogue-sample-url", sample.id],
    queryFn: () => get<{ url: string }>(`/catalogue/samples/${sample.id}/url`),
    enabled: viewable && (isImage(sample.mime_type) || isVideo(sample.mime_type)),
    staleTime: 13 * 60 * 1000,
    retry: false,
  });
  return <Preview src={url.data?.url} mime={sample.mime_type} name={sample.filename} height={height} />;
}

export function Preview({
  src, mime, name, height = 120,
}: { src?: string; mime: string | null | undefined; name: string; height?: number }) {
  const box: React.CSSProperties = {
    height, width: "100%", objectFit: "cover", borderRadius: "var(--r-control)",
    border: "1px solid var(--line)", background: "var(--surface-2)", display: "block",
  };
  if (src && isImage(mime)) return <img src={src} alt={name} loading="lazy" style={box} />;
  if (src && isVideo(mime)) return <video src={src} controls preload="metadata" style={box} aria-label={name} />;
  return (
    <div style={{ ...box, display: "grid", placeItems: "center" }} className="small muted">
      {mime ? mime.split("/")[1]?.toUpperCase() ?? "FILE" : "FILE"}
    </div>
  );
}

/** Where a listing's data came from, in a buyer's words. */
export const sourceText = (source: "upload" | "contract" | undefined): string =>
  source === "contract"
    ? "Captured through the platform for a contract, and reviewed by the aggregator and the delivery partner"
    : "Supplied by the seller";

/** "500 files" or "the whole dataset (3,000 files)" */
export function quantityText(n: number | null | undefined, total?: number | null): string {
  if (n == null) return `The whole dataset${total ? ` (${total.toLocaleString()} files)` : ""}`;
  return `${n.toLocaleString()} file${n === 1 ? "" : "s"}`;
}

/** A dataset as a card in a grid. `to` is where the card leads. */
export function DatasetCard({
  to, title, summary, seller, category, regions, uses, count, bytes, price, badge,
}: {
  to: string;
  title: string;
  summary: string | null;
  seller: string;
  category: string | null;
  regions: string[];
  uses: PermittedUse[];
  count?: number;
  bytes?: number | null;
  price?: string | null;
  badge?: React.ReactNode;
}) {
  return (
    <article className="vcard">
      <div className="vcard-head">
        <div className="vcard-title">
          <h3 className="vcard-name"><Link to={to}>{title}</Link></h3>
          <div className="vcard-meta">
            <span>{seller}</span>
            <span>{categoryLabel(category)}</span>
            <span>{sizeText(count, bytes)}</span>
          </div>
        </div>
        {badge}
      </div>
      <p className="vcard-about">{summary || "No summary."}</p>
      <div className="vcard-tags">
        {uses.slice(0, 3).map((u) => <span key={u} className="vtag" data-tone="accent">{useLabel(u)}</span>)}
        {regions.slice(0, 3).map((r) => <span key={r} className="vtag" data-tone="outline">{regionsText([r])}</span>)}
      </div>
      <div className="small muted" style={{ marginTop: "auto" }}>{price || "Price on request"}</div>
    </article>
  );
}

/**
 * A deal's status as people read it. A request from the public page (db/440)
 * is only ever open or closed: New until the seller has written, Contacted
 * once they have, Closed when declined.
 */
export function dealStatusMeta(d: Pick<DatasetDeal, "channel" | "status" | "message_count">): { label: string; tone: Tone } {
  if (d.channel === "public") {
    if (d.status === "declined") return { label: "Closed", tone: "neutral" };
    return d.message_count > 0 ? { label: "Contacted", tone: "active" } : { label: "New", tone: "attention" };
  }
  return statusMeta(dealStatus, d.status);
}
