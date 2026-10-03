// Push notifications: this phone's address with the server.
//
// The server pushes every bell row addressed to the signed-in worker
// (backend modules/push) to the Expo push token registered here. One phone per
// worker: registering takes the token from anyone else who held it, so a
// handed-on phone stops receiving the previous worker's notifications.
//
// The token is remembered locally only so that sign-out can name it — the
// server then clears it only if this worker still holds it, and signing out of
// an old phone never silences the new one.

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { del, put } from "@/api/client";
import { getKv, setKv } from "@/db/kv";

/** Must match ANDROID_CHANNEL in backend modules/push/service.py. */
export const CHANNEL = "assignments";
const KV_TOKEN = "push_token";

export type PushState =
  | "on"
  | "off" // not asked yet, or asked and dismissed: asking again is allowed
  | "blocked" // the worker said no; only Android settings can undo it
  | "unavailable" // an emulator, or no Firebase in this build
  | "error";

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "Assignments and reviews",
    description: "New work, batches sent back or accepted, and reminders.",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Ask once, register, and say how it went. Safe to call on every launch. */
export async function registerForPush(): Promise<PushState> {
  if (!Device.isDevice) return "unavailable";
  // The channel first: on Android 13+ creating one is what lets the
  // permission prompt appear at all.
  await ensureChannel();

  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return perm.canAskAgain ? "off" : "blocked";

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    // Most often a build without google-services.json: FCM cannot start.
    console.warn("push: no Expo push token", e);
    return "unavailable";
  }
  try {
    await sendToken(token);
    return "on";
  } catch (e) {
    console.warn("push: the server did not take the token", e);
    return "error";
  }
}

export async function sendToken(token: string): Promise<void> {
  await put("/me/push-token", { token });
  await setKv(KV_TOKEN, token);
}

/** Sign-out. Call while the session is still valid. Never throws: signing out
 *  must work offline, and the next sign-in on this phone moves the token. */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await getKv(KV_TOKEN);
    if (token) await del("/me/push-token", { token });
  } catch {
    // offline or already gone
  }
  try {
    await setKv(KV_TOKEN, "");
  } catch {
    // nothing to forget
  }
}

/** What Settings shows, without prompting. */
export async function pushState(): Promise<PushState> {
  if (!Device.isDevice) return "unavailable";
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return perm.canAskAgain ? "off" : "blocked";
  return (await getKv(KV_TOKEN)) ? "on" : "unavailable";
}
