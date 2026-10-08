// catalogue — pieces every catalogue screen uses: labels, file previews, the
// evidence panel, dataset cards.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { get } from "@api/client";
import type { DatasetEvidence, DatasetItem, PermittedUse } from "@api/types";
import { Dl } from "@ds/primitives";
import { fmtDate } from "@shared/format";
import { labelOf, labelsOf, PERMITTED_USES } from "@features/marketplace/vocabularies";
import { fmtBytes } from "@features/delivery/components/AssetGallery";
import { countryLabel } from "@shared/countries";

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

/** A preview of a file someone may already see. The URL lives 15 minutes,
 *  so it is cached for 13, as AssetGallery does. */
export function ItemPreview({ item, height = 120 }: { item: DatasetItem; height?: number }) {
  const viewable = item.copy_status === undefined || item.copy_status === "copied";
  const url = useQuery({
    queryKey: ["catalogue-item-url", item.id],
    queryFn: () => get<{ url: string }>(`/catalogue/items/${item.id}/url`),
    enabled: viewable && !item.withdrawn_at && (isImage(item.mime_type) || isVideo(item.mime_type)),
    staleTime: 13 * 60 * 1000,
    retry: false,
  });
  return <Preview src={url.data?.url} mime={item.mime_type} name={item.filename} height={height} />;
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

/** What can be said about how the files were made — and, as plainly, what
 *  cannot. Nothing about the people shown is recorded, so nothing is claimed. */
export function EvidencePanel({ evidence }: { evidence: DatasetEvidence | null | undefined }) {
  if (!evidence) return null;
  const relisted = evidence.source === "contract";
  const yes = (b: boolean) => (b ? "Yes" : "Not recorded");
  return (
    <Dl
      rows={[
        ["Where it came from", relisted ? "Captured through the platform, for a contract" : "Uploaded by the seller"],
        ["Captured", evidence.captured_from ? `${fmtDate(evidence.captured_from)} – ${fmtDate(evidence.captured_to)}` : "Not recorded"],
        ["Device checks on capture", evidence.with_device_checks ? `${evidence.with_device_checks.toLocaleString()} files` : "Not recorded"],
        ["Passed the aggregator's and partner's review", relisted ? "Every file" : "Not applicable"],
        ["Capturer agreed to resale", relisted ? yes(evidence.capturer_resale_consent) : "The seller's warranty"],
        ["Consent from people shown", "Not recorded by the platform — see the seller's licence terms"],
      ]}
    />
  );
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
  bytes?: number;
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
