import * as Location from "expo-location";

export interface Fix {
  lat: number;
  lon: number;
  /** radius in metres the platform is confident of, null when it does not say */
  accuracy: number | null;
  /** true when this is the last known position, not one taken just now */
  stale: boolean;
}

export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/** a fresh fix within the timeout, else the last known one, else nothing */
export async function currentFix(timeoutMs = 5000): Promise<Fix | null> {
  try {
    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (fresh) {
      return { lat: fresh.coords.latitude, lon: fresh.coords.longitude, accuracy: fresh.coords.accuracy, stale: false };
    }
    const last = await Location.getLastKnownPositionAsync();
    // Worth distinguishing: this fix may be from anywhere the phone has been
    // today, and until now it was indistinguishable from a fresh one.
    return last
      ? { lat: last.coords.latitude, lon: last.coords.longitude, accuracy: last.coords.accuracy, stale: true }
      : null;
  } catch {
    return null;
  }
}
