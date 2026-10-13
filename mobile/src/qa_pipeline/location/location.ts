import * as Location from "expo-location";

export interface Fix {
  lat: number;
  lon: number;
  /** radius in metres the platform is confident of, null when it does not say */
  accuracy: number | null;
  /** true when this position is too old to say where the capture was taken */
  stale: boolean;
  /** when the phone measured it, ms since the epoch */
  at: number;
}

/** A fix the camera screen has been keeping warm counts as current up to this
 *  age: the worker has not walked anywhere in half a minute that matters. */
export const WARM_MAX_AGE_MS = 30_000;
/** The phone's last known position counts as current up to this age. Older
 *  than this it may be from anywhere the phone has been today. */
export const LAST_MAX_AGE_MS = 120_000;

export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

function toFix(loc: Location.LocationObject, now: number, maxAgeMs: number): Fix {
  return {
    lat: loc.coords.latitude,
    lon: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    at: loc.timestamp,
    stale: now - loc.timestamp > maxAgeMs,
  };
}

/** Keep a position coming in while the camera is open, so one is already in
 *  hand when the shutter fires. Asking only at the shutter is what produced
 *  "no fresh fix" indoors with GPS on: a new lock takes longer than the wait,
 *  and a phone finishing a video file is slower still. Resolves to the stop
 *  function; a phone that refuses simply never calls back. */
export async function watchFix(onFix: (f: Fix) => void): Promise<() => void> {
  try {
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 0 },
      (loc) => onFix(toFix(loc, Date.now(), WARM_MAX_AGE_MS)),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

/** The position to stamp on a capture: the warm one if recent, else a fresh
 *  fix within the timeout, else the last known one — stale only when it is
 *  actually old, not merely because the fresh request was slow. */
export async function currentFix(warm?: Fix | null, timeoutMs = 5000): Promise<Fix | null> {
  if (warm && Date.now() - warm.at <= WARM_MAX_AGE_MS) return { ...warm, stale: false };
  try {
    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (fresh) return { ...toFix(fresh, Date.now(), Infinity), stale: false };
    const last = await Location.getLastKnownPositionAsync();
    if (last) return toFix(last, Date.now(), LAST_MAX_AGE_MS);
    // a warm fix past its half-minute is still better than nothing
    return warm ? { ...warm, stale: Date.now() - warm.at > LAST_MAX_AGE_MS } : null;
  } catch {
    return null;
  }
}
