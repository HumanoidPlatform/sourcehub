// Money, dates and reference codes.
//
// Money arrives as numeric strings from the API (Decimal on the server);
// format, never compute. Reference codes (CL-01, RFP-1001) are what people say
// out loud — show these, not UUIDs.

export function money(value: string | number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** "just now", "5 min ago", "3 h ago", "yesterday", then a date — for lists
 *  where recency matters more than the exact time (pair it with fmtDateTime
 *  in a title for the exact one). */
export function fmtAgo(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return "—";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return value;
  const min = Math.floor((now - t) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  if (h < 48) return "yesterday";
  return fmtDate(value);
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** A task's size, as one string: "250 photos".
 *
 * target_quantity is the number the system actually reasons with — the
 * assignment cap and progress both count against it. The free-text `target`
 * column is no longer written by the console; it is read here only so tasks
 * created before that still show what was typed. */
export function taskTarget(t: { target: string | null; target_quantity: number | null; target_unit: string | null }): string {
  if (t.target_quantity != null) return `${t.target_quantity} ${t.target_unit ?? ""}`.trim();
  return t.target ?? "—";
}

/** capture_spec.media as a list, whichever shape the row carries */
export function mediaList(spec: { media?: string | string[] } | null | undefined): string[] {
  const raw = spec?.media;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}
