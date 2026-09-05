import * as Location from "expo-location";

export interface Fix {
  lat: number;
  lon: number;
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
    if (fresh) return { lat: fresh.coords.latitude, lon: fresh.coords.longitude };
    const last = await Location.getLastKnownPositionAsync();
    return last ? { lat: last.coords.latitude, lon: last.coords.longitude } : null;
  } catch {
    return null;
  }
}
