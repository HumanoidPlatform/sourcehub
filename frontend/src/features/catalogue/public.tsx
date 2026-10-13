// catalogue — the public pages at /datasets and /datasets/:slug.
//
// Public on purpose (the research, decisions.md §17: 20 of 41 platforms list
// publicly, and gating applies to samples and prices, not to whether a dataset
// exists). They read /public/catalogue, which answers for published listings
// and their sample files only. Someone without an account asks for a quote
// through a short form that reaches Ops; someone signed in is sent to the
// console page, where the quote is a deal with the seller.

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, get, post } from "@api/client";
import type { PublicDataset } from "@api/types";
import { Button, Callout, Dl, Empty, Field, inputCls, Skeleton, textareaCls } from "@ds/primitives";
import { useAuth } from "@shared/auth";
import { BrandMark, PRODUCT } from "@shared/brand";
import { fmtDate } from "@shared/format";
import {
  CATEGORIES, categoryLabel, DatasetCard, Preview, regionsText, sizeText, usesText,
} from "./shared";

function PublicFrame({ children, title }: { children: React.ReactNode; title: string }) {
  const { session } = useAuth();
  // the browser tab, as View does for the signed-in pages
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · ${PRODUCT}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
  return (
    <div style={{ minHeight: "100vh", background: "var(--ground)" }}>
      <header
        style={{
          display: "flex", alignItems: "center", gap: 16, padding: "12px 24px",
          background: "var(--surface)", borderBottom: "1px solid var(--line)",
        }}
      >
        <BrandMark to="/datasets" />
        <nav aria-label="Catalogue" style={{ display: "flex", gap: 14, fontSize: 13.5 }}>
          <Link to="/datasets">Datasets</Link>
        </nav>
        <div style={{ flex: 1 }} />
        {session
          ? <Link className="btn" data-size="sm" to="/catalogue">Open the console</Link>
          : <Link className="btn" data-size="sm" to="/login">Sign in</Link>}
      </header>
      <main id="main" style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 48px" }}>
        {children}
      </main>
    </div>
  );
}

