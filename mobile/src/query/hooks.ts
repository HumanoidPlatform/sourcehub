import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiError, currentUserId, get } from "@/api/client";
import { getKv, setKv } from "@/db/kv";
import type { Assignment, AssetRow, AssetUrl, NotificationRow, OfferRow } from "@/api/types";
import { POLL_MS } from "@/config";
import { listByAssignment, onOutboxChange, summaryByAssignment, type CaptureRow, type OutboxSummary, rejectionsByAssignment, type RejectionCount } from "@/db/outbox";

/** The list as last fetched, kept per worker on the phone. A restart with no
 *  signal — a basement, a warehouse — used to leave no list at all, so no
 *  assignment could be opened and the camera with it, while the banner said
 *  captures would wait for the connection. Served only when the server cannot
 *  be reached; the server still decides what any capture is accepted for. */
async function fetchAssignments(): Promise<Assignment[]> {
  const key = `assignments:${currentUserId() ?? ""}`;
  try {
    const list = await get<Assignment[]>("/me/assignments");
    void setKv(key, JSON.stringify(list)).catch(() => undefined);
    return list;
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) {
      const saved = await getKv(key).catch(() => null);
      if (saved) return JSON.parse(saved) as Assignment[];
    }
    throw e;
  }
}

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    // "always": offline, react-query would otherwise pause the fetch and never
    // reach the copy on the phone
    networkMode: "always",
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** Tasks offered to this worker, answered on the phone (offers.ts). Polled
 *  like the board; a push refreshes it at once (notifications/PushMount). */
export function useOffers() {
  return useQuery({
    queryKey: ["offers"],
    queryFn: () => get<OfferRow[]>("/me/offers"),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useAssignmentAssets(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ["assignment-assets", assignmentId],
    queryFn: () => get<AssetRow[]>(`/assignments/${assignmentId}/assets`),
    enabled: !!assignmentId,
  });
}

export function useAssetUrl(assetId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["asset-url", assetId],
    queryFn: () => get<AssetUrl>(`/assets/${assetId}/url`),
    enabled,
    staleTime: 13 * 60 * 1000,
    retry: false,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => get<{ unread: number; items: NotificationRow[] }>("/notifications"),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** the local outbox rows for one assignment, live */
export function useOutbox(assignmentId: string | undefined): CaptureRow[] {
  const [rows, setRows] = useState<CaptureRow[]>([]);
  useEffect(() => {
    if (!assignmentId) return;
    let alive = true;
    const load = () => void listByAssignment(assignmentId).then((r) => alive && setRows(r));
    load();
    const off = onOutboxChange(load);
    return () => {
      alive = false;
      off();
    };
  }, [assignmentId]);
  return rows;
}

/** what this phone refused for one assignment, counted by reason, live.
 *  Rides the same change bus, so recording a rejection refreshes the screen. */
export function useRejections(assignmentId: string | undefined): RejectionCount[] {
  const [rows, setRows] = useState<RejectionCount[]>([]);
  useEffect(() => {
    if (!assignmentId) return;
    let alive = true;
    const load = () => void rejectionsByAssignment(assignmentId).then((r) => alive && setRows(r));
    load();
    const off = onOutboxChange(load);
    return () => {
      alive = false;
      off();
    };
  }, [assignmentId]);
  return rows;
}

/** queued/failed/confirmed per assignment, live */
export function useOutboxSummary(): Record<string, OutboxSummary> {
  const [s, setS] = useState<Record<string, OutboxSummary>>({});
  useEffect(() => {
    let alive = true;
    const load = () => void summaryByAssignment().then((r) => alive && setS(r));
    load();
    const off = onOutboxChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return s;
}
