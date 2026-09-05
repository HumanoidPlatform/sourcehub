// A small in-memory record of what the uploader did, newest first, so a
// tester can read the story of a capture in Settings without a debugger.
// It lives only as long as the app process.

import { useSyncExternalStore } from "react";

export interface UploadLogEntry {
  at: number;
  capture: string;
  step: string;
  outcome: string;
  detail?: string;
}

const MAX = 50;
let entries: UploadLogEntry[] = [];
const listeners = new Set<() => void>();

export function logUpload(e: Omit<UploadLogEntry, "at">): void {
  entries = [{ at: Date.now(), ...e }, ...entries].slice(0, MAX);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useUploadLog(): UploadLogEntry[] {
  return useSyncExternalStore(subscribe, () => entries, () => entries);
}
