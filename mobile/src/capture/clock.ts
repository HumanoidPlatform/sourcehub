// The recording clock on the camera screen: how long the clip has run, against
// the most it may run. Pure, so the screen only decides when to tick.

/** 75 → "1:15". Whole seconds, rounded down: the clock never runs ahead. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** What the clock's colour says: still short of the minimum, fine, or nearly
 * at the limit where the camera stops on its own. */
export type ClockTone = "short" | "ok" | "ending";

export function clockTone(elapsed: number, min: number | null, max: number): ClockTone {
  if (min != null && elapsed < min) return "short";
  if (max - elapsed <= 10) return "ending";
  return "ok";
}
