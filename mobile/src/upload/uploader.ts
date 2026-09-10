// The upload loop. One item at a time, foreground only, kicked by every event
// that could make progress possible: a new capture, the app coming to the
// front, the network coming back, a 30-second timer, a tap on Retry.
//
// It is a singleton with single-flight semantics: a kick while a run is in
// progress marks it dirty and the run goes round again before it stops.
//
// Every failure is labelled with the step it came from, and a failure that
// waiting cannot cure (a wrong argument to a native function, a missing
// function) is fatal at once rather than after eight rounds of backoff.

import NetInfo from "@react-native-community/netinfo";
import * as Legacy from "expo-file-system/legacy";
import { AppState, type AppStateStatus } from "react-native";
import { ApiError, loadSession, post } from "@/api/client";
import type { AssetRow, Presign } from "@/api/types";
import { POLL_MS } from "@/config";
import { deleteLocal } from "@/capture/files";
import { nextRunnable, patchCapture, resetStuck, type CaptureRow } from "@/db/outbox";
import { queryClient } from "@/query/queryClient";
import { sha256Hex } from "./hash";
import { logUpload } from "./log";
import { applyResult, classify, planNext, type Outcome } from "./machine";
import { progress } from "./progress";

const STEP_LABEL: Record<string, string> = { hash: "hash", presign: "presign", put: "upload", confirm: "confirm" };

/** The headers the API issued with this URL. Content-Type is ours; anything
 *  else is the destination's requirement, so a bad row must not block the
 *  upload — fall back to the defaults rather than failing the capture. */
function parseHeaders(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

class Uploader {
  private running = false;
  private dirty = false;
  private online = true;
  private active = true;
  private timer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: (() => void)[] = [];

  start(): void {
    if (this.timer) return;
    this.unsubscribe.push(
      NetInfo.addEventListener((state) => {
        const was = this.online;
        this.online = !!state.isConnected; // not isInternetReachable: pilot Wi-Fi may be LAN-only
        if (!was && this.online) this.kick();
      }),
    );
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      const was = this.active;
      this.active = s === "active";
      if (!was && this.active) this.kick();
    });
    this.unsubscribe.push(() => sub.remove());
    this.timer = setInterval(() => this.kick(), POLL_MS);
    void resetStuck().then(() => this.kick());
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsubscribe.forEach((u) => u());
    this.unsubscribe = [];
  }

  kick(): void {
    if (this.running) {
      this.dirty = true;
      return;
    }
    void this.run();
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      do {
        this.dirty = false;
        if (!this.active || !this.online) break;
        if (!(await loadSession())) break;
        let row: CaptureRow | null;
        while ((row = await nextRunnable(Date.now()))) {
          const progressed = await this.step(row);
          if (!progressed || !this.active || !this.online) break;
        }
      } while (this.dirty);
    } finally {
      this.running = false;
    }
  }

  /** returns false when the row cannot move right now */
  private async step(row: CaptureRow): Promise<boolean> {
    const now = Date.now();
    const action = planNext(row, now);
    let outcome: Outcome;
    try {
      switch (action.type) {
        case "none":
        case "wait":
          return false;
        case "hash":
          outcome = { type: "hashed", sha256: await sha256Hex(this.requireUri(row)) };
          break;
        case "presign": {
          const p = await post<Presign>(`/assignments/${row.assignment_id}/assets/presign`, {
            filename: row.filename,
            content_type: row.mime,
            size_bytes: row.size,
            sha256: row.sha256,
            captured_at: row.captured_at,
            lat: row.lat,
            lon: row.lon,
          });
          outcome = {
            type: "presigned",
            asset_id: p.asset_id,
            url: p.url,
            headers: p.headers ?? {},
            expires_in: p.expires_in,
            status: p.status,
          };
          break;
        }
        case "put":
          outcome = await this.put(row);
          break;
        case "confirm": {
          const a = await post<AssetRow>(`/assets/${row.asset_id}/confirm`);
          if (a.status === "ready") outcome = { type: "confirmed" };
          else if (a.status === "quarantined") outcome = { type: "fatal", error: `confirm: ${a.quarantine_reason ?? "storage rejected the file"}` };
          else outcome = { type: "retryable", error: `confirm: server says ${a.status}` };
          break;
        }
        default:
          return false;
      }
    } catch (e) {
      outcome = this.outcomeFromError(e, action.type);
    }

    logUpload({
      capture: row.id,
      step: STEP_LABEL[action.type] ?? action.type,
      outcome: outcome.type,
      detail: "error" in outcome ? outcome.error : undefined,
    });

    const patch = applyResult(row, outcome, Date.now());
    if (outcome.type === "confirmed") {
      progress.clear(row.id);
      await deleteLocal(row.local_uri);
      patch.local_uri = null;
      void queryClient.invalidateQueries({ queryKey: ["assignment-assets", row.assignment_id] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    }
    await patchCapture(row.id, patch);
    // a row that just failed or was scheduled for later does not block the queue
    return true;
  }

  private requireUri(row: CaptureRow): string {
    if (!row.local_uri) throw new ApiError(410, "the file is no longer on this phone");
    return row.local_uri;
  }

  private async put(row: CaptureRow): Promise<Outcome> {
    if (!row.put_url) return { type: "put_rejected" };
    await patchCapture(row.id, { status: "uploading" });
    const task = Legacy.createUploadTask(
      row.put_url,
      this.requireUri(row),
      {
        httpMethod: "PUT",
        uploadType: Legacy.FileSystemUploadType.BINARY_CONTENT,
        // Whatever the API asked for, not what we assume. Azure refuses an
        // upload without x-ms-blob-type, and only the server knows which
        // storage this particular capture is bound for.
        headers: { "Content-Type": row.mime, ...parseHeaders(row.put_headers) },
      },
      (p) => progress.set(row.id, p.totalBytesSent / Math.max(1, p.totalBytesExpectedToSend)),
    );
    const res = await task.uploadAsync();
    progress.clear(row.id);
    const status = res?.status ?? 0;
    if (status === 200 || status === 204) return { type: "put_ok" };
    if (status === 403) return { type: "put_rejected" };
    return classify(status) === "retryable"
      ? { type: "retryable", error: `upload: storage answered ${status}` }
      : { type: "fatal", error: `upload: storage refused the file (${status}${res?.body ? `: ${res.body.slice(0, 120)}` : ""})` };
  }

  private outcomeFromError(e: unknown, action: string): Outcome {
    const label = STEP_LABEL[action] ?? action;
    if (e instanceof ApiError) {
      if (action === "confirm" && e.status === 409 && /not uploaded/i.test(e.message)) {
        return { type: "not_in_storage" };
      }
      if (e.status === 410) return { type: "fatal", error: `${label}: ${e.message}` };
      return classify(e.status) === "retryable"
        ? { type: "retryable", error: `${label}: ${e.message}` }
        : { type: "fatal", error: `${label}: ${e.message}` };
    }
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    if (/ENOENT|no such file|does not exist|not found/i.test(msg)) {
      return { type: "fatal", error: `${label}: the file is no longer on this phone` };
    }
    // a wrong argument to a native function, or a function that is not there,
    // will not fix itself by waiting
    if (
      e instanceof TypeError ||
      /cannot be converted|is not a function|undefined is not|not a constructor|argument of type/i.test(msg)
    ) {
      return { type: "fatal", error: `${label}: ${msg}` };
    }
    return { type: "retryable", error: `${label}: ${msg}` };
  }
}

export const uploader = new Uploader();
