// In-memory upload progress, published to the dialog on its own store.
//
// Kept apart from the queue snapshot on purpose: three concurrent PUTs fire
// onprogress at ~10 Hz, and putting that on the item would re-render every
// subscriber of the whole queue. A row subscribes to this alone.

import { useSyncExternalStore } from "react";

const values = new Map<string, number>();
const listeners = new Set<() => void>();
let snapshot: ReadonlyMap<string, number> = new Map();

function publish() {
  snapshot = new Map(values);
  listeners.forEach((l) => l());
}

export const progress = {
  set(id: string, fraction: number) {
    values.set(id, Math.max(0, Math.min(1, fraction)));
    publish();
  },
  clear(id: string) {
    if (values.delete(id)) publish();
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useUploadProgress(): ReadonlyMap<string, number> {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}