export function PublicCataloguePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const list = useQuery({
    queryKey: ["public-catalogue"],
    queryFn: () => get<PublicDataset[]>("/public/catalogue"),
  });
  const rows = (list.data ?? []).filter(
    (d) =>
      (!category || d.category === category) &&
      (!q.trim() || `${d.title} ${d.summary ?? ""} ${d.seller_name}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  return (
    <PublicFrame title="Datasets">
      <h1 tabIndex={-1} style={{ margin: "0 0 4px", fontSize: 24 }}>Datasets</h1>
      <p className="muted" style={{ margin: "0 0 18px", maxWidth: 720 }}>
        Photo and video datasets collected through {PRODUCT} and by its partners. Every listing is reviewed before it
        appears here. Sample files are free to view; full datasets are licensed on a quote.
      </p>
      <div className="btnrow" style={{ marginBottom: 16 }}>
        <input
          className={inputCls}
          style={{ maxWidth: 320 }}
          placeholder="Search datasets…"
          aria-label="Search datasets"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select"
          style={{ maxWidth: 220 }}
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {list.isLoading ? (
        <Skeleton rows={4} label="Loading datasets" />
      ) : list.isError ? (
        <Callout tone="critical" title="The catalogue could not be loaded">Try again in a moment.</Callout>
      ) : rows.length === 0 ? (
        <Empty title={list.data?.length ? "Nothing matches" : "No datasets yet"} hint="New datasets appear here once they are reviewed." />
      ) : (
        <div className="vgrid">
          {rows.map((d) => (
            <DatasetCard
              key={d.slug}
              to={`/datasets/${d.slug}`}
              title={d.title}
              summary={d.summary}
              seller={d.seller_name}
              category={d.category}
              regions={d.regions}
              uses={d.permitted_uses}
              count={d.item_count}
              bytes={d.total_bytes}
              price={d.indicative_price_text}
            />
          ))}
        </div>
      )}
    </PublicFrame>
  );
}

export function PublicDatasetPage() {
  const { slug = "" } = useParams();
  const { session } = useAuth();
  const ds = useQuery({
    queryKey: ["public-dataset", slug],
    queryFn: () => get<PublicDataset>(`/public/catalogue/${slug}`),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1,
  });
  const d = ds.data;
  return (
    <PublicFrame title={d?.title ?? "Dataset"}>
      <p className="small" style={{ margin: "0 0 10px" }}><Link to="/datasets">← All datasets</Link></p>
      {ds.isLoading ? (
        <Skeleton rows={6} label="Loading the dataset" />
      ) : !d ? (
        <Empty title="This dataset is not available" hint="It may have been withdrawn." />
      ) : (
        <div className="pubgrid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div>
              <h1 tabIndex={-1} style={{ margin: "0 0 4px", fontSize: 24 }}>{d.title}</h1>
              <p className="muted" style={{ margin: 0 }}>
                {d.seller_name} · {categoryLabel(d.category)} · {sizeText(d.item_count, d.total_bytes)} · version {d.version_number}
              </p>
            </div>
            {d.summary && <p style={{ margin: 0, fontSize: 15 }}>{d.summary}</p>}
            {d.description && <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{d.description}</div>}
            <section className="panel">
              <div className="panel-head"><div className="titles"><h2 style={{ margin: 0, fontSize: 14.5 }}>Samples</h2>
                <span className="sub">Free to view. The full dataset is licensed.</span></div></div>
              <div className="panel-body">
                {d.samples?.length ? (
                  <div className="samplegrid">
                    {d.samples.map((s) => (
                      <figure key={s.id}>
                        <Preview src={s.url} mime={s.mime_type} name={s.filename} height={140} />
                        <figcaption>{s.filename}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : <p className="muted" style={{ margin: 0 }}>No samples.</p>}
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><div className="titles"><h2 style={{ margin: 0, fontSize: 14.5 }}>Licence terms</h2>
                <span className="sub">Set by the seller</span></div></div>
              <div className="panel-body" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {d.licence_terms || "Given with the quote."}
              </div>
            </section>
          </div>
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section className="panel">
              <div className="panel-body">
                <Dl
                  rows={[
                    ["Price", d.indicative_price_text || "On request"],
                    ["Licensed for", usesText(d.permitted_uses)],
                    ["Regions", regionsText(d.regions)],
                    ["Source", d.source === "contract" ? "Captured through the platform" : "Supplied by the seller"],
                    ["Listed", fmtDate(d.published_at)],
                  ]}
                />
                {session ? (
                  <Link className="btn" data-variant="primary" to={`/catalogue/${d.slug}`}>Request a quote</Link>
                ) : null}
              </div>
            </section>
            {!session && <LeadForm slug={d.slug} />}
          </aside>
        </div>
      )}
    </PublicFrame>
  );
}

function LeadForm({ slug }: { slug: string }) {
  const [f, setF] = useState({ name: "", email: "", company: "", intended_use: "", message: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));
  const send = useMutation({
    mutationFn: () => post(`/public/catalogue/${slug}/leads`, { ...f, message: f.message.trim() || null }),
  });
  if (send.isSuccess) {
    return (
      <Callout tone="success" title="Thank you">
        Your request has reached our team. We will reply to {f.email} with a quote and, if you are new to the platform,
        how to open an account.
      </Callout>
    );
  }
  const ready = f.name.trim() && f.email.trim() && f.company.trim() && f.intended_use.trim().length >= 3;
  return (
    <section className="panel">
      <div className="panel-head"><div className="titles"><h2 style={{ margin: 0, fontSize: 14.5 }}>Request a quote</h2>
        <span className="sub">No account needed</span></div></div>
      <form
        className="panel-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) send.mutate();
        }}
      >
        <Field label="Your name" required>{(id) => <input id={id} className={inputCls} value={f.name} onChange={set("name")} />}</Field>
        <Field label="Work email" required hint="We reply to business addresses.">
          {(id) => <input id={id} type="email" className={inputCls} value={f.email} onChange={set("email")} />}
        </Field>
        <Field label="Organisation" required>{(id) => <input id={id} className={inputCls} value={f.company} onChange={set("company")} />}</Field>
        <Field label="What will you use it for?" required>
          {(id) => <textarea id={id} className={textareaCls} value={f.intended_use} onChange={set("intended_use")} />}
        </Field>
        <Field label="Anything else">{(id) => <textarea id={id} className={textareaCls} value={f.message} onChange={set("message")} />}</Field>
        {send.isError && <Callout tone="critical" title="Not sent">{(send.error as Error).message}</Callout>}
        <Button type="submit" variant="primary" disabled={!ready || send.isPending}>
          {send.isPending ? "Sending…" : "Send request"}
        </Button>
      </form>
    </section>
  );
}
