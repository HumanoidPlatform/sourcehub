/** 4 s, 8 s, 16 s … capped at 5 minutes, with up to a second of jitter */
export function delayFor(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(2 ** Math.max(1, attempt) * 2000, 300_000);
  return base + Math.floor(random() * 1000);
}
