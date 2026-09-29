// vendors — the pieces the directory and the vendor page share: the star
// rating, a figure over its bar, the expertise chips, and the card.

import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Performance, Vendor } from "@api/types";
import { Meter } from "@ds/primitives";
import { PRODUCT } from "@shared/brand";
import { OrgLogo } from "@shared/org-logo";
import { expertiseLabel, type ExpertiseKey } from "@shared/expertise";

/** "4.6 out of 5, 12 ratings" — what the stars say, in words. */
export function ratingText(avg: number | null | undefined, count: number): string {
  if (avg == null || !count) return "No ratings yet";
  return `${avg.toFixed(1)} out of 5, ${count} ${count === 1 ? "rating" : "ratings"}`;
}

/**
 * Five stars, filled to the average.
 *
 * One image to assistive technology, named by ratingText: five separate glyphs
 * would be read as "black star, black star, …". The fill is a second row of
 * stars clipped to a width, so 4.6 shows as four and a bit rather than being
 * rounded to four or five.
 */
export function Rating({
  avg,
  count,
  size = "md",
}: {
  avg: number | null | undefined;
  count: number;
  size?: "md" | "lg";
}) {
  const rated = avg != null && count > 0;
  const pct = rated ? Math.max(0, Math.min(100, (avg / 5) * 100)) : 0;
  return (
    <span className="stars" data-size={size} role="img" aria-label={ratingText(avg, count)}>
      <span className="stars-row" aria-hidden="true">
        ★★★★★
        <span className="stars-fill" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      {rated ? (
        <span aria-hidden="true">
          <b className="num">{avg.toFixed(1)}</b> <span className="muted num">({count})</span>
        </span>
      ) : (
        <span className="muted" aria-hidden="true">No ratings yet</span>
      )}
    </span>
  );
}

/**
 * An "i" beside a label, and what the label means when it is asked.
 *
 * It opens on hover, on keyboard focus and on a tap, because a hover alone
 * reaches neither a keyboard nor a phone. It stays open while the pointer is
 * over the explanation itself, and Escape closes it: a tooltip that cannot be
 * dismissed sits on top of whatever is under it.
 *
 * The explanation is in the page from the start, hidden, so the button can
 * point at it with aria-describedby and a screen reader reads it on focus
 * whether or not it is showing.
 */
export function InfoTip({
  about,
  text,
  align = "start",
}: {
  /** What is being explained; the button is named "About <this>". */
  about: string;
  text: string;
  /** Which edge of the icon the explanation lines up with, so one near the
   *  right edge of a card opens leftwards instead of out of it. */
  align?: "start" | "end";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="infotip"
      data-align={align}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="infotip-btn"
        aria-label={`About ${about}`}
        aria-describedby={id}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // A tap focuses and then clicks. Opening on both, never toggling,
        // keeps the second from undoing the first.
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span className="infotip-pop" role="tooltip" id={id} hidden={!open}>{text}</span>
    </span>
  );
}

/** A percentage with its name above and its bar below. Null is "—", never 0%:
 *  there was nothing to measure. With a hint, the name carries an "i" that
 *  says what the figure is made of. */
export function Figure({
  label,
  pct,
  hint,
  hintAlign,
}: {
  label: string;
  pct: number | null;
  hint?: string;
  hintAlign?: "start" | "end";
}) {
  return (
    <div className="vfigure">
      <span className="vfigure-label">
        {label}
        {hint && <InfoTip about={label} text={hint} align={hintAlign} />}
      </span>
      <span className="vfigure-val num">{pct == null ? "—" : `${pct}%`}</span>
      {pct != null && <Meter pct={pct} tone={pct >= 90 ? "success" : pct < 70 ? "attention" : undefined} />}
    </div>
  );
}

// What the two figures on a card are made of, in a buyer's words.
export const ON_TIME_HINT =
  "The share of this vendor's completed contracts that were delivered on or before the date the client asked for.";
export const FIRST_TIME_HINT =
  "The share of this vendor's completed contracts that the client approved without sending the delivery back for rework.";

/** Has anyone anything to go on yet? A partner with no completed contract and
 *  no rating is new to the platform, and says so instead of showing dashes. */
export function isNew(p: Performance): boolean {
  return p.contracts_completed === 0 && p.rating_count === 0;
}

export function projectsLine(p: Performance): string {
  const n = p.contracts_completed;
  return `${n} ${n === 1 ? "project" : "projects"} here`;
}

export function yearsLine(years: number | null | undefined): string | null {
  if (years == null) return null;
  if (years < 1) return "Founded this year";
  return `${years} ${years === 1 ? "yr" : "yrs"} in business`;
}

