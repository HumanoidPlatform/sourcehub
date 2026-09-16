// How the dialog and the assignments table read the upload queue.
//
// Query invalidation lives here rather than in the driver because the
// QueryClient is created inside a component (app/providers.tsx) and a
// module-level singleton cannot import it.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { QueueItem, Refusal } from "./item";
import { isActive, uploadQueue } from "./uploader";

export interface AssignmentQueue {
  items: QueueItem[];
  refusals: Refusal[];
  /** anything still moving: the dialog is busy and the row shows a chip */
  active: number;
  failed: number;
}

export function useUploadQueue(assignmentId: string): AssignmentQueue {
  const qc = useQueryClient();
  const snap = useSyncExternalStore(uploadQueue.subscribe, uploadQueue.getSnapshot, uploadQueue.getSnapshot);

  useEffect(() => {
    uploadQueue.start();
    return uploadQueue.onConfirmed((item) => {
      void qc.invalidateQueries({ queryKey: ["assignment-assets", item.assignment_id] });
      void qc.invalidateQueries({ queryKey: ["my-assignments"] });
    });
  }, [qc]);

  return useMemo(() => {
    const items = snap.items.filter((i) => i.assignment_id === assignmentId);
    return {
      items,
      refusals: snap.refusals.filter((r) => r.assignment_id === assignmentId),
      active: items.filter(isActive).length,
      failed: items.filter((i) => i.status === "failed").length,
    };
  }, [snap, assignmentId]);
}

/** Per-assignment counts for the table, so a closed dialog still reports. */
export function useUploadActivity(): Map<string, { active: number; failed: number }> {
  const snap = useSyncExternalStore(uploadQueue.subscribe, uploadQueue.getSnapshot, uploadQueue.getSnapshot);
  return useMemo(() => {
    const out = new Map<string, { active: number; failed: number }>();
    for (const i of snap.items) {
      const a = out.get(i.assignment_id) ?? { active: 0, failed: 0 };
      if (isActive(i)) a.active++;
      else if (i.status === "failed") a.failed++;
      out.set(i.assignment_id, a);
    }
    return out;
  }, [snap]);
}
