// catalogue — browsing, asking for a quote, the deal room, licences.
//
// One flow for both sides of a sale: the buyer asks, the seller quotes, the
// buyer accepts, the seller marks the invoice paid, the files open. The deal
// page shows each side its own next step (my_side from the API). The rules
// themselves are the database's (db/350); a button here only offers a move
// the API would accept.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, get, getText, post } from "@api/client";
import type { Dataset, DatasetDeal, DatasetLicence, PermittedUse } from "@api/types";
import {
  Button, Callout, CheckGroup, DataTable, Dialog, Dl, Empty, Field, inputCls, Panel, Pill, Skeleton,
  textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money } from "@shared/format";
import { can } from "@shared/rbac";
import { ReasonDialog } from "@shared/reason-dialog";
import { datasetStatus, dealStatus, licenceStatus, statusMeta } from "@shared/status";
import { PERMITTED_USES } from "@features/marketplace/vocabularies";
import {
  CATEGORIES, categoryLabel, DatasetCard, EvidencePanel, ItemPreview, regionsText, sizeText, usesText,
} from "./shared";

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** The catalogue's own tabs, so a buyer moves between them without the rail. */
function CatalogueTabs({ current }: { current: "browse" | "deals" | "licences" | "mine" }) {
  const session = useSession();
  const tabs: [string, string, string, boolean][] = [
    ["browse", "/catalogue", "Browse", true],
    ["deals", "/catalogue/deals", "Quotes", can(session, "catalogue.buy") || can(session, "catalogue.quote")],
    ["licences", "/catalogue/licences", "Licences", can(session, "catalogue.buy") || can(session, "catalogue.quote")],
    ["mine", "/catalogue/mine", "My listings", can(session, "catalogue.list")],
  ];
  return (
    <nav className="seg" aria-label="Dataset catalogue" style={{ marginBottom: 16 }}>
      {tabs.filter(([, , , show]) => show).map(([key, to, label]) => (
        <Link key={key} to={to} className="seg-btn" aria-current={current === key ? "page" : undefined}
          style={{ display: "inline-flex", alignItems: "center", textDecoration: "none",
                   fontWeight: current === key ? 600 : undefined }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
export { CatalogueTabs };

/* --- browse ---------------------------------------------------------------- */

export function CataloguePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const list = useQuery({
    queryKey: ["catalogue", q, category],
    queryFn: () => {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (category) p.set("category", category);
      return get<Dataset[]>(`/catalogue/datasets?${p.toString()}`);
    },
  });
  const rows = list.data ?? [];
  return (
    <View
      title="Datasets"
      sub="Finished datasets you can license, reviewed by the platform before they are listed."
      actions={<Link className="btn" to="/datasets">Public page</Link>}
    >
      <CatalogueTabs current="browse" />
      <div className="btnrow" style={{ marginBottom: 12 }}>
        <input className={inputCls} style={{ maxWidth: 320 }} placeholder="Search datasets…" aria-label="Search datasets"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ maxWidth: 220 }} aria-label="Category" value={category}
          onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {list.isLoading ? (
        <Skeleton rows={4} label="Loading datasets" />
      ) : rows.length === 0 ? (
        <Panel><Empty title="No datasets match" hint="New datasets appear once they are reviewed." /></Panel>
      ) : (
        <div className="vgrid">
          {rows.map((d) => (
            <DatasetCard
              key={d.id}
              to={`/catalogue/${d.slug}`}
              title={d.title}
              summary={d.summary}
              seller={d.owner_name}
              category={d.category}
              regions={d.regions}
              uses={d.permitted_uses}
              count={d.item_count}
              bytes={d.total_bytes}
              price={d.indicative_price_text}
              badge={d.is_owner ? <span className="vbadge" data-tone="new">Yours</span> : undefined}
            />
          ))}
        </div>
      )}
    </View>
  );
}

/* --- a dataset, as a buyer sees it ------------------------------------------- */

export function DatasetPage() {
  const { slug = "" } = useParams();
  const session = useSession();
  const [asking, setAsking] = useState(false);
  const ds = useQuery({
    queryKey: ["catalogue-dataset", slug],
    queryFn: () => get<Dataset>(`/catalogue/datasets/by-slug/${slug}`),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1,
  });
  const d = ds.data;
  if (ds.isLoading) return <View title="Dataset"><Skeleton rows={6} label="Loading the dataset" /></View>;
  if (!d) return <View title="Dataset"><Panel><Empty title="Dataset not found" hint="It may have been withdrawn." /></Panel></View>;

  const st = statusMeta(datasetStatus, d.status);
  const open = d.my_deal && ["requested", "quoted"].includes(d.my_deal.status);
  const items = d.items ?? [];
  const version = d.versions?.[d.versions.length - 1];
  return (
    <View
      title={d.title}
      sub={<>{d.owner_name} · {categoryLabel(d.category)} · {sizeText(version?.item_count ?? items.length, version?.total_bytes)}{version ? ` · version ${version.number}` : ""}</>}
      actions={
        <>
          {d.status !== "published" && <Pill tone={st.tone}>{st.label}</Pill>}
          {d.is_owner && <Link className="btn" to={`/catalogue/mine/${d.id}`}>Manage listing</Link>}
          {!d.is_owner && d.my_deal && (
            <Link className="btn" to={`/catalogue/deals/${d.my_deal.id}`}>
              {open ? "Open your quote request" : "Your last quote"}
            </Link>
          )}
          {!d.is_owner && !open && d.status === "published" && can(session, "catalogue.buy") && (
            <Button variant="primary" onClick={() => setAsking(true)}>Request a quote</Button>
          )}
        </>
      }
    >
      <CatalogueTabs current="browse" />
      <div className="pubgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {(d.summary || d.description) && (
            <Panel title="About this dataset">
              {d.summary && <p style={{ margin: 0, fontSize: 15 }}>{d.summary}</p>}
              {d.description && <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{d.description}</div>}
            </Panel>
          )}
          <Panel
            title={items.some((i) => !i.is_sample) ? "Files" : "Samples"}
            sub={items.some((i) => !i.is_sample) ? "Every file of the version you hold" : "Free to view; the full dataset is licensed"}
          >
            {items.length === 0 ? <p className="muted" style={{ margin: 0 }}>No files to show.</p> : (
              <div className="samplegrid">
                {items.slice(0, 60).map((i) => (
                  <figure key={i.id}>
                    <ItemPreview item={i} height={130} />
                    <figcaption>
                      {i.filename}
                      {i.withdrawn_at && <> · <b>withdrawn</b></>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {items.length > 60 && <p className="small muted" style={{ margin: 0 }}>Showing 60 of {items.length}. The licence manifest lists every file.</p>}
          </Panel>
          <Panel title="Licence terms" sub="Set by the seller">
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{d.licence_terms || "Given with the quote."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <Dl rows={[
              ["Price", d.indicative_price_text || "On request"],
              ["Licensed for", usesText(d.permitted_uses)],
              ["Regions", regionsText(d.regions)],
              ["Listed", fmtDate(d.published_at)],
            ]} />
          </Panel>
          <Panel title="How it was made" sub="What the platform recorded">
            <EvidencePanel evidence={d.evidence} />
          </Panel>
          {can(session, "rfp.create") && (
            <Panel title="Need more like this?">
              <p className="small muted" style={{ margin: 0 }}>
                Commission new data to your own brief. Partners bid; the result is yours alone if you ask for exclusivity.
              </p>
              <Link className="btn" to="/requests/new">Commission data</Link>
            </Panel>
          )}
        </div>
      </div>
      {asking && <AskQuoteDialog dataset={d} onClose={() => setAsking(false)} />}
    </View>
  );
}

function AskQuoteDialog({ dataset, onClose }: { dataset: Dataset; onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [use, setUse] = useState("");
  const [uses, setUses] = useState<PermittedUse[]>(dataset.permitted_uses.slice(0, 1));
  const [message, setMessage] = useState("");
  const ask = useMutation({
    mutationFn: () =>
      post<DatasetDeal>(`/catalogue/datasets/${dataset.id}/deals`, {
        intended_use: use.trim(), requested_uses: uses, message: message.trim() || null,
      }),
    onSuccess: (deal) => {
      void qc.invalidateQueries({ queryKey: ["catalogue-dataset"] });
      void qc.invalidateQueries({ queryKey: ["catalogue-deals"] });
      navigate(`/catalogue/deals/${deal.id}`);
    },
  });
  return (
    <Dialog
      title="Request a quote"
      sub={dataset.title}
      onClose={onClose}
      busy={ask.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={use.trim().length < 3 || ask.isPending} onClick={() => ask.mutate()}>
            {ask.isPending ? "Sending…" : "Send to the seller"}
          </Button>
        </>
      }
    >
      <p className="small muted" style={{ margin: 0 }}>
        {dataset.owner_name} will reply with a price and terms. Nothing is owed until you accept a quote.
      </p>
      <Field label="What will you use it for?" required>
        {(id) => <textarea id={id} className={textareaCls} value={use} onChange={(e) => setUse(e.target.value)} />}
      </Field>
      <CheckGroup
        label="Uses you need licensed"
        options={PERMITTED_USES.filter((o) => dataset.permitted_uses.includes(o.value))}
        value={uses}
        onChange={setUses}
      />
      <Field label="Anything else for the seller">
        {(id) => <textarea id={id} className={textareaCls} value={message} onChange={(e) => setMessage(e.target.value)} />}
      </Field>
      {ask.isError && <Callout tone="critical" title="Not sent">{errText(ask.error)}</Callout>}
    </Dialog>
  );
}

/* --- quotes ------------------------------------------------------------------ */

export function DealsPage() {
  const deals = useQuery({ queryKey: ["catalogue-deals"], queryFn: () => get<DatasetDeal[]>("/catalogue/deals") });
  const rows = deals.data ?? [];
  return (
    <View title="Quotes" sub="Quote requests you have made, and those made to you as a seller.">
      <CatalogueTabs current="deals" />
      <Panel flush>
        {deals.isLoading ? <Skeleton rows={4} label="Loading quotes" /> : rows.length === 0 ? (
          <Empty title="No quotes yet" hint="Ask for one from any dataset's page." action={<Link className="btn" to="/catalogue">Browse datasets</Link>} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            filter={{ label: "Filter quotes", placeholder: "Filter by dataset or organisation…", text: (r) => `${r.dataset_title} ${r.buyer_name} ${r.seller_name}` }}
            columns={[
              { header: "Dataset", cell: (r) => r.dataset_title, sortBy: (r) => r.dataset_title, className: "cell-primary" },
              { header: "You are", cell: (r) => (r.my_side === "buyer" ? "Buying" : r.my_side === "seller" ? "Selling" : "Operations") },
              { header: "With", cell: (r) => (r.my_side === "buyer" ? r.seller_name : r.buyer_name) },
              {
                header: "Status",
                sortBy: (r) => r.status,
                cell: (r) => {
                  const m = statusMeta(dealStatus, r.status);
                  return <Pill tone={m.tone}>{m.label}</Pill>;
                },
              },
              { header: "Quote", className: "num", cell: (r) => (r.quote_amount ? money(r.quote_amount, r.currency ?? "USD") : "—") },
              { header: "Asked", cell: (r) => fmtDate(r.created_at), sortBy: (r) => r.created_at },
              { header: "Actions", hideHeader: true, className: "right", cell: (r) => <Link className="btn" data-size="sm" to={`/catalogue/deals/${r.id}`}>Open</Link> },
            ]}
          />
        )}
      </Panel>
    </View>
  );
}

export function DealPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [quoting, setQuoting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const deal = useQuery({ queryKey: ["catalogue-deal", id], queryFn: () => get<DatasetDeal>(`/catalogue/deals/${id}`) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["catalogue-deal", id] });
    void qc.invalidateQueries({ queryKey: ["catalogue-deals"] });
    void qc.invalidateQueries({ queryKey: ["catalogue-licences"] });
  };
  const withdraw = useMutation({
    mutationFn: () => post(`/catalogue/deals/${id}/withdraw`),
    onSuccess: () => { refresh(); toast("Quote request withdrawn"); },
    onError: (e) => toast("Could not withdraw", errText(e), "critical"),
  });
  const k = deal.data;
  if (deal.isLoading) return <View title="Quote"><Skeleton rows={5} label="Loading the quote" /></View>;
  if (!k) return <View title="Quote"><Panel><Empty title="Quote not found" /></Panel></View>;

  const st = statusMeta(dealStatus, k.status);
  const live = ["requested", "quoted"].includes(k.status);
  const seller = k.my_side === "seller";
  const buyer = k.my_side === "buyer";
  return (
    <View
      title={`Quote · ${k.dataset_title}`}
      sub={<>{buyer ? `From ${k.seller_name}` : `For ${k.buyer_name}`} · version {k.version_number}</>}
      actions={<Pill tone={st.tone}>{st.label}</Pill>}
    >
      <CatalogueTabs current="deals" />
      <div className="pubgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel title="The request" sub={`Asked ${fmtDateTime(k.created_at)}`}>
            <Dl rows={[
              ["Dataset", <Link key="d" to={`/catalogue/${k.dataset_slug}`}>{k.dataset_title}</Link>],
              ["Buyer", k.buyer_name ?? "—"],
              ["Intended use", k.intended_use],
              ["Uses asked for", usesText(k.requested_uses)],
              ["Message", k.message || "—"],
            ]} />
          </Panel>
          <Panel title="The quote" sub={k.quoted_at ? `Sent ${fmtDateTime(k.quoted_at)}` : "Not quoted yet"}>
            {k.quote_amount ? (
              <Dl rows={[
                ["Price", <b key="p">{money(k.quote_amount, k.currency ?? "USD")}</b>],
                ["Uses covered", usesText(k.quote_uses)],
                ["Terms", <div key="t" style={{ whiteSpace: "pre-wrap" }}>{k.quote_terms || "The listing's licence terms"}</div>],
              ]} />
            ) : <p className="muted" style={{ margin: 0 }}>{seller ? "Send a price and terms." : "The seller has not replied yet."}</p>}
            {k.decision_note && <Callout tone="neutral" title="Note">{k.decision_note}</Callout>}
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Next step">
            {seller && live && (
              <div className="btnrow">
                <Button variant="primary" onClick={() => setQuoting(true)}>{k.status === "quoted" ? "Revise the quote" : "Send a quote"}</Button>
                <Button variant="danger" onClick={() => setDeclining(true)}>Decline</Button>
              </div>
            )}
            {buyer && k.status === "quoted" && (
              <div className="btnrow">
                <Button variant="primary" onClick={() => setAccepting(true)}>Accept the quote</Button>
                <Button onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>Withdraw</Button>
              </div>
            )}
            {buyer && k.status === "requested" && (
              <>
                <p className="small muted" style={{ margin: 0 }}>Waiting for {k.seller_name} to quote.</p>
                <Button onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>Withdraw the request</Button>
              </>
            )}
            {k.status === "accepted" && (
              <>
                <p className="small" style={{ margin: 0 }}>
                  {k.licence_status === "active"
                    ? "The licence is active."
                    : seller
                      ? "Invoice the buyer, then mark the licence paid on the Licences tab. The files open to them then."
                      : "The seller will invoice you. The files open once they mark it paid."}
                </p>
                <Link className="btn" to="/catalogue/licences">Licences</Link>
              </>
            )}
            {!live && k.status !== "accepted" && <p className="small muted" style={{ margin: 0 }}>Nothing more to do.</p>}
          </Panel>
        </div>
      </div>
      {quoting && <QuoteDialog deal={k} onClose={() => setQuoting(false)} onDone={() => { refresh(); toast("Quote sent"); }} />}
      {declining && (
        <ReasonDialog
          title="Decline this request"
          warning="The buyer is told. They can ask again later."
          confirmLabel="Decline"
          minLength={0}
          onConfirm={(note) => post(`/catalogue/deals/${id}/decline`, { note }).then(refresh)}
          onClose={() => setDeclining(false)}
        />
      )}
      {accepting && <AcceptDialog deal={k} onClose={() => setAccepting(false)} onDone={() => { refresh(); toast("Quote accepted", "The seller will invoice you."); }} />}
    </View>
  );
}

function QuoteDialog({ deal, onClose, onDone }: { deal: DatasetDeal; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(deal.quote_amount ?? "");
  const [currency, setCurrency] = useState(deal.currency ?? "USD");
  const [terms, setTerms] = useState(deal.quote_terms ?? "");
  const [uses, setUses] = useState<PermittedUse[]>(deal.quote_uses.length ? deal.quote_uses : deal.requested_uses);
  const send = useMutation({
    mutationFn: () => post(`/catalogue/deals/${deal.id}/quote`, { amount, currency, terms: terms.trim() || null, uses }),
    onSuccess: () => { onDone(); onClose(); },
  });
  const ok = Number(amount) >= 0 && amount.trim() !== "" && /^[A-Za-z]{3}$/.test(currency) && uses.length > 0;
  return (
    <Dialog
      title={deal.status === "quoted" ? "Revise the quote" : "Send a quote"}
      sub={`${deal.dataset_title} · for ${deal.buyer_name}`}
      onClose={onClose}
      busy={send.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ok || send.isPending} onClick={() => send.mutate()}>
            {send.isPending ? "Sending…" : "Send the quote"}
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Price" required>{(id) => <input id={id} className={inputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
        <Field label="Currency" required hint="Three letters, e.g. USD or INR">
          {(id) => <input id={id} className={inputCls} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />}
        </Field>
      </div>
      <CheckGroup label="Uses the licence covers" options={PERMITTED_USES} value={uses} onChange={setUses} />
      <Field label="Terms" hint="Anything beyond the listing's licence terms: delivery, exclusivity window, what happens to withdrawn files.">
        {(id) => <textarea id={id} className={textareaCls} value={terms} onChange={(e) => setTerms(e.target.value)} />}
      </Field>
      {send.isError && <Callout tone="critical" title="Not sent">{errText(send.error)}</Callout>}
    </Dialog>
  );
}

function AcceptDialog({ deal, onClose, onDone }: { deal: DatasetDeal; onClose: () => void; onDone: () => void }) {
  const accept = useMutation({
    mutationFn: () => post(`/catalogue/deals/${deal.id}/accept`),
    onSuccess: () => { onDone(); onClose(); },
  });
  return (
    <Dialog
      title="Accept this quote?"
      sub={deal.dataset_title}
      onClose={onClose}
      busy={accept.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending ? "Accepting…" : `Accept ${money(deal.quote_amount, deal.currency ?? "USD")}`}
          </Button>
        </>
      }
    >
      <Dl rows={[
        ["Price", money(deal.quote_amount, deal.currency ?? "USD")],
        ["Uses covered", usesText(deal.quote_uses)],
        ["Terms", <div key="t" style={{ whiteSpace: "pre-wrap" }}>{deal.quote_terms || "The listing's licence terms"}</div>],
      ]} />
      <p className="small muted" style={{ margin: 0 }}>
        Accepting issues a licence on these terms for version {deal.version_number}. {deal.seller_name} then invoices you;
        payment is between you and them. The files open once they mark it paid.
      </p>
      {accept.isError && <Callout tone="critical" title="Not accepted">{errText(accept.error)}</Callout>}
    </Dialog>
  );
}

/* --- licences ------------------------------------------------------------------ */

export function LicencesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [paying, setPaying] = useState<DatasetLicence | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const lic = useQuery({ queryKey: ["catalogue-licences"], queryFn: () => get<DatasetLicence[]>("/catalogue/licences") });
  const rows = lic.data ?? [];
  const download = async (l: DatasetLicence) => {
    try {
      const csv = await getText(`/catalogue/licences/${l.id}/manifest`);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${l.dataset_slug}-v${l.version_number}-manifest.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast("Could not download the manifest", errText(e), "critical");
    }
  };
  const withdrawnNotices = rows.filter((l) => l.my_side === "buyer" && l.withdrawn_count > 0);
  return (
    <View title="Licences" sub="Datasets you have licensed, and licences you have issued as a seller.">
      <CatalogueTabs current="licences" />
      {withdrawnNotices.length > 0 && (
        <Callout tone="attention" title="Files withdrawn from datasets you hold">
          {withdrawnNotices.map((l) => (
            <div key={l.id}>
              {l.withdrawn_count} file{l.withdrawn_count === 1 ? "" : "s"} withdrawn from {l.dataset_title}.{" "}
              <button type="button" className="linkbtn" onClick={() => setOpen(l.id)} style={{ background: "none", border: 0, padding: 0, color: "var(--accent)", cursor: "pointer" }}>
                See which, and why
              </button>
            </div>
          ))}
        </Callout>
      )}
      <Panel flush>
        {lic.isLoading ? <Skeleton rows={4} label="Loading licences" /> : rows.length === 0 ? (
          <Empty title="No licences yet" hint="A licence is issued when a quote is accepted." />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { header: "Dataset", cell: (r) => <Link to={`/catalogue/${r.dataset_slug}`}>{r.dataset_title}</Link>, sortBy: (r) => r.dataset_title, className: "cell-primary" },
              { header: "Version", cell: (r) => `v${r.version_number}`, className: "num" },
              { header: "You are", cell: (r) => (r.my_side === "buyer" ? "Buyer" : r.my_side === "seller" ? "Seller" : "Operations") },
              { header: "With", cell: (r) => (r.my_side === "buyer" ? r.seller_name : r.buyer_name) },
              { header: "Amount", className: "num", cell: (r) => money(r.amount, r.currency), sortBy: (r) => Number(r.amount) },
              {
                header: "Status",
                cell: (r) => {
                  const m = statusMeta(licenceStatus, r.status);
                  return <>
                    <Pill tone={m.tone}>{m.label}</Pill>
                    {r.withdrawn_count > 0 && <> <Pill tone="attention">{r.withdrawn_count} withdrawn</Pill></>}
                  </>;
                },
              },
              { header: "Issued", cell: (r) => fmtDate(r.issued_at), sortBy: (r) => r.issued_at },
              {
                header: "Actions",
                hideHeader: true,
                className: "right",
                cell: (r) => (
                  <div className="rowactions">
                    {r.my_side === "seller" && r.status === "awaiting_payment" && (
                      <Button size="sm" variant="primary" onClick={() => setPaying(r)}>Mark paid</Button>
                    )}
                    {r.status === "active" && r.my_side !== "seller" && (
                      <Button size="sm" onClick={() => void download(r)}>Manifest</Button>
                    )}
                    <Button size="sm" onClick={() => setOpen(r.id)}>Details</Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Panel>
      {paying && (
        <MarkPaidDialog
          licence={paying}
          onClose={() => setPaying(null)}
          onDone={() => { void qc.invalidateQueries({ queryKey: ["catalogue-licences"] }); toast("Marked paid", "The buyer can now download the files."); }}
        />
      )}
      {open && <LicenceDialog id={open} onClose={() => setOpen(null)} />}
    </View>
  );
}

function MarkPaidDialog({ licence, onClose, onDone }: { licence: DatasetLicence; onClose: () => void; onDone: () => void }) {
  const [inv, setInv] = useState("");
  const paid = useMutation({
    mutationFn: () => post(`/catalogue/licences/${licence.id}/paid`, { invoice_number: inv.trim() || null }),
    onSuccess: () => { onDone(); onClose(); },
  });
  return (
    <Dialog
      title="Mark this licence paid?"
      sub={`${licence.dataset_title} · ${licence.buyer_name}`}
      onClose={onClose}
      busy={paid.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={paid.isPending} onClick={() => paid.mutate()}>
            {paid.isPending ? "Saving…" : `Paid: ${money(licence.amount, licence.currency)}`}
          </Button>
        </>
      }
    >
      <p className="small muted" style={{ margin: 0 }}>
        Do this once the money has arrived. The buyer can then download every file of version {licence.version_number}.
        It cannot be undone, though the licence can be revoked.
      </p>
      <Field label="Your invoice number">{(id) => <input id={id} className={inputCls} value={inv} onChange={(e) => setInv(e.target.value)} />}</Field>
      {paid.isError && <Callout tone="critical" title="Not saved">{errText(paid.error)}</Callout>}
    </Dialog>
  );
}

function LicenceDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const l = useQuery({ queryKey: ["catalogue-licence", id], queryFn: () => get<DatasetLicence>(`/catalogue/licences/${id}`) });
  const d = l.data;
  return (
    <Dialog title="Licence" sub={d?.dataset_title} onClose={onClose} size="wide" foot={<Button onClick={onClose}>Close</Button>}>
      {!d ? <Skeleton rows={4} label="Loading the licence" /> : (
        <>
          <Dl rows={[
            ["Dataset", `${d.dataset_title} · version ${d.version_number} · ${sizeText(d.item_count, d.total_bytes)}`],
            ["Buyer", d.buyer_name ?? "—"],
            ["Seller", d.seller_name ?? "—"],
            ["Amount", money(d.amount, d.currency)],
            ["Licensed uses", usesText(d.permitted_uses)],
            ["Status", statusMeta(licenceStatus, d.status).label + (d.paid_at ? ` · paid ${fmtDate(d.paid_at)}` : "")],
            ["Invoice", d.invoice_number || "—"],
            ["Terms", <div key="t" style={{ whiteSpace: "pre-wrap" }}>{d.terms_snapshot || "The listing's licence terms at the time"}</div>],
            ["Listing", statusMeta(datasetStatus, d.dataset_status).label],
          ]} />
          {(d.withdrawn_items ?? []).length > 0 && (
            <Callout tone="attention" title="Withdrawn since you licensed it">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {d.withdrawn_items!.map((w) => (
                  <li key={w.filename}><b>{w.filename}</b> — {w.withdrawn_reason} ({fmtDate(w.withdrawn_at)})</li>
                ))}
              </ul>
              <p className="small" style={{ margin: "6px 0 0" }}>Your licence terms say what to do with copies you hold.</p>
            </Callout>
          )}
        </>
      )}
    </Dialog>
  );
}