/** The first few values of one expertise list as chips, and how many more. */
export function Tags({
  list,
  values,
  tone,
  max = 4,
}: {
  list: ExpertiseKey;
  values: readonly string[];
  tone?: "accent" | "outline";
  max?: number;
}) {
  if (!values.length) return null;
  const shown = values.slice(0, max);
  const rest = values.length - shown.length;
  return (
    <>
      {shown.map((v) => (
        <span key={`${list}:${v}`} className="vtag" data-tone={tone}>
          {list === "regions" ? v : expertiseLabel(list, v)}
          {/* a country code is compact on a card and cryptic read aloud */}
          {list === "regions" && <span className="sr"> ({expertiseLabel(list, v)})</span>}
        </span>
      ))}
      {rest > 0 && (
        <span className="vtag" data-tone="more" title={values.slice(max).map((v) => expertiseLabel(list, v)).join(", ")}>
          +{rest}
        </span>
      )}
    </>
  );
}

export function websiteHost(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** Someone else's site: a new tab, and no window.opener handed to it. */
export function WebsiteLink({ url }: { url: string }) {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return (
    <a className="vlink" href={href} target="_blank" rel="noopener noreferrer">
      {websiteHost(href)}
    </a>
  );
}

/** Where a vendor is, without saying "Pune, India, India" when the HQ names
 *  the country already. */
export function placeLine(v: Vendor): string {
  const hq = v.hq?.trim() ?? "";
  const country = v.country?.trim() ?? "";
  if (hq && country && hq.toLowerCase().includes(country.toLowerCase())) return hq;
  return [hq, country].filter(Boolean).join(", ");
}

/**
 * One vendor in the directory.
 *
 * The whole card is the link to the vendor's page, by way of a stretched
 * ::after on the name's anchor — so the card has ONE link with a sensible
 * name, not a wrapper anchor whose accessible name is the entire card, and the
 * website link inside it stays a separate, valid link.
 */
export function VendorCard({ v, to, state }: { v: Vendor; to: string; state?: unknown }) {
  const p = v.performance;
  const e = v.expertise;
  const where = placeLine(v);
  const foot: ReactNode[] = [yearsLine(v.years_in_business), isNew(p) ? null : projectsLine(p)].filter(Boolean);
  return (
    <article className="vcard" aria-label={v.name}>
      <header className="vcard-head">
        <OrgLogo orgId={v.id} version={v.logo_version} name={v.name} size={48} />
        <div className="vcard-title">
          <h3 className="vcard-name">
            <Link to={to} state={state}>{v.name}</Link>
          </h3>
          <div className="vcard-meta">
            {where && <span>{where}</span>}
            {v.website && <WebsiteLink url={v.website} />}
          </div>
        </div>
        {/* No "Fair work" badge here. fair_work_attested is written by the seed
            files and by nothing else: there is no step where a partner attests
            or Ops records it, so a badge would present seeded data as an
            attestation. The field still arrives; bring the badge back with it
            once something real sets it. */}
      </header>

      <p className="vcard-about">
        {v.description?.trim() || <span className="muted">This partner has not added a description yet.</span>}
      </p>

      <div className="vcard-tags">
        <Tags list="data_types" values={e.data_types} tone="accent" max={5} />
        <Tags list="domains" values={e.domains} max={3} />
        <Tags list="regions" values={e.regions} tone="outline" max={5} />
        <Tags list="certifications" values={e.certifications} tone="outline" max={3} />
        {!e.data_types.length && !e.domains.length && !e.regions.length && !e.certifications.length && (
          <span className="muted small">No expertise listed yet</span>
        )}
      </div>

      {isNew(p) ? (
        <div className="vcard-perf vcard-new">
          <span className="vbadge" data-tone="new">New on {PRODUCT}</span>
          <span className="muted small">No completed projects here yet.</span>
        </div>
      ) : (
        <div className="vcard-perf">
          <Rating avg={p.rating_avg} count={p.rating_count} />
          <Figure label="On time" pct={p.on_time_pct} hint={ON_TIME_HINT} />
          <Figure
            label="Accepted first time"
            pct={p.accepted_first_time_pct}
            hint={FIRST_TIME_HINT}
            // the right-hand column: open towards the middle of the card
            hintAlign="end"
          />
        </div>
      )}

      <footer className="vcard-foot">
        <span>{foot.length ? foot.map((x, i) => <span key={i}>{i > 0 && " · "}{x}</span>) : <span className="id">{v.reference_code}</span>}</span>
        <span className="vcard-cta" aria-hidden="true">View profile →</span>
      </footer>
    </article>
  );
}
