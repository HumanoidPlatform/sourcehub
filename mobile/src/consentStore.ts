// Reads and writes the consent record (consent.ts) in the phone's key-value
// store, and tells every mounted reader when it changes — the layout that
// redirects to /consent and the screen that accepts are different components,
// and the first has to hear about the second.
//
// Works with no signal: a worker in a basement must never be blocked from
// starting a shift by a notice they have just agreed to.
//
// THE CACHE IS THE SOURCE OF TRUTH FOR RENDERING, and it is updated
// synchronously on accept. An earlier version re-read storage after accepting;
// that read is asynchronous, so for a few milliseconds the layout still
// believed "not accepted" — long enough to bounce a worker who had just tapped
// "I agree" straight back to the notice. It is also keyed by user and read
// during render, so signing in as someone else can never show, even for one
// frame, the previous person's answer.

import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { type ConsentRecord, consentKey, isCurrent, makeRecord, parseConsent } from "@/consent";
import { getKv, setKv } from "@/db/kv";

const cache = new Map<string, ConsentRecord | null>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** What storage holds for this user. Anything unreadable is "not accepted". */
export async function loadConsent(userId: string): Promise<ConsentRecord | null> {
  let rec: ConsentRecord | null = null;
  try {
    rec = parseConsent(await getKv(consentKey(userId)));
  } catch {
    rec = null; // a store that cannot be read means "ask again", never "assume yes"
  }
  // an accept that landed while this read was in flight wins
  if (!cache.has(userId)) cache.set(userId, rec);
  notify();
  return cache.get(userId) ?? null;
}

export async function acceptConsent(userId: string): Promise<ConsentRecord> {
  const rec = makeRecord(new Date(), Constants.expoConfig?.version ?? null, Platform.OS);
  await setKv(consentKey(userId), JSON.stringify(rec)); // throws → caller says so, nothing is cached
  cache.set(userId, rec);
  notify();
  return rec;
}

export interface ConsentState {
  /** false until storage has been read once — render nothing, do not redirect */
  ready: boolean;
  accepted: boolean;
  record: ConsentRecord | null;
}

export function useConsent(userId: string | undefined): ConsentState {
  const [, rerender] = useState(0);

  useEffect(() => {
    const bump = () => rerender((n) => n + 1);
    listeners.add(bump);
    if (userId && !cache.has(userId)) void loadConsent(userId);
    return () => {
      listeners.delete(bump);
    };
  }, [userId]);

  if (!userId) return { ready: true, accepted: false, record: null };
  const known = cache.has(userId);
  const record = known ? (cache.get(userId) ?? null) : null;
  return { ready: known, accepted: isCurrent(record), record };
}

/** Tests only. */
export function _resetConsentCache(): void {
  cache.clear();
}
