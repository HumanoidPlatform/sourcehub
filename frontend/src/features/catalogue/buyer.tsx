// catalogue — browsing, asking for a quote, and the deal room with its chat.
//
// One flow for both sides of a sale: the buyer asks (saying how many files,
// if not all), the two agree in the deal's chat, the seller quotes, the buyer
// accepts, and the seller marks the deal paid and then delivered. The files
// change hands outside the platform. The deal page shows each side its own
// next step (my_side from the API); the rules themselves are the database's
// (db/420), and a button here only offers a move the API would accept. A
// request from the public page is a deal too (db/440): the seller replies by
// email from its page and closes it.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, get, post } from "@api/client";
import type { Dataset, DatasetDeal, DealMessage, InvoiceRow, PermittedUse } from "@api/types";
import {
  Button, Callout, CheckGroup, DataTable, Dialog, Dl, Empty, Field, inputCls, Panel, Pill, Skeleton,
  textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money } from "@shared/format";
import { can } from "@shared/rbac";
import { ReasonDialog } from "@shared/reason-dialog";
import { InvoiceActions } from "@shared/invoices";
import { datasetStatus, invoiceStatus, statusMeta } from "@shared/status";
import { PERMITTED_USES } from "@features/marketplace/vocabularies";
import {
  CATEGORIES, categoryLabel, DatasetCard, dealStatusMeta, quantityText, regionsText, SamplePreview, sizeText,
  sourceText,
  usesText,
} from "./shared";

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** The catalogue's own tabs, so a buyer moves between them without the rail. */
function CatalogueTabs({ current }: { current: "browse" | "deals" | "mine" }) {
  const session = useSession();
  const tabs: [string, string, string, boolean][] = [
    ["browse", "/datahub", "Browse", true],
    ["deals", "/datahub/deals", "Quotes", can(session, "catalogue.buy") || can(session, "catalogue.quote")],
    ["mine", "/datahub/mine", "My listings", can(session, "catalogue.list")],
  ];
  return (
    <nav className="seg" aria-label="DataHub" style={{ marginBottom: 16 }}>
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

/** Whether this workspace takes part in DataHub at all. An aggregator
 *  does not (0048): it hands captures to the partner, who sells. */
export function inCatalogue(session: ReturnType<typeof useSession>): boolean {
  return ["catalogue.buy", "catalogue.list", "catalogue.quote", "catalogue.review"].some((c) => can(session, c));
}

/** What a workspace outside DataHub sees if it reaches a DataHub page by URL. */
export function NotInCatalogue() {
  return (
    <View title="DataHub">
      <Panel><Empty title="DataHub is not part of your workspace" hint="Delivery partners and clients buy and sell datasets here." /></Panel>
    </View>
  );
}

/* --- browse ---------------------------------------------------------------- */

export function CataloguePage() {
  const allowed = inCatalogue(useSession());
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const list = useQuery({
    queryKey: ["catalogue", q, category],
    enabled: allowed,
    queryFn: () => {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (category) p.set("category", category);
      return get<Dataset[]>(`/catalogue/datasets?${p.toString()}`);
    },
  });
  const rows = list.data ?? [];
  if (!allowed) return <NotInCatalogue />;
  return (
    <View
      title="DataHub"
      sub="Finished datasets, reviewed by the platform before they are listed. Ask the seller for the files you need."
      actions={<Link className="btn" to="/datahub/public">Public page</Link>}
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
              to={`/datahub/${d.slug}`}
              title={d.title}
              summary={d.summary}
              seller={d.owner_name}
              category={d.category}
              regions={d.regions}
              uses={d.permitted_uses}
              count={d.file_count}
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
  const samples = d.samples ?? [];
  return (
    <View
      title={d.title}
      sub={<>{d.owner_name} · {categoryLabel(d.category)} · {sizeText(d.file_count, d.total_bytes)}</>}
      actions={
        <>
          {d.status !== "published" && <Pill tone={st.tone}>{st.label}</Pill>}
          {d.is_owner && <Link className="btn" to={`/datahub/mine/${d.id}`}>Manage listing</Link>}
          {!d.is_owner && d.my_deal && (
            <Link className="btn" to={`/datahub/deals/${d.my_deal.id}`}>
              {open ? "Open your quote request" : "Your last deal"}
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
          <Panel title="Samples" sub="A few files from the dataset, free to view">
            {samples.length === 0 ? <p className="muted" style={{ margin: 0 }}>No samples to show.</p> : (
              <div className="samplegrid">
                {samples.map((s) => (
                  <figure key={s.id}>
                    <SamplePreview sample={s} height={130} />
                    <figcaption>{s.filename}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Licence terms" sub="Set by the seller">
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{d.licence_terms || "Given with the quote."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <Dl rows={[
              ["Files", sizeText(d.file_count, d.total_bytes)],
              ["Price", d.indicative_price_text || "On request"],
              ["Licensed for", usesText(d.permitted_uses)],
              ["Regions", regionsText(d.regions)],
              ["Source", sourceText(d.source)],
              ["Listed", fmtDate(d.published_at)],
            ]} />
            <p className="small muted" style={{ margin: 0 }}>
              Ask for all of it or only some: you agree the number of files and the price with the seller, who hands the
              files over to you directly.
            </p>
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
  const [all, setAll] = useState(true);
  const [qty, setQty] = useState("");
  const [message, setMessage] = useState("");
  const n = Number(qty);
  const qtyOk = all || (Number.isInteger(n) && n > 0 && (!dataset.file_count || n <= dataset.file_count));
  const ask = useMutation({
    mutationFn: () =>
      post<DatasetDeal>(`/catalogue/datasets/${dataset.id}/deals`, {
        intended_use: use.trim(), requested_uses: uses,
        requested_quantity: all ? null : n,
        message: message.trim() || null,
      }),
    onSuccess: (deal) => {
      void qc.invalidateQueries({ queryKey: ["catalogue-dataset"] });
      void qc.invalidateQueries({ queryKey: ["catalogue-deals"] });
      navigate(`/datahub/deals/${deal.id}`);
    },
  });
  return (
    <Dialog
      title="Request a quote"
      sub={`${dataset.title} · ${sizeText(dataset.file_count, dataset.total_bytes)}`}
      onClose={onClose}
      busy={ask.isPending}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={use.trim().length < 3 || !qtyOk || ask.isPending} onClick={() => ask.mutate()}>
            {ask.isPending ? "Sending…" : "Send to the seller"}
          </Button>
        </>
      }
    >
      <p className="small muted" style={{ margin: 0 }}>
        {dataset.owner_name} replies in the deal's chat and then sends a quote. Nothing is owed until you accept one.
      </p>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>How many files</legend>
        <label className="checkline">
          <input type="radio" name="qty" checked={all} onChange={() => setAll(true)} />
          <span>{quantityText(null, dataset.file_count)}</span>
        </label>
        <label className="checkline">
          <input type="radio" name="qty" checked={!all} onChange={() => setAll(false)} />
          <span>Some of it</span>
        </label>
        {!all && (
          <Field label="Number of files" required hint={dataset.file_count ? `Up to ${dataset.file_count.toLocaleString()}` : undefined}>
            {(id) => <input id={id} className={inputCls} inputMode="numeric" style={{ maxWidth: 200 }} value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} />}
          </Field>
        )}
      </fieldset>
      <Field label="What will you use it for?" required>
        {(id) => <textarea id={id} className={textareaCls} value={use} onChange={(e) => setUse(e.target.value)} />}
      </Field>
      <CheckGroup
        label="Uses you need licensed"
        options={PERMITTED_USES.filter((o) => dataset.permitted_uses.includes(o.value))}
        value={uses}
        onChange={setUses}
      />
      <Field label="First message to the seller" hint="Which files, how you want them delivered, deadlines. It opens the chat.">
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
    <View title="Quotes" sub="Quote requests you have made, and those made to you as a seller, from the console or the public page.">
      <CatalogueTabs current="deals" />
      <Panel flush>
        {deals.isLoading ? <Skeleton rows={4} label="Loading quotes" /> : rows.length === 0 ? (
          <Empty title="No quotes yet" hint="Ask for one from any dataset's page." action={<Link className="btn" to="/datahub">Browse datasets</Link>} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            filter={{ label: "Filter quotes", placeholder: "Filter by dataset or organisation…", text: (r) => `${r.dataset_title} ${r.buyer_name} ${r.seller_name} ${r.contact_email ?? ""}` }}
            columns={[
              { header: "Dataset", cell: (r) => r.dataset_title, sortBy: (r) => r.dataset_title, className: "cell-primary" },
              { header: "You are", cell: (r) => (r.my_side === "buyer" ? "Buying" : r.my_side === "seller" ? "Selling" : "Operations") },
              {
                header: "With",
                cell: (r) => r.my_side === "buyer" ? r.seller_name : (
                  <>{r.buyer_name}{r.channel === "public" && <> <Pill tone="neutral">Public page</Pill></>}</>
                ),
              },
              { header: "Files", className: "num", cell: (r) => quantityText(r.quote_quantity ?? r.requested_quantity, r.file_count) },
              {
                header: "Status",
                sortBy: (r) => r.status,
                cell: (r) => {
                  const m = dealStatusMeta(r);
                  return <Pill tone={m.tone}>{m.label}</Pill>;
                },
              },
              { header: "Quote", className: "num", cell: (r) => (r.quote_amount ? money(r.quote_amount, r.currency ?? "USD") : "—") },
              { header: "Updated", cell: (r) => fmtDate(r.updated_at), sortBy: (r) => r.updated_at },
              { header: "Actions", hideHeader: true, className: "right", cell: (r) => <Link className="btn" data-size="sm" to={`/datahub/deals/${r.id}`}>Open</Link> },
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
  };
  const withdraw = useMutation({
    mutationFn: () => post(`/catalogue/deals/${id}/withdraw`),
    onSuccess: () => { refresh(); toast("Quote request withdrawn"); },
    onError: (e) => toast("Could not withdraw", errText(e), "critical"),
  });
  const delivered = useMutation({
    mutationFn: () => post(`/catalogue/deals/${id}/delivered`),
    onSuccess: () => { refresh(); toast("Marked delivered", "The buyer has been told."); },
    onError: (e) => toast("Not saved", errText(e), "critical"),
  });
  const k = deal.data;
  if (deal.isLoading) return <View title="Quote"><Skeleton rows={5} label="Loading the quote" /></View>;
  if (!k) return <View title="Quote"><Panel><Empty title="Quote not found" /></Panel></View>;

  const st = dealStatusMeta(k);
  const live = ["requested", "quoted"].includes(k.status);
  const seller = k.my_side === "seller";
  const buyer = k.my_side === "buyer";
  if (k.channel === "public") {
    return <PublicRequestPage deal={k} onChanged={refresh} />;
  }
  return (
    <View
      title={`Quote · ${k.dataset_title}`}
      sub={buyer ? `From ${k.seller_name}` : `For ${k.buyer_name}`}
      actions={<Pill tone={st.tone}>{st.label}</Pill>}
    >
      <CatalogueTabs current="deals" />
      <div className="pubgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <DealChat deal={k} />
          <Panel title="The request" sub={`Asked ${fmtDateTime(k.created_at)}`}>
            <Dl rows={[
              ["Dataset", <Link key="d" to={`/datahub/${k.dataset_slug}`}>{k.dataset_title}</Link>],
              ["Buyer", k.buyer_name ?? "—"],
              ["Files asked for", quantityText(k.requested_quantity, k.file_count)],
              ["Intended use", k.intended_use],
              ["Uses asked for", usesText(k.requested_uses)],
            ]} />
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="The quote" sub={k.quoted_at ? `Sent ${fmtDateTime(k.quoted_at)}` : "Not quoted yet"}>
            {k.quote_amount ? (
              <Dl rows={[
                ["Price", <b key="p">{money(k.quote_amount, k.currency ?? "USD")}</b>],
                ["Files", quantityText(k.quote_quantity, k.file_count)],
                ["Uses covered", usesText(k.quote_uses)],
                ["Terms", <div key="t" style={{ whiteSpace: "pre-wrap" }}>{k.quote_terms || "The listing's licence terms"}</div>],
                ...(k.paid_at ? [["Paid", `${fmtDate(k.paid_at)}${k.invoice_number ? ` · ${k.invoice_number}` : ""}`] as [string, string]] : []),
                ...(k.delivered_at ? [["Delivered", fmtDate(k.delivered_at)] as [string, string]] : []),
              ]} />
            ) : <p className="muted" style={{ margin: 0 }}>{seller ? "Agree the files and price in the chat, then send a quote." : "The seller has not quoted yet."}</p>}
            {k.decision_note && <Callout tone="neutral" title="Note">{k.decision_note}</Callout>}
          </Panel>
          {k.invoice_id && <DealInvoice deal={k} />}
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
            {k.status === "accepted" && (seller ? (
              <p className="small" style={{ margin: 0 }}>
                {k.invoice_status === "paid"
                  ? `The buyer marked ${k.invoice_reference} paid. Acknowledge it once the money has arrived; the deal is then paid.`
                  : `The platform issued ${k.invoice_reference ?? "an invoice"} to the buyer. Once they mark it paid, acknowledge the payment.`}
              </p>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                {k.invoice_status === "paid"
                  ? "You marked the invoice paid. The seller acknowledges once the money arrives."
                  : `Pay ${k.seller_name} as invoiced, then mark ${k.invoice_reference ?? "the invoice"} paid.`}
              </p>
            ))}
            {k.status === "paid" && (seller ? (
              <>
                <p className="small" style={{ margin: 0 }}>
                  Hand the {quantityText(k.quote_quantity, k.file_count).toLowerCase()} over to the buyer, then mark the deal delivered.
                </p>
                <Button variant="primary" onClick={() => delivered.mutate()} disabled={delivered.isPending}>Mark delivered</Button>
              </>
            ) : <p className="small" style={{ margin: 0 }}>Paid. The seller will hand the files over to you directly.</p>)}
            {k.status === "delivered" && <p className="small" style={{ margin: 0 }}>Delivered on {fmtDate(k.delivered_at)}. Nothing more to do.</p>}
            {(k.status === "declined" || k.status === "withdrawn") && <p className="small muted" style={{ margin: 0 }}>Nothing more to do.</p>}
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
      {accepting && <AcceptDialog deal={k} onClose={() => setAccepting(false)} onDone={() => { refresh(); toast("Quote accepted", "An invoice has been issued to you."); }} />}
    </View>
  );
}

/** The deal's invoice (db/450), issued when the buyer accepted: the buyer
 *  marks it paid, the seller acknowledges, and that makes the deal paid. The
 *  buttons are Billing's own. */
function DealInvoice({ deal }: { deal: DatasetDeal }) {
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => get<InvoiceRow[]>("/invoices") });
  const i = (invoices.data ?? []).find((x) => x.id === deal.invoice_id);
  const m = statusMeta(invoiceStatus, deal.invoice_status ?? "issued");
  return (
    <Panel title="Invoice" sub={deal.invoice_reference ?? undefined}>
      {invoices.isLoading ? <Skeleton rows={2} label="Loading the invoice" /> : !i ? (
        <p className="muted" style={{ margin: 0 }}>The invoice is on the Billing page.</p>
      ) : (
        <>
          <Dl rows={[
            ["Amount", <b key="a">{money(i.amount, i.currency)}</b>],
            ["From", i.partner_name ?? "—"],
            ["Billed to", i.client_name ?? "—"],
            ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
            ...(i.paid_at ? [["Marked paid", `${fmtDateTime(i.paid_at)}${i.payment_reference ? ` · ref ${i.payment_reference}` : ""}`] as [string, string]] : []),
            ...(i.acknowledged_at ? [["Acknowledged", fmtDateTime(i.acknowledged_at)] as [string, string]] : []),
          ]} />
          <div className="btnrow" style={{ marginTop: 8 }}><InvoiceActions i={i} /></div>
        </>
      )}
    </Panel>
  );
}

/** The conversation on a deal. Buyer and seller write; Ops read. It refreshes
 *  while the page is open, so the other side's replies appear by themselves. */
function DealChat({ deal }: { deal: DatasetDeal }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const messages = useQuery({
    queryKey: ["catalogue-deal-messages", deal.id],
    queryFn: () => get<DealMessage[]>(`/catalogue/deals/${deal.id}/messages`),
    refetchInterval: 15_000,
  });
  const rows = messages.data ?? [];
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [rows.length]);
  const send = useMutation({
    mutationFn: () => post<DealMessage>(`/catalogue/deals/${deal.id}/messages`, { body: body.trim() }),
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["catalogue-deal-messages", deal.id] });
      void qc.invalidateQueries({ queryKey: ["catalogue-deal", deal.id] });
    },
  });
  const closed = deal.status === "declined" || deal.status === "withdrawn";
  const party = deal.my_side !== "operations";
  const emailed = deal.channel === "public";
  return (
    <Panel
      title={emailed ? "Replies" : "Chat"}
      sub={emailed
        ? (party
          ? `Each reply is emailed to ${deal.contact_email}, with your address to reply to: their answer comes to your inbox`
          : "The seller's replies, emailed to the person who asked; operations read only")
        : party ? `With ${deal.my_side === "buyer" ? deal.seller_name : deal.buyer_name}: agree which files, how many, and the price` : "Between the buyer and the seller; operations read only"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }} aria-live="polite">
        {messages.isLoading ? <Skeleton rows={3} label="Loading the chat" /> : rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No messages yet.</p>
        ) : rows.map((m) => (
          <div key={m.id} style={{
            alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "80%",
            background: m.mine ? "var(--accent-soft, var(--surface-2))" : "var(--surface-2)",
            border: "1px solid var(--line)", borderRadius: "var(--r-control)", padding: "8px 10px",
          }}>
            <div className="small muted">
              {m.sender_name} · {fmtDateTime(m.created_at)}
              {m.emailed_to && (
                <>
                  {" · "}
                  {m.email_status === "queued" ? "emailing" : m.email_status === "failed" ? "email failed to" : "emailed to"}
                  {" "}{m.emailed_to}
                  {m.email_status === "failed" && m.email_reason ? ` (${m.email_reason})` : ""}
                </>
              )}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {party && !closed && (
        <form
          style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) send.mutate();
          }}
        >
          <textarea className={textareaCls} aria-label={emailed ? "Reply by email" : "Message"}
            placeholder={emailed ? "Write your reply…" : "Write a message…"} maxLength={4000}
            value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="btnrow">
            <Button type="submit" variant="primary" disabled={!body.trim() || send.isPending}>
              {send.isPending ? "Sending…" : emailed ? "Send email" : "Send"}
            </Button>
            {send.isError && <span className="small" style={{ color: "var(--t-critical)" }}>{errText(send.error)}</span>}
          </div>
        </form>
      )}
      {closed && <p className="small muted" style={{ margin: "8px 0 0" }}>
        {emailed ? "This request is closed; no further reply can be sent." : "This deal is closed; the chat is read-only."}
      </p>}
    </Panel>
  );
}

/** A quote request from the public page (db/440): someone without an account.
 *  The seller replies by email from here and closes it; it is never quoted on
 *  the platform. Ops read it. */
function PublicRequestPage({ deal: k, onChanged }: { deal: DatasetDeal; onChanged: () => void }) {
  const [closing, setClosing] = useState(false);
  const st = dealStatusMeta(k);
  const seller = k.my_side === "seller";
  return (
    <View
      title={`Request · ${k.dataset_title}`}
      sub={`From the public page · ${k.contact_name}, ${k.buyer_name}`}
      actions={<Pill tone={st.tone}>{st.label}</Pill>}
    >
      <CatalogueTabs current="deals" />
      <div className="pubgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Panel title="What they asked" sub={`Sent ${fmtDateTime(k.created_at)}`}>
            <Dl rows={[
              ["Dataset", <Link key="d" to={`/datahub/${k.dataset_slug}`}>{k.dataset_title}</Link>],
              ["From", `${k.contact_name} · ${k.contact_company}`],
              ["Email", k.contact_email ?? "—"],
              ["Intended use", k.intended_use],
              ["Message", <div key="m" style={{ whiteSpace: "pre-wrap" }}>{k.message || "—"}</div>],
            ]} />
          </Panel>
          <DealChat deal={k} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Next step">
            {k.status === "requested" ? (seller ? (
              <>
                <p className="small" style={{ margin: 0 }}>
                  {k.contact_name} has no account. Reply here; it is emailed to them, and the rest is agreed by email.
                  Close the request when it is done.
                </p>
                <Button onClick={() => setClosing(true)}>Close the request</Button>
              </>
            ) : <p className="small muted" style={{ margin: 0 }}>The seller answers this request by email.</p>) : (
              <p className="small muted" style={{ margin: 0 }}>Closed{k.decided_at ? ` on ${fmtDate(k.decided_at)}` : ""}. Nothing more to do.</p>
            )}
            {k.decision_note && <Callout tone="neutral" title="Note">{k.decision_note}</Callout>}
          </Panel>
        </div>
      </div>
      {closing && (
        <ReasonDialog
          title="Close this request"
          warning="The person is not told. No further reply can be sent from here."
          confirmLabel="Close"
          minLength={0}
          onConfirm={(note) => post(`/catalogue/deals/${k.id}/decline`, { note }).then(onChanged)}
          onClose={() => setClosing(false)}
        />
      )}
    </View>
  );
}

function QuoteDialog({ deal, onClose, onDone }: { deal: DatasetDeal; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(deal.quote_amount ?? "");
  const [currency, setCurrency] = useState(deal.currency ?? "USD");
  const startQty = deal.quote_quantity ?? deal.requested_quantity;
  const [all, setAll] = useState(startQty == null);
  const [qty, setQty] = useState(startQty != null ? String(startQty) : "");
  const [terms, setTerms] = useState(deal.quote_terms ?? "");
  const [uses, setUses] = useState<PermittedUse[]>(deal.quote_uses.length ? deal.quote_uses : deal.requested_uses);
  const n = Number(qty);
  const qtyOk = all || (Number.isInteger(n) && n > 0 && (!deal.file_count || n <= deal.file_count));
  const send = useMutation({
    mutationFn: () => post(`/catalogue/deals/${deal.id}/quote`, {
      amount, currency, quantity: all ? null : n, terms: terms.trim() || null, uses,
    }),
    onSuccess: () => { onDone(); onClose(); },
  });
  const ok = Number(amount) >= 0 && amount.trim() !== "" && /^[A-Za-z]{3}$/.test(currency) && uses.length > 0 && qtyOk;
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
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Files the quote covers, as agreed in the chat</legend>
        <label className="checkline">
          <input type="radio" name="qqty" checked={all} onChange={() => setAll(true)} />
          <span>{quantityText(null, deal.file_count)}</span>
        </label>
        <label className="checkline">
          <input type="radio" name="qqty" checked={!all} onChange={() => setAll(false)} />
          <span>A number of files</span>
        </label>
        {!all && (
          <Field label="Number of files" required hint={deal.file_count ? `Up to ${deal.file_count.toLocaleString()}` : undefined}>
            {(id) => <input id={id} className={inputCls} inputMode="numeric" style={{ maxWidth: 200 }} value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} />}
          </Field>
        )}
      </fieldset>
      <div className="formgrid">
        <Field label="Price" required>{(id) => <input id={id} className={inputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
        <Field label="Currency" required hint="Three letters, e.g. USD or INR">
          {(id) => <input id={id} className={inputCls} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />}
        </Field>
      </div>
      <CheckGroup label="Uses the licence covers" options={PERMITTED_USES} value={uses} onChange={setUses} />
      <Field label="Terms" hint="Anything beyond the listing's licence terms: which files, how and when you deliver them.">
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
        ["Files", quantityText(deal.quote_quantity, deal.file_count)],
        ["Uses covered", usesText(deal.quote_uses)],
        ["Terms", <div key="t" style={{ whiteSpace: "pre-wrap" }}>{deal.quote_terms || "The listing's licence terms"}</div>],
      ]} />
      <p className="small muted" style={{ margin: 0 }}>
        Accepting fixes these terms. {deal.seller_name} then invoices you; payment is between you and them, and they hand
        the files over to you directly.
      </p>
      {accept.isError && <Callout tone="critical" title="Not accepted">{errText(accept.error)}</Callout>}
    </Dialog>
  );
}

