// The upload loop. Two lanes, kicked by every event that could make progress
// possible: a new capture, the app coming to the front, the network coming
// back, a 30-second timer, a tap on Retry.
//
// It is a singleton with single-flight semantics: a kick while a run is in
// progress marks it dirty and the run goes round again before it stops.
//
// Two lanes rather than one. Lane A takes the oldest row that can move, lane
// B the smallest, so a clip of a gigabyte in one lane never holds up the
// photos queued behind it. A row is claimed under a lock before either lane
// touches it, so the two never pick the same one. A chunked upload moves one
// batch of parts per step and is then re-picked, so the other lane keeps
// taking photos between its chunks.
//
// It runs while the app is in front and online — or, on Android, while the
// foreground service holds it (service.ts), which is how a worker can lock
// the phone or switch apps and still have the queue drain.
//
// Every failure is labelled with the step it came from. A failure that
// waiting cannot cure (a wrong argument to a native function, a missing file)
// is fatal at once; a poor connection never is — the row waits with backoff
// and is tried again (machine.ts). A 401 is about the session, not the row:
// the run halts and leaves every row as it was for the next sign-in. A
// transfer that stops moving is cancelled after PUT_STALL_MS and retried like
// any network failure, so a dead socket cannot hold a lane open.

import NetInfo from "@react-native-community/netinfo";
import * as Legacy from "expo-file-system/legacy";
import { AppState, type AppStateStatus } from "react-native";
import { ApiError, get, loadSession, post } from "@/api/client";
import type { AssetRow, Presign } from "@/api/types";
import { CHUNK_BYTES, PARTS_IN_FLIGHT_CELL, PARTS_IN_FLIGHT_WIFI, POLL_MS, PRESIGN_SAFETY_MS, PUT_STALL_MS } from "@/config";
import { deleteLocal } from "@/capture/files";
import { type CaptureRow, flagResumableForStatus, nextRunnable, patchCapture, type QueueOrder, resetStuck } from "@/db/outbox";
import { queryClient } from "@/query/queryClient";
import { dropPart, partHeaders, readRange, sendPart, stagePart } from "./chunks";
import { sha256Hex } from "./hash";
import { logUpload } from "./log";
import {
  type Action,
  apiOutcome,
  applyResult,
  chunkOutcome,
  isChunked,
  type Outcome,
  planNext,
  putOutcome,
  wantsChunks,
} from "./machine";
import { completeFraction, gcsRange, parseUrls, partRange } from "./parts";
import { progress } from "./progress";
import { uploadService } from "./service";

const STEP_LABEL: Record<string, string> = {
  hash: "hash",
  presign: "presign",
  put: "upload",
  confirm: "confirm",
  query: "status",
  part_urls: "links",
  chunk: "upload",
};

/** the lanes, by how each picks its next row */
const LANES: QueueOrder[] = ["oldest", "smallest"];

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

/** The device's own findings about this capture. A row that cannot be read
 *  must not cost the worker the upload, so an unparseable column reports
 *  nothing rather than failing the presign. */
