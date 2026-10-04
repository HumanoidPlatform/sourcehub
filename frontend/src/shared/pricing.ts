// One amount on a basis (db/320): how a request's budget, a bid and a
// contract are priced, and the words a person reads for them.
//
// The server sends its own sentence (Pricing.text) but formats money as
// "USD 500.00"; the console formats money everywhere else with money(), so the
// sentence is rebuilt here from the fields and only the arithmetic is shared.

import type { Pricing, PricingBasis } from "@api/types";
import { money } from "@shared/format";

// singular, plural — the target_unit vocabulary as it reads after "per"
const UNIT_WORDS: Record<string, [string, string]> = {
  photos: ["photo", "photos"],
  videos: ["video", "videos"],
  audio_clips: ["audio clip", "audio clips"],
  audio_hours: ["hour of audio", "hours of audio"],
  responses: ["response", "responses"],
  records: ["record", "records"],
  sites: ["site", "sites"],
  hours: ["hour of footage", "hours of footage"],
};

/** Units a quantity may be fractional in; everything else is counted whole. */
export const FRACTIONAL_UNITS = new Set(["hours", "audio_hours"]);

/** "1,000 photos", "photo", "10 hours of footage". */
export function unitWords(unit: string | null | undefined, block: number | null | undefined): string {
  const [singular, plural] = UNIT_WORDS[unit ?? ""] ?? [unit ?? "unit", unit ?? "units"];
  if (!block || block === 1) return singular;
  return `${block.toLocaleString("en-US")} ${plural}`;
}

/** "39 photos", "1 photo", "2.5 hours of footage". */
export function quantityWords(quantity: string | number | null | undefined, unit: string | null | undefined): string {
  if (quantity === null || quantity === undefined || quantity === "") return "—";
  const n = Number(quantity);
  const [singular, plural] = UNIT_WORDS[unit ?? ""] ?? [unit ?? "unit", unit ?? "units"];
  const shown = Number.isInteger(n) ? n.toLocaleString("en-US") : String(n);
  return `${shown} ${n === 1 ? singular : plural}`;
}

/** "$500 per 1,000 photos" or "$72,500"; null when the amount is not known. */
export function priceText(
  basis: PricingBasis | string,
  amount: string | number | null | undefined,
  currency: string | undefined,
  unit: string | null | undefined,
  block: number | null | undefined,
): string | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const head = money(amount, currency);
  return basis === "per_unit" ? `${head} per ${unitWords(unit, block)}` : head;
}

/** amount × quantity / block, as the server rounds it; null when unknown. */
export function estimatedTotal(
  basis: PricingBasis | string,
  amount: string | number | null | undefined,
  block: number | null | undefined,
  quantity: number | null | undefined,
): number | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const a = Number(amount);
  if (Number.isNaN(a)) return null;
  if (basis !== "per_unit") return a;
  if (!block || !quantity) return null;
  return Math.round((a * quantity / block) * 100) / 100;
}

/** The one-line reading of a pricing block, for tables and detail rows.
 *  A withheld amount reads "Not disclosed"; an absent one "Not stated". */
export function describePricing(
  p: Pricing | null | undefined,
  opts: { disclosed?: boolean; withTotal?: boolean } = {},
): string {
  if (!p) return "—";
  const head = priceText(p.basis, p.amount, p.currency, p.unit, p.block);
  if (head === null) {
    // the amount is withheld or absent; the basis never is, so a partner
    // still knows what to quote per
    const basis = p.basis === "per_unit" ? ` · priced per ${unitWords(p.unit, p.block)}` : "";
    return (opts.disclosed === false ? "Not disclosed" : "Not stated") + basis;
  }
  if (opts.withTotal && p.basis === "per_unit" && p.estimated_total) {
    return `${head} · ≈ ${money(p.estimated_total, p.currency)} for ${quantityWords(p.quantity, p.unit)}`;
  }
  return head;
}

/** What a bid's one price means on the request's basis. */
export function bidText(
  price: string | number,
  currency: string | undefined,
  p: Pricing | null | undefined,
  withTotal = false,
): string {
  if (!p || p.basis !== "per_unit") return money(price, currency);
  const head = `${money(price, currency)} per ${unitWords(p.unit, p.block)}`;
  const total = withTotal ? estimatedTotal("per_unit", price, p.block, p.quantity) : null;
  return total === null ? head : `${head} · ≈ ${money(total, currency)} in all`;
}
