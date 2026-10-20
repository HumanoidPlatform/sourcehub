// legal — the Onboarding Terms & Conditions: the public page at /terms, and the
// acceptance block the invitation page and the Terms gate share (db/470).
//
// The text is the server's (GET /public/terms), never this file's: what a
// person accepted must be exactly what the database hashed and recorded. It is
// light markdown — ## and ### headings, "- " bullets, "> " quotes, paragraphs
// between blank lines — and nothing else, so a few lines render it.
//
// While the text still holds [bracketed] values for Legal to fill in, the page
// says it is a draft, as the privacy page does.

import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { get } from "@api/client";
import { Callout } from "@ds/primitives";
import { fmtDate } from "@shared/format";
import { BrandMark } from "@shared/brand";

export interface Terms {
  version: string;
  title: string;
  effective_at: string;
  body: string;
  checkbox_text: string;
  declaration: string[];
  sha256: string;
}

export function useCurrentTerms() {
  return useQuery({ queryKey: ["terms", "current"], queryFn: () => get<Terms>("/public/terms") });
}

/** A [placeholder] Legal has not filled in yet. */
export const hasPlaceholders = (t: Terms) => /\[[^\]]+\]/.test(t.body);

/** "## 14. General provisions" is section 14: #s14, which links can point at. */
const anchorOf = (heading: string) => {
  const n = /^(\d+)\./.exec(heading);
  return n ? `s${n[1]}` : undefined;
};

export function TermsText({ body }: { body: string }) {
  const blocks = body.trim().split(/\n{2,}/);
  return (
    <div className="terms-text" style={{ lineHeight: 1.6, fontSize: 13.5 }}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (block.startsWith("## ")) {
          const text = block.slice(3);
          return (
            <h2 key={i} id={anchorOf(text)} style={{ margin: "20px 0 6px", fontSize: 15, scrollMarginTop: 16 }}>
              {text}
            </h2>
          );
        }
        if (block.startsWith("### ")) {
          return <h3 key={i} style={{ margin: "14px 0 4px", fontSize: 13.5 }}>{block.slice(4)}</h3>;
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote key={i} style={{ margin: "6px 0", paddingLeft: 12, borderLeft: "3px solid var(--line)" }}>
              {block.slice(2)}
            </blockquote>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} style={{ margin: "4px 0", paddingLeft: 20 }}>
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={i} style={{ margin: "6px 0" }}>{block}</p>;
      })}
    </div>
  );
}

function DraftNotice() {
  return (
    <Callout tone="critical" title="Draft — not yet approved">
      Some values in these Terms are still [in brackets] for Legal to fill in. They must not be relied on until they
      are.
    </Callout>
  );
}

/**
 * The text in a scrolling box, the checkbox and the declaration (Terms §15).
 * The caller owns the button: "I Accept" on the gate, "Set password and
 * finish" on the invitation, each disabled until `checked`.
 */
export function TermsAcceptance({
  terms, checked, onChange,
}: { terms: Terms; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {hasPlaceholders(terms) && <DraftNotice />}
      <div
        role="region"
        aria-label={terms.title}
        tabIndex={0}
        style={{
          maxHeight: 280, overflowY: "auto", padding: "4px 14px", border: "1px solid var(--line)",
          borderRadius: "var(--r-control)", background: "var(--surface)",
        }}
      >
        <TermsText body={terms.body} />
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        Version {terms.version}, effective {fmtDate(terms.effective_at)} ·{" "}
        <Link to="/terms" target="_blank" rel="noreferrer">Open the full Terms</Link> ·{" "}
        {/* the checkbox accepts the Privacy Policy too, so it is one click away */}
        <Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>
      </p>
      <div className="small">
        <p style={{ margin: "0 0 4px" }}>By selecting "I Accept", I confirm that:</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.5 }}>
          {terms.declaration.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </div>
      <label className="checkline">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{terms.checkbox_text}</span>
      </label>
    </div>
  );
}

/** Public, like /privacy: the invitation and the gate link here, signed in or not. */
export function TermsPage() {
  const terms = useCurrentTerms();
  const { hash } = useLocation();
  const t = terms.data;
  // the section a link pointed at (#s14 is the grievance contact), once the text is in
  useEffect(() => {
    if (t && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [t, hash]);

  let content: ReactNode;
  if (terms.isPending) content = <p className="muted">Loading the Terms…</p>;
  else if (!t) content = <Callout tone="critical" title="The Terms could not be loaded">Try again in a moment.</Callout>;
  else {
    content = (
      <>
        <h1 style={{ margin: "14px 0 2px", fontSize: 22 }}>{t.title}</h1>
        <p className="small muted" style={{ margin: "0 0 12px" }}>
          Version {t.version} · effective {fmtDate(t.effective_at)}
        </p>
        {hasPlaceholders(t) && <DraftNotice />}
        <TermsText body={t.body} />
      </>
    );
  }
  return (
    <div style={{ minHeight: "100vh", background: "var(--ground)", padding: 24 }}>
      <div className="panel" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="panel-body">
          <BrandMark />
          {content}
        </div>
      </div>
    </div>
  );
}