function parseChecks(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

class Uploader {
  private running = false;
  private dirty = false;
  private online = true;
  private active = true;
  /** what the phone is connected through, for how many parts go at once */
  private netType: string | null = null;
  /** set by a 401: no lane takes another row until the next run */
  private halted = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: (() => void)[] = [];
  /** rows a lane is working on, so the other lane skips them */
  private inFlight = new Set<string>();
  /** claims are serialised: two lanes asking at once must not get one row */
  private claiming: Promise<unknown> = Promise.resolve();
  /** whether a lane is moving a row — what holds the service or the screen (UploaderMount) */
  private busy = false;
  private busyListeners = new Set<(busy: boolean) => void>();

  start(): void {
    if (this.timer) return;
    this.unsubscribe.push(
      NetInfo.addEventListener((state) => {
        const was = this.online;
        this.online = !!state.isConnected; // not isInternetReachable: pilot Wi-Fi may be LAN-only
        this.netType = state.type;
        if (!was && this.online) {
          // across a gap the phone's count of what landed may be wrong:
          // every chunked upload asks storage before sending another byte
          void flagResumableForStatus().then(() => this.kick());
        }
      }),
    );
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      const was = this.active;
      this.active = s === "active";
      if (!was && this.active) {
        // Back in front. The Android service is let go and taken afresh by
        // the next step (lane): the OS may have stopped it while the app was
        // away — the daily budget spent — without telling this side, and a
        // flag left standing would keep the next hold from ever happening.
        void uploadService.release().then(() => this.kick());
      }
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

  /** Told when the loop starts and stops moving rows, and the current state
   *  at once. "Moving" means a lane holds a row: not a backoff wait, not a
   *  queue waiting for a connection. */
  onBusy(fn: (busy: boolean) => void): () => void {
    this.busyListeners.add(fn);
    fn(this.busy);
    return () => {
      this.busyListeners.delete(fn);
    };
  }

  private setBusy(v: boolean): void {
    if (v === this.busy) return;
    this.busy = v;
    this.busyListeners.forEach((fn) => fn(v));
  }

  /** in front, or held in the background by the Android service */
  private get awake(): boolean {
    return this.active || uploadService.held;
  }

  /** parts of one chunked upload sent at once: more on Wi-Fi, one on data */
  private partsAtOnce(): number {
    return this.netType === "wifi" || this.netType === "ethernet" ? PARTS_IN_FLIGHT_WIFI : PARTS_IN_FLIGHT_CELL;
  }

  private async run(): Promise<void> {
    this.running = true;
    // the queue cannot move until the connection or the sign-in is back, which
    // takes the worker's hand or the OS's: nothing for a held service to do
    let stuck = false;
    try {
      do {
        this.dirty = false;
        this.halted = false;
        if (!this.awake) break;
        if (!this.online || !(await loadSession())) {
          stuck = true;
          break;
        }
        await Promise.all(LANES.map((order) => this.lane(order)));
        if (this.halted || !this.online) stuck = true;
      } while (this.dirty);
    } finally {
      this.setBusy(false);
      this.running = false;
      if (stuck) void uploadService.release();
    }
  }

  /** One lane: claim a row, move it one step, repeat until nothing is
   *  runnable or the run can no longer make progress. */
  private async lane(order: QueueOrder): Promise<void> {
    let row: CaptureRow | null;
    while (!this.halted && this.awake && this.online && (row = await this.claim(order))) {
      this.setBusy(true);
      // Android: the foreground service is taken while the app is in front —
      // the only time the OS allows it — so the lanes outlive the worker
      // switching away. A no-op while it is held.
      if (this.active) void uploadService.hold();
      let progressed: boolean;
      try {
        progressed = await this.step(row);
      } finally {
        this.inFlight.delete(row.id);
      }
      if (!progressed) break;
    }
  }

  private claim(order: QueueOrder): Promise<CaptureRow | null> {
    const next = this.claiming.then(async () => {
      const row = await nextRunnable(Date.now(), [...this.inFlight], order);
      if (row) this.inFlight.add(row.id);
      return row;
    });
    this.claiming = next.catch(() => null);
    return next;
  }

  /** returns false when the row cannot move right now */
  private async step(row: CaptureRow): Promise<boolean> {
    const action = planNext(row, Date.now(), PRESIGN_SAFETY_MS, this.partsAtOnce());
    if (action.type === "none" || action.type === "wait") return false;
    let outcomes: Outcome[];
    try {
      outcomes = await this.perform(row, action);
    } catch (e) {
      outcomes = [this.outcomeFromError(e, action.type, row)];
    }

    for (const outcome of outcomes) {
      logUpload({
        capture: row.id,
        step: STEP_LABEL[action.type] ?? action.type,
        outcome: outcome.type,
        detail: "error" in outcome ? outcome.error : undefined,
      });
    }

    if (outcomes.some((o) => o.type === "halt")) {
      // the session is gone, not the capture: nothing is written to the row
      this.halted = true;
      return false;
    }

    // Several chunks may have been in flight at once: the parts that landed
    // are recorded first, then whatever went wrong with the rest, so a
    // failure on one part never throws away the others' progress.
    const landed = outcomes.filter((o) => o.type === "chunk_ok");
    const rest = outcomes.filter((o) => o.type !== "chunk_ok");
    let merged: CaptureRow = row;
    const patch: Partial<CaptureRow> = {};
    for (const outcome of [...landed, ...rest.slice(0, 1)]) {
      const p = applyResult(merged, outcome, Date.now());
      Object.assign(patch, p);
      merged = { ...merged, ...p };
    }
    if (outcomes.some((o) => o.type === "confirmed")) {
      progress.clear(row.id);
      await deleteLocal(row.local_uri);
      patch.local_uri = null;
      void queryClient.invalidateQueries({ queryKey: ["assignment-assets", row.assignment_id] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    } else if (patch.status === "failed") {
      progress.clear(row.id);
    }
    await patchCapture(row.id, patch);
    // a row that just failed or was scheduled for later does not block the queue
    return true;
  }

  private async perform(row: CaptureRow, action: Action): Promise<Outcome[]> {
    switch (action.type) {
      case "hash":
        return [{ type: "hashed", sha256: await sha256Hex(this.requireUri(row)) }];
      case "presign": {
        const p = await post<Presign>(`/assignments/${row.assignment_id}/assets/presign`, {
          filename: row.filename,
          content_type: row.mime,
          size_bytes: row.size,
          // the phone's own id names the capture; a small file adds its hash
          client_capture_id: row.id,
          ...(row.sha256 ? { sha256: row.sha256 } : {}),
          // a big file goes up in chunks against a session storage keeps;
          // restart says the session the phone had is gone (machine.ts)
          resumable: wantsChunks(row),
          restart: row.restart === 1,
          captured_at: row.captured_at,
          lat: row.lat,
          lon: row.lon,
          // what the phone found before queueing; lands in asset.check_results
          checks: parseChecks(row.checks),
          // a retake names the capture it replaces (db/350)
          ...(row.replaces_asset_id ? { replaces_asset_id: row.replaces_asset_id } : {}),
          // a clip's running time: a share in hours is counted in it (db/510)
          ...(row.duration_s ? { duration_s: Math.round(row.duration_s * 100) / 100 } : {}),
        });
        return [
          {
            type: "presigned",
            asset_id: p.asset_id,
            url: p.url,
            headers: p.headers ?? {},
            expires_in: p.expires_in,
            status: p.status,
            upload: p.method === "RESUMABLE" ? (p.upload ?? null) : null,
          },
        ];
      }
      case "put":
        return [await this.put(row)];
      case "query": {
        const st = await get<{ bytes_done: number | null; parts_done: number[] }>(`/assets/${row.asset_id}/upload/status`);
        return [{ type: "status_known", bytes_done: st.bytes_done, parts_done: st.parts_done ?? [] }];
      }
      case "part_urls": {
        const r = await post<{ urls: Record<string, string>; expires_in: number }>(`/assets/${row.asset_id}/upload/urls`, {
          parts: action.parts,
        });
        return [{ type: "part_urls", urls: r.urls, expires_in: r.expires_in }];
      }
      case "chunk":
        return this.sendChunks(row, action.parts, action.from);
      case "confirm": {
        const a = await post<AssetRow>(`/assets/${row.asset_id}/confirm`);
        if (a.status === "ready") return [{ type: "confirmed" }];
        if (a.status === "quarantined") return [{ type: "fatal", error: `confirm: ${a.quarantine_reason ?? "storage rejected the file"}` }];
        return [{ type: "retryable", error: `confirm: server says ${a.status}` }];
      }
      default:
        return [];
    }
  }

  private requireUri(row: CaptureRow): string {
    if (!row.local_uri) throw new Error("the file is no longer on this phone");
    return row.local_uri;
  }

  private async put(row: CaptureRow): Promise<Outcome> {
    if (!row.put_url) return { type: "put_rejected" };
    await patchCapture(row.id, { status: "uploading" });
    // A PUT that stops moving is cancelled rather than waited on. A dead
    // connection can hold a socket open for a long time, and until it closes
    // this lane does nothing. Cancelled, the task comes back without a status
    // and is retried with backoff like any other network failure. Progress
    // re-arms the watchdog, so a slow link that is still moving is left alone.
    let task: Legacy.UploadTask | null = null;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      if (watchdog) clearTimeout(watchdog);
      watchdog = setTimeout(() => void task?.cancelAsync().catch(() => undefined), PUT_STALL_MS);
    };
    task = Legacy.createUploadTask(
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
      (p) => {
        arm();
        progress.set(row.id, p.totalBytesSent / Math.max(1, p.totalBytesExpectedToSend));
      },
    );
    arm();
    try {
      const res = await task.uploadAsync();
      // The status-to-outcome decision lives in machine.ts so it is unit-tested
      // alongside the rest of the state machine.
      return putOutcome(res?.status, res?.body);
    } finally {
      if (watchdog) clearTimeout(watchdog);
      progress.clear(row.id);
    }
  }

  /** The parts of a chunked upload planned for this step, sent together.
   *  Each is read from its offset, staged as its own small file, PUT with the
   *  protocol's headers, and dropped. Progress is what storage holds plus
   *  what is in flight, so the tile moves while a long clip goes up. */
  private async sendChunks(row: CaptureRow, parts: number[], from?: number): Promise<Outcome[]> {
    const protocol = row.upload_protocol;
    if (!protocol) return [{ type: "fatal", error: "upload: the row has no protocol" }];
    const chunk = row.chunk_size ?? CHUNK_BYTES;
    const uri = this.requireUri(row);
    const urls = parseUrls(row.part_urls);
    const landed = completeFraction(row);
    // Azure and S3 take whole parts; Google takes the next chunk from exactly
    // the byte it said it holds, which after a cut is inside a part
    const rangeOf = (n: number) =>
      protocol === "gcs" ? gcsRange(from ?? row.bytes_done, row.size, chunk) : partRange(n, row.size, chunk);
    const inflight = new Map<number, number>();
    const publish = () => {
      let sent = 0;
      inflight.forEach((f, n) => (sent += f * rangeOf(n).length));
      progress.set(row.id, Math.min(1, landed + sent / row.size));
    };
    await patchCapture(row.id, { status: "uploading" });
    publish();
    const one = async (n: number): Promise<Outcome> => {
      const url = protocol === "gcs" ? row.session_url : urls[n]?.url;
      if (!url) return protocol === "gcs" ? { type: "session_lost" } : { type: "part_rejected", part: n };
      const range = rangeOf(n);
      const bytes = readRange(uri, range);
      const staged = stagePart(row.id, n, bytes);
      try {
        const headers = await partHeaders(protocol, range, row.size, bytes, row.mime);
        const r = await sendPart(staged, url, headers, (f) => {
          inflight.set(n, f);
          publish();
        });
        return chunkOutcome(protocol, n, row.size, r.status, r.headers, r.body);
      } catch (e) {
        return this.outcomeFromError(e, "chunk", row);
      } finally {
        dropPart(staged);
      }
    };
    return Promise.all(parts.map(one));
  }

  private outcomeFromError(e: unknown, action: string, row: CaptureRow): Outcome {
    const label = STEP_LABEL[action] ?? action;
    if (e instanceof ApiError) {
      if (action === "confirm" && e.status === 409 && /not uploaded/i.test(e.message)) {
        return { type: "not_in_storage" };
      }
      // the steps that continue a chunked upload: a row the server no longer
      // has (404) means a fresh start, not a failure (machine.ts apiOutcome)
      const resuming = action === "query" || action === "part_urls";
      return apiOutcome(e.status, label, e.message, isChunked(row), resuming);
    }
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    if (/ENOENT|no such file|does not exist|not found|no longer on this phone/i.test(msg)) {
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
