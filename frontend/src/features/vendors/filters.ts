// vendors — narrowing and ordering the directory. Pure: no React, no fetch.
//
// Every active delivery partner arrives in one response and is filtered here,
// in the browser, so choosing a filter costs no round trip and the count
// under the filter bar moves as fast as the click.
//
// The filters live in the URL. A filtered directory is something a buyer sends
// to a colleague ("these three do video in India"), bookmarks, and expects to
// find again after opening a vendor and pressing Back.

import type { Vendor } from "@api/types";
import { EXPERTISE_KEYS, expertiseLabel, optionsOf, type ExpertiseKey } from "@shared/expertise";

export type SortKey = "rating" | "projects" | "name" | "newest";

export const SORTS: readonly { value: SortKey; label: string }[] = [
  { value: "rating", label: "Best rated" },
  { value: "projects", label: "Most projects" },
  { value: "name", label: "Name" },
  { value: "newest", label: "Newest" },
];

export const MIN_RATINGS: readonly { value: number; label: string }[] = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3 and above" },
  { value: 4, label: "4 and above" },
  { value: 4.5, label: "4.5 and above" },
];

export interface VendorFilters {
  q: string;
  data_types: string[];
  domains: string[];
  regions: string[];
  languages: string[];
  certifications: string[];
  /** 0 is "any", which also admits a vendor nobody has rated yet. */
  min_rating: number;
  sort: SortKey;
}

export const NO_FILTERS: VendorFilters = {
  q: "", data_types: [], domains: [], regions: [], languages: [], certifications: [],
  min_rating: 0, sort: "rating",
};

// Short names in the address bar; the long ones are the API's.
const PARAM: Record<ExpertiseKey, string> = {
  data_types: "type",
  domains: "domain",
  regions: "region",
  languages: "lang",
  certifications: "cert",
};

const known = (key: ExpertiseKey) => new Set(optionsOf(key).map((o) => o.value));

/** The filters a URL describes. Anything it does not recognise is dropped, so
 *  a link from an older build, or one typed by hand, narrows by what it can and
 *  never by a value that matches nobody. */
export function readFilters(params: URLSearchParams): VendorFilters {
  const f: VendorFilters = { ...NO_FILTERS, q: (params.get("q") ?? "").trim() };
  for (const key of EXPERTISE_KEYS) {
    const allowed = known(key);
    const sent = (params.get(PARAM[key]) ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    f[key] = [...new Set(sent)].filter((v) => allowed.has(v));
  }
  const rating = Number(params.get("rating"));
  if (MIN_RATINGS.some((r) => r.value === rating)) f.min_rating = rating;
  const sort = params.get("sort");
  if (SORTS.some((s) => s.value === sort)) f.sort = sort as SortKey;
  return f;
}

/** The URL for a set of filters: only what differs from the default, so the
 *  unfiltered directory is plain /vendors. */
export function writeFilters(f: VendorFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  for (const key of EXPERTISE_KEYS) {
    if (f[key].length) p.set(PARAM[key], f[key].join(","));
  }
  if (f.min_rating > 0) p.set("rating", String(f.min_rating));
  if (f.sort !== NO_FILTERS.sort) p.set("sort", f.sort);
  return p;
}

/** Sorting is a preference, not a filter: a sorted list is still the whole list. */
export function isFiltered(f: VendorFilters): boolean {
  return !!f.q.trim() || f.min_rating > 0 || EXPERTISE_KEYS.some((k) => f[k].length > 0);
}

const text = (v: Vendor) =>
  [v.name, v.description, v.hq, v.country, v.reference_code].filter(Boolean).join(" ").toLowerCase();

/**
 * Whether a vendor is what the buyer described.
 *
 * Within one list a vendor must cover EVERYTHING chosen, not any of it. A buyer
 * who ticks Video and Audio has a project with both, and a vendor that does
 * only one of them cannot deliver it; "any of" would put that vendor first and
 * leave the buyer to read each card to find out.
 */
export function matches(v: Vendor, f: VendorFilters): boolean {
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    const haystack = text(v);
    if (!words.every((w) => haystack.includes(w))) return false;
  }
  for (const key of EXPERTISE_KEYS) {
    const has = v.expertise?.[key] ?? [];
    if (!f[key].every((wanted) => has.includes(wanted))) return false;
  }
  if (f.min_rating > 0) {
    const avg = v.performance.rating_avg;
    // Unrated is not "rated low", but it is not "4 and above" either.
    if (avg == null || avg < f.min_rating) return false;
  }
  return true;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const byName = (a: Vendor, b: Vendor) => collator.compare(a.name, b.name);

/** Highest first, and a vendor without the figure after every vendor with it:
 *  no rating is not the lowest rating. */
const desc = (a: number | null | undefined, b: number | null | undefined) => {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  return b - a;
};

const ORDER: Record<SortKey, (a: Vendor, b: Vendor) => number> = {
  rating: (a, b) =>
    desc(a.performance.rating_avg, b.performance.rating_avg)
    // 4.6 from twelve clients says more than 4.6 from one
    || desc(a.performance.rating_count, b.performance.rating_count)
    || desc(a.performance.contracts_completed, b.performance.contracts_completed)
    || byName(a, b),
  projects: (a, b) =>
    desc(a.performance.contracts_completed, b.performance.contracts_completed)
    || desc(a.performance.rating_avg, b.performance.rating_avg)
    || byName(a, b),
  name: byName,
  newest: (a, b) =>
    desc(a.partner_since ? Date.parse(a.partner_since) : null, b.partner_since ? Date.parse(b.partner_since) : null)
    || byName(a, b),
};

export function sortVendors(list: readonly Vendor[], sort: SortKey): Vendor[] {
  return [...list].sort(ORDER[sort]);
}

export function applyFilters(list: readonly Vendor[], f: VendorFilters): Vendor[] {
  return sortVendors(list.filter((v) => matches(v, f)), f.sort);
}

export interface FilterChip {
  /** Unique among the chips shown, for React and for removal. */
  id: string;
  label: string;
  /** The filters without this one. */
  without: VendorFilters;
}

/** One chip per active filter, each knowing what removing it leaves. */
export function chipsOf(f: VendorFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.q.trim()) chips.push({ id: "q", label: `"${f.q.trim()}"`, without: { ...f, q: "" } });
  for (const key of EXPERTISE_KEYS) {
    for (const value of f[key]) {
      chips.push({
        id: `${key}:${value}`,
        label: expertiseLabel(key, value),
        without: { ...f, [key]: f[key].filter((v) => v !== value) },
      });
    }
  }
  if (f.min_rating > 0) {
    chips.push({ id: "rating", label: `★ ${f.min_rating}+`, without: { ...f, min_rating: 0 } });
  }
  return chips;
}

/** Clearing the filters keeps the chosen order. */
export function cleared(f: VendorFilters): VendorFilters {
  return { ...NO_FILTERS, sort: f.sort };
}

/** "12 vendors", or "3 of 12 vendors" once something narrows the list. */
export function countLine(shown: number, total: number, filtered: boolean): string {
  const noun = total === 1 ? "vendor" : "vendors";
  return filtered ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
}
