import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { get } from "@/api/client";
import type { Assignment, AssetRow, AssetUrl, NotificationRow } from "@/api/types";
import { POLL_MS } from "@/config";
import { listByAssignment, onOutboxChange, summaryByAssignment, type CaptureRow, type OutboxSummary } from "@/db/outbox";

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: () => get<Assignment[]>("/me/assignments"),
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
