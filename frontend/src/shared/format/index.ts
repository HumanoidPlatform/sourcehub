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

/** "5 Oct 2026, 18:00 GMT+5:30" — a moment WITH its zone and year, for a
 *  deadline that people in several time zones must all read the same way. */
export function fmtDateTimeZone(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

/** "in 3 days", "in 5 h", "in 12 min", "closed" — the time LEFT on a deadline.
 *  fmtAgo answers "just now" for any future time, so this is its mirror; the
 *  server's own rule is that the window shuts AT the deadline, so an exact
 *  match is already "closed". */
export function fmtUntil(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return "—";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return value;
  if (t <= now) return "closed";
  const min = Math.floor((t - now) / 60_000);
  if (min < 1) return "in under a minute";
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `in ${h} h`;
  return `in ${Math.floor(h / 24)} days`;
}

/** An ISO instant as a datetime-local input wants it: "YYYY-MM-DDTHH:mm" in
 *  the browser's zone. The console had only the other direction
 *  (new Date(local).toISOString()), so nothing could prefill an edit. */
export function isoToLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** The input's local value as a UTC instant, or null when blank or unreadable. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** The UTC calendar date of a local input value: the date the server's
 *  "on or before the delivery date" rule is measured on. A local evening
 *  west of Greenwich is already the next day there. */
export function utcDateOf(value: string): string | null {
  return localInputToIso(value)?.slice(0, 10) ?? null;
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
