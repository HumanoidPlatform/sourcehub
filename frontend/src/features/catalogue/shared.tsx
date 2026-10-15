// catalogue — pieces every catalogue screen uses: labels, sample previews,
// dataset cards, and the list of quote requests from the public page.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { get, patch, post } from "@api/client";
import type { CatalogueLead, DatasetSample, LeadReply, PermittedUse } from "@api/types";
import {
  Button, Callout, DataTable, Dialog, Empty, Field, Panel, Pill, Skeleton, textareaCls, useToast,
} from "@ds/primitives";
import { labelOf, labelsOf, PERMITTED_USES } from "@features/marketplace/vocabularies";
import { fmtBytes } from "@features/delivery/components/AssetGallery";
import { countryLabel } from "@shared/countries";
import { fmtDateTime } from "@shared/format";

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

/* --- quote requests from the public page ------------------------------------ */

/**
 * People without an account asking for a quote (db/430). The seller sees the
 * requests on its own listings, replies from here (the platform emails it,
 * Reply-To the seller) and marks them; Ops see every request, its seller and
 * the replies, and change none.
 */
export function LeadsPanel({ leads, loading, readOnly = false }: {
  leads: CatalogueLead[] | undefined;
  loading: boolean;
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState<CatalogueLead | null>(null);
  const mark = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CatalogueLead["status"] }) => patch(`/catalogue/leads/${id}`, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["catalogue-leads"] }),
    onError: (e) => toast("Not saved", e instanceof Error ? e.message : "Something went wrong", "critical"),
  });
  return (
    <Panel flush>
      {loading ? <Skeleton rows={4} label="Loading quote requests" /> : !leads?.length ? (
        <Empty
          title="No quote requests yet"
          hint={readOnly
            ? "People without an account ask for quotes on the public dataset pages; each request goes to the dataset's seller."
            : "People without an account can ask for a quote on your published listings. Their requests appear here."}
        />
      ) : (
        <DataTable
          rows={leads}
          rowKey={(r) => r.id}
          filter={{ label: "Filter requests", placeholder: "Filter by company, email or dataset…", text: (r) => `${r.company} ${r.email} ${r.dataset_title} ${r.seller_name}` }}
          columns={[
            { header: "Received", cell: (r) => fmtDateTime(r.created_at), sortBy: (r) => r.created_at },
            { header: "From", className: "cell-primary", cell: (r) => <>{r.name} · {r.company}<div className="cell-meta">{r.email}</div></> },
            { header: "Dataset", cell: (r) => <Link to={`/catalogue/${r.dataset_slug}`}>{r.dataset_title}</Link> },
            ...(readOnly ? [{ header: "Seller", cell: (r: CatalogueLead) => r.seller_name, sortBy: (r: CatalogueLead) => r.seller_name }] : []),
            {
              header: "Intended use",
              cell: (r) => <>{r.intended_use}{r.message && <div className="cell-meta">{r.message}</div>}</>,
            },
            {
              header: "Status",
              cell: (r) => <>
                <Pill tone={r.status === "new" ? "attention" : r.status === "contacted" ? "active" : "neutral"}>
                  {r.status === "new" ? "New" : r.status === "contacted" ? "Contacted" : "Closed"}
                </Pill>
                {r.reply_count > 0 && <div className="cell-meta">{r.reply_count} {r.reply_count === 1 ? "reply" : "replies"} sent</div>}
              </>,
            },
            {
              header: "Actions", hideHeader: true, className: "right",
              cell: (r) => (
                <div className="rowactions">
                  {readOnly ? (
                    r.reply_count > 0 && <Button size="sm" onClick={() => setOpen(r)}>Replies</Button>
                  ) : (
                    <>
                      <Button size="sm" variant={r.status === "new" ? "primary" : undefined} onClick={() => setOpen(r)}>
                        {r.status === "closed" ? "Replies" : "Reply"}
                      </Button>
                      {r.status === "new" && <Button size="sm" onClick={() => mark.mutate({ id: r.id, status: "contacted" })}>Contacted</Button>}
                      {r.status !== "closed" && <Button size="sm" onClick={() => mark.mutate({ id: r.id, status: "closed" })}>Close</Button>}
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      {open && <LeadReplyDialog lead={open} canReply={!readOnly && open.status !== "closed"} onClose={() => setOpen(null)} />}
    </Panel>
  );
}

function LeadReplyDialog({ lead, canReply, onClose }: { lead: CatalogueLead; canReply: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [body, setBody] = useState("");
  const replies = useQuery({
    queryKey: ["catalogue-lead-replies", lead.id],
    queryFn: () => get<LeadReply[]>(`/catalogue/leads/${lead.id}/replies`),
  });
  const send = useMutation({
    mutationFn: () => post<LeadReply>(`/catalogue/leads/${lead.id}/replies`, { body: body.trim() }),
    onSuccess: () => {
      setBody("");
      toast("Reply sent", `Emailed to ${lead.email}. Their answer comes to your inbox.`);
      void qc.invalidateQueries({ queryKey: ["catalogue-leads"] });
      void qc.invalidateQueries({ queryKey: ["catalogue-lead-replies", lead.id] });
    },
  });
  return (
    <Dialog
      title={canReply ? `Reply to ${lead.name}` : "Replies"}
      sub={`${lead.company} · ${lead.dataset_title}`}
      onClose={onClose}
      busy={send.isPending}
      foot={
        <>
          <Button onClick={onClose}>{canReply ? "Cancel" : "Close"}</Button>
          {canReply && (
            <Button variant="primary" disabled={!body.trim() || send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? "Sending…" : "Send email"}
            </Button>
          )}
        </>
      }
    >
      <div className="small" style={{ background: "var(--ground)", borderRadius: 6, padding: "8px 10px" }}>
        <div style={{ fontWeight: 600 }}>{lead.name} asked, {fmtDateTime(lead.created_at)}</div>
        <div>{lead.intended_use}</div>
        {lead.message && <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{lead.message}</div>}
      </div>
      {replies.isLoading ? <Skeleton rows={2} label="Loading replies" /> : (replies.data ?? []).map((r) => (
        <div key={r.id} className="small" style={{ borderLeft: "3px solid var(--line)", padding: "4px 10px" }}>
          <div style={{ fontWeight: 600 }}>{r.sender_name}, {fmtDateTime(r.created_at)}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{r.body}</div>
        </div>
      ))}
      {canReply && (
        <>
          <Field label="Your reply" required hint={`Sent to ${lead.email} from the platform, with your address to reply to.`}>
            {(id) => <textarea id={id} className={textareaCls} rows={7} value={body} onChange={(e) => setBody(e.target.value)} />}
          </Field>
          {send.isError && <Callout tone="critical" title="Not sent">{(send.error as Error).message}</Callout>}
        </>
      )}
    </Dialog>
  );
}
