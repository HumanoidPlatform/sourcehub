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
 * The mark, cut out of the supplied lockup and served from public/brand.
 * The lockup's own wordmark is not used in the interface: it is raster text,
 * which blurs at 28px and cannot follow the dark theme. The name beside the
 * mark is live text instead, so it stays sharp and legible in both themes.
 */
export const MARK_SRC = "/brand/mark.png";

/** As the logo itself puts it. Small, and never next to the sidebar wordmark. */
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
      {/* alt="" on purpose: the product name is right beside it, and a screen
          reader announcing "DataMind360 logo, DataMind360" says it twice. */}
      {/* width/height match the CSS, so the rail does not jump while it loads */}
      <img className="mark-logo" src={MARK_SRC} alt="" width={32} height={32} />
      <span className="mark-text">
        <span className="mark-name">{PRODUCT}</span>
        {/* The sign-in card is the one place the company sits under the
            wordmark: a first-time visitor is entitled to know whose door this
            is. Inside the console it lives at the foot of the rail instead. */}
        {byline && <span className="mark-by">{BYLINE}</span>}
      </span>
    </>
  );

  // In the console the mark is the way back to the overview, which is where
  // people expect a logo to lead. On the sign-in and privacy screens it is not
  // a link: there is no workspace to go back to yet.
  //
  // The label keeps the visible name and adds where it goes — "DataMind360" on
  // its own does not say it is the way home, and an aria-label that dropped the
  // visible text would break speech control ("click DataMind360").
  return to ? (
    <Link className="mark" to={to} aria-label={`${PRODUCT} home`}>
      {content}
    </Link>
  ) : (
    <div className="mark">{content}</div>
  );
}
