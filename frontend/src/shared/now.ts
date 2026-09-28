// The current time as state, so a countdown ticks without a reload.

import { useEffect, useState } from "react";

/** Date.now(), re-read every `everyMs`. A page that shows "in 12 min" reads
 *  this rather than Date.now() so the number moves while the page is open. */
export function useNow(everyMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}
