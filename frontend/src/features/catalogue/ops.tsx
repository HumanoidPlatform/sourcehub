// catalogue — operations: the listing review queue, and a read-only view of
// quote requests from people without an account. Each is a public deal its
// seller answers by email (db/440); Ops open it and read, nothing more.
//
// Nothing reaches DataHub or the public page until Ops publishes it
// (db/390's transition trigger refuses anyone else). Review reads the samples
// above all: they are what the public will see, and the platform records no
// consent from the people shown in them.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "@api/client";
import type { Dataset, DatasetDeal } from "@api/types";
import {
  Button, Callout, DataTable, Dialog, Dl, Empty, Panel, Pill, Skeleton, useToast, View,
} from "@ds/primitives";
import { fmtDate, fmtDateTime } from "@shared/format";
import { ReasonDialog } from "@shared/reason-dialog";
import { datasetStatus, statusMeta } from "@shared/status";
import {
  categoryLabel, dealStatusMeta, regionsText, SamplePreview, sizeText, sourceText, usesText,
} from "./shared";

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function CatalogueReviewPage() {
  const [tab, setTab] = useState<"listings" | "leads">("listings");
  const [open, setOpen] = useState<string | null>(null);
  const queue = useQuery({ queryKey: ["catalogue-review"], queryFn: () => get<Dataset[]>("/catalogue/review") });
  const deals = useQuery({ queryKey: ["catalogue-deals"], queryFn: () => get<DatasetDeal[]>("/catalogue/deals") });
  const requests = (deals.data ?? []).filter((d) => d.channel === "public");
  const waiting = (queue.data ?? []).filter((d) => d.status === "in_review").length;
  const fresh = requests.filter((d) => dealStatusMeta(d).label === "New").length;
  return (
    <View title="DataHub" sub="Listings waiting for review, what is on sale, and quote requests from the public page, which their sellers answer.">
      <div className="seg" role="tablist" aria-label="DataHub operations" style={{ marginBottom: 16 }}>
        <button type="button" role="tab" className="seg-btn" aria-selected={tab === "listings"} onClick={() => setTab("listings")}>
          Listings{waiting ? ` · ${waiting} to review` : ""}
        </button>
        <button type="button" role="tab" className="seg-btn" aria-selected={tab === "leads"} onClick={() => setTab("leads")}>
          Public quote requests{fresh ? ` · ${fresh} new` : ""}
        </button>
      </div>
      {tab === "listings" ? (
        <Panel flush>
          {queue.isLoading ? <Skeleton rows={4} label="Loading listings" /> : !queue.data?.length ? (
            <Empty title="Nothing to review" hint="Listings appear here when a seller submits one." />
          ) : (
            <DataTable
              rows={queue.data}
              rowKey={(r) => r.id}
              columns={[
                { header: "Dataset", cell: (r) => r.title, sortBy: (r) => r.title, className: "cell-primary" },
                { header: "Seller", cell: (r) => r.owner_name, sortBy: (r) => r.owner_name },
                { header: "From", cell: (r) => (r.source === "contract" ? "Delivered contract" : "Upload") },
                { header: "Files", className: "num", cell: (r) => r.file_count.toLocaleString(), sortBy: (r) => r.file_count },
                {
                  header: "Status",
                  sortBy: (r) => r.status,
                  cell: (r) => {
                    const m = statusMeta(datasetStatus, r.status);
                    return <Pill tone={m.tone}>{m.label}</Pill>;
                  },
                },
                { header: "Submitted", cell: (r) => fmtDate(r.submitted_at), sortBy: (r) => r.submitted_at ?? "" },
                {
                  header: "Actions", hideHeader: true, className: "right",
                  cell: (r) => <Button size="sm" variant={r.status === "in_review" ? "primary" : undefined} onClick={() => setOpen(r.id)}>
                    {r.status === "in_review" ? "Review" : "Open"}
                  </Button>,
                },
              ]}
            />
          )}
        </Panel>
      ) : (
        <Panel flush>
          {deals.isLoading ? <Skeleton rows={4} label="Loading quote requests" /> : requests.length === 0 ? (
            <Empty title="No quote requests yet" hint="People without an account ask on the public dataset pages; each request goes to the dataset's seller." />
          ) : (
            <DataTable
              rows={requests}
              rowKey={(r) => r.id}
              filter={{ label: "Filter requests", placeholder: "Filter by company, email or dataset…", text: (r) => `${r.buyer_name} ${r.contact_email ?? ""} ${r.dataset_title} ${r.seller_name}` }}
              columns={[
                { header: "Received", cell: (r) => fmtDateTime(r.created_at), sortBy: (r) => r.created_at },
                { header: "From", className: "cell-primary", cell: (r) => <>{r.contact_name} · {r.buyer_name}<div className="cell-meta">{r.contact_email}</div></> },
                { header: "Dataset", cell: (r) => r.dataset_title, sortBy: (r) => r.dataset_title },
                { header: "Seller", cell: (r) => r.seller_name, sortBy: (r) => r.seller_name ?? "" },
                {
                  header: "Status",
                  cell: (r) => {
                    const m = dealStatusMeta(r);
                    return <Pill tone={m.tone}>{m.label}</Pill>;
                  },
                },
                { header: "Actions", hideHeader: true, className: "right", cell: (r) => <Link className="btn" data-size="sm" to={`/datahub/deals/${r.id}`}>Open</Link> },
              ]}
            />
          )}
        </Panel>
      )}
      {open && <ReviewDialog id={open} onClose={() => setOpen(null)} />}
    </View>
  );
}

function ReviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const ds = useQuery({ queryKey: ["catalogue-manage", id], queryFn: () => get<Dataset>(`/catalogue/datasets/${id}`) });
  const done = (msg: string) => {
    void qc.invalidateQueries({ queryKey: ["catalogue-review"] });
    void qc.invalidateQueries({ queryKey: ["catalogue-manage", id] });
    toast(msg);
  };
  const approve = useMutation({
    mutationFn: () => post<Dataset>(`/catalogue/datasets/${id}/approve`),
    onSuccess: () => { done("Published"); onClose(); },
  });
  const d = ds.data;
  const samples = d?.samples ?? [];
  return (
    <Dialog
      title={d ? d.title : "Listing"}
      sub={d ? `${d.owner_name} · ${categoryLabel(d.category)} · ${sizeText(d.file_count, d.total_bytes)}` : undefined}
      onClose={onClose}
      size="wide"
      busy={approve.isPending}
      foot={
        d?.status === "in_review" ? (
          <>
            <Button onClick={onClose}>Close</Button>
            <Button variant="danger" onClick={() => setRejecting(true)}>Send back</Button>
            <Button variant="primary" disabled={approve.isPending} onClick={() => approve.mutate()}>
              {approve.isPending ? "Publishing…" : "Publish"}
            </Button>
          </>
        ) : d?.status === "published" ? (
          <>
            <Button onClick={onClose}>Close</Button>
            <Button variant="danger" onClick={() => setWithdrawing(true)}>Withdraw from sale</Button>
          </>
        ) : <Button onClick={onClose}>Close</Button>
      }
    >
      {!d ? <Skeleton rows={5} label="Loading the listing" /> : (
        <>
          <Callout tone="attention" title="Check the samples">
            They go on the public page. The platform records no consent from the people shown in them: send the listing
            back if a sample shows an identifiable person, a child, or a private place.
          </Callout>
          <div className="samplegrid">
            {samples.map((s) => (
              <figure key={s.id}><SamplePreview sample={s} height={140} /><figcaption>{s.filename}</figcaption></figure>
            ))}
            {!samples.length && <p className="muted" style={{ margin: 0 }}>No samples.</p>}
          </div>
          <Dl rows={[
            ["Files", sizeText(d.file_count, d.total_bytes)],
            ["Source", sourceText(d.source)],
            ["Summary", d.summary ?? "—"],
            ["Description", <div key="d" style={{ whiteSpace: "pre-wrap" }}>{d.description || "—"}</div>],
            ["Licensed for", usesText(d.permitted_uses)],
            ["Regions", regionsText(d.regions)],
            ["Price note", d.indicative_price_text || "On request"],
            ["Licence terms", <div key="t" style={{ whiteSpace: "pre-wrap" }}>{d.licence_terms || "—"}</div>],
            ["Submitted", fmtDateTime(d.submitted_at)],
          ]} />
          {approve.isError && <Callout tone="critical" title="Not published">{errText(approve.error)}</Callout>}
          <p className="small" style={{ margin: 0 }}><Link to={`/datahub/${d.slug}`}>Open the full listing</Link></p>
        </>
      )}
      {rejecting && (
        <ReasonDialog
          title="Send this listing back"
          warning="The seller sees your note and can change the listing and submit it again."
          confirmLabel="Send back"
          onConfirm={(reason) => post(`/catalogue/datasets/${id}/reject`, { reason }).then(() => { done("Sent back"); onClose(); })}
          onClose={() => setRejecting(false)}
        />
      )}
      {withdrawing && (
        <ReasonDialog
          title="Withdraw this listing from sale"
          warning="It leaves DataHub. Buyers still negotiating are told; deals already agreed stand."
          confirmLabel="Withdraw"
          onConfirm={(reason) => post(`/catalogue/datasets/${id}/withdraw`, { reason }).then(() => { done("Withdrawn"); onClose(); })}
          onClose={() => setWithdrawing(false)}
        />
      )}
    </Dialog>
  );
}
