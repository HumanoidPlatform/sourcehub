// The names, in one place.
//
// PRODUCT is what this application is, and what the interface calls itself: the
// sidebar, the browser tab, the From name on an email. COMPANY is who makes it,
// and belongs only where someone needs to know who stands behind the product —
// the sign-in card, the legal notice, a bill. The two are never shown side by
// side anywhere else: the wordmark is on every screen, and a company name
// repeated there costs width and tells a daily user nothing.
//
// This used to be one name, "Cosarathi", doing both jobs, which left nowhere to
// put a second product.
//
// The static index.html <title> cannot import this module; it carries the same
// name and changes with it.

import { Link } from "react-router-dom";

export const PRODUCT = "DataMind360";
export const COMPANY = "Cosarathi";
export const TAGLINE = "Data collection and delivery platform";

/**
 * The logo: the UX team's vector lockup, mark and wordmark together, served from
 * public/brand. The originals, byte for byte, are in docs/brand.
 *
 * Two files because the wordmark's "Data" and the mark's body are ink: dark on a
 * light page, white on a dark one. Named by where each goes, not by the colour of
 * its ink, so the pair cannot be wired backwards (UX's DataMind360_Dark_Logo is
 * the one for the LIGHT theme).
 *
 * The previous logo was a raster mark with the name set as live text beside it,
 * because that lockup's wordmark was a bitmap that blurred and could not follow
 * the theme. This one is vector with a variant per theme, so the name is part of
 * the artwork again.
 */
export const LOGO_ON_LIGHT = "/brand/logo-on-light.svg";
export const LOGO_ON_DARK = "/brand/logo-on-dark.svg";

/** As the logo itself puts it. Small, and never next to the sidebar wordmark.
 *
 *  Derived from COMPANY, not written out: hardcoding it as "A CoSarathi
 *  product" spelled the company two ways in one file, and left the phone app —
 *  which still derives it — disagreeing with the console. */
export const BYLINE = `A ${COMPANY} product`;

/**
 * The phone app under the name a worker sees on their own phone TODAY. It
 * becomes "DataMind360 Capture" when the next release is published; until then
 * the console and the emails must name what they actually have installed, so
 * this is deliberately not derived from PRODUCT.
 */
export const CAPTURE_APP = "Cosarathi Capture";

export function BrandMark({ byline, to }: { byline?: boolean; to?: string }) {
  const content = (
    <>
      {/* One image per theme; the stylesheet shows one and display:none hides
          the other from screen readers too, so the name is read once. Two <img>
          rather than a <picture>: a <picture> source can only ask the OS for its
          colour scheme, and would miss the in-app theme toggle (data-theme).
          width/height = the artwork's 330×68 at 32px high, so the rail does not
          jump while it loads. */}
      <img className="mark-logo on-light" src={LOGO_ON_LIGHT} alt={PRODUCT} width={155} height={32} />
      <img className="mark-logo on-dark" src={LOGO_ON_DARK} alt={PRODUCT} width={155} height={32} />
      {/* The sign-in card is the one place the company sits under the logo: a
          first-time visitor is entitled to know whose door this is. Inside the
          console it lives at the foot of the rail instead. */}
      {byline && <span className="mark-by">{BYLINE}</span>}
    </>
  );

  // In the console the mark is the way back to the overview, which is where
  // people expect a logo to lead. On the sign-in and privacy screens it is not
  // a link: there is no workspace to go back to yet.
  //
  // The label keeps the name the logo shows and adds where it goes —
  // "DataMind360" on its own does not say it is the way home, and a label that
  // dropped the visible name would break speech control ("click DataMind360").
  return to ? (
    <Link className="mark" to={to} aria-label={`${PRODUCT} home`}>
      {content}
    </Link>
  ) : (
    <div className="mark">{content}</div>
  );
}
