// What the screens say about a row that is waiting, in the worker's words.
// Pure, so it is tested without a phone.

/** "Retrying in 40 s", "Retrying in 3 min · 4 tries" — or null when the row
 *  is not waiting out a backoff. A row waiting is not a row that failed: the
 *  connection was poor and the uploader will try again by itself. */
export function retryText(
  row: { status: string; next_attempt_at: number; attempts: number },
  now: number,
): string | null {
  if (row.status === "confirmed" || row.status === "failed") return null;
  if (row.next_attempt_at <= now) return null;
  const s = Math.ceil((row.next_attempt_at - now) / 1000);
  const when = s < 90 ? `${s} s` : `${Math.round(s / 60)} min`;
  return `Retrying in ${when}${row.attempts > 1 ? ` · ${row.attempts} tries` : ""}`;
}

/** "3 left · 45%": the notification line while uploads run in the background.
 *  How many captures are still to send, and how far the one in flight is. */
export function uploadsLine(left: number, fraction: number): string {
  const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  return `${left} left · ${pct}%`;
}
