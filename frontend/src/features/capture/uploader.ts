// The upload loop for the console. A port of the phone's uploader
// (mobile/src/upload/uploader.ts) for a runtime with no SQLite: the queue lives
// in memory, the page reads it through useSyncExternalStore, and what survives
// a refresh is whatever the server already knows (see adopt()).
//
// One singleton, deliberately not React state: uploads must outlive the dialog
// that started them, StrictMode must not start two drivers, and the online /
// visibility listeners want one owner. Dependencies are injected so the tests
// drive it with fakes and fake timers.
//
// Bounded concurrency rather than the phone's one-at-a-time: a laptop on Wi-Fi
// can carry three PUTs, but hashing stays single-file — see config.ts.

import type { AssetRow, Presign } from "@api/types";
import { ApiError, del as apiDel, loadSession, post as apiPost, xhrPut as apiXhrPut, type PutResult } from "@api/client";
import { toCheckPayload } from "./checks";
import { HASH_SLOTS, NET_SLOTS, STALL_MS } from "./config";
import { deriveFacts, type Derived } from "./facts";
import { sha256Hex as realSha256 } from "./hash";
import { admit, type AdmitContext } from "./intake";
import type { QueueItem, Refusal } from "./item";
import { applyResult, classify, planNext, putOutcome, type Action, type Outcome } from "./machine";
import { progress } from "./progress";

export interface Deps {
  post: <T>(path: string, body?: unknown) => Promise<T>;
  del: (path: string) => Promise<unknown>;
  xhrPut: typeof apiXhrPut;
  sha256Hex: (blob: Blob) => Promise<string>;
  derive: (file: File, kind: "photo" | "video") => Promise<Derived>;
  hasSession: () => boolean;
  isOnline: () => boolean;
  now: () => number;
}

export interface QueueSnapshot {
  items: QueueItem[];
  refusals: Refusal[];
}

const STEP_LABEL: Record<string, string> = { hash: "hash", presign: "presign", put: "upload", confirm: "confirm" };

const NO_FILE = "This file is not in the browser any more — pick it again.";
const CORS_HINT =
  "Storage did not accept the upload. The client's storage may not allow uploads from this site — " +
  "use the phone app, or ask for the CORS rule to be added.";

/** Non-terminal: the dialog is `busy` and the row shows a chip while any of these exist. */
export function isActive(i: QueueItem): boolean {
  return i.status !== "confirmed" && i.status !== "failed";
}

export class UploadQueue {
  private items = new Map<string, QueueItem>();
  private refusals: Refusal[] = [];
  private inFlight = new Set<string>();
  private hashing = 0;
  private net = 0;
  private presigning = false;
  private scheduling = false;
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private listeners = new Set<() => void>();
  private confirmedListeners = new Set<(item: QueueItem) => void>();
  private snapshot: QueueSnapshot = { items: [], refusals: [] };
  /** asset_ids the worker removed; a refetch must not resurrect them */
  private discarded = new Set<string>();
  private aborts = new Map<string, AbortController>();

  constructor(private deps: Deps) {}

  // --- lifecycle -----------------------------------------------------------

  start(): void {
    if (this.started) return;
    this.started = true;
    if (typeof window === "undefined") return;
    window.addEventListener("online", () => this.kick());
    window.addEventListener("offline", () => {
      for (const i of this.items.values()) if (isActive(i)) i.saw_offline = true;
      this.publish();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.kick();
    });
    window.addEventListener("beforeunload", (e) => {
      if (![...this.items.values()].some(isActive)) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  // --- what React sees -----------------------------------------------------

  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  getSnapshot = (): QueueSnapshot => this.snapshot;

  onConfirmed(fn: (item: QueueItem) => void): () => void {
    this.confirmedListeners.add(fn);
    return () => {
      this.confirmedListeners.delete(fn);
    };
  }

  private publish(): void {
    this.snapshot = {
      items: [...this.items.values()].sort((a, b) => a.created_at - b.created_at),
      refusals: [...this.refusals],
    };
    this.listeners.forEach((l) => l());
  }

  // --- what the dialog calls -----------------------------------------------

  /** Admit what was picked: queue the survivors, record the rest, get going. */
  async add(assignmentId: string, files: File[], ctx: Omit<AdmitContext, "queued">): Promise<void> {
    const queued = [...this.items.values()].filter((i) => i.assignment_id === assignmentId);
    const { accepted, refused } = await admit(assignmentId, files, { ...ctx, queued }, this.deps.derive, this.deps.now);
    const now = this.deps.now();
    for (const a of accepted) {
      const id = crypto.randomUUID();
      this.items.set(id, {
        id,
        assignment_id: assignmentId,
        file: a.file,
        filename: a.file.name,
        mime: a.derived.mime,
        size: a.file.size,
        captured_at: a.derived.captured_at,
        lat: a.derived.lat,
        lon: a.derived.lon,
        checks: a.checks,
        sha256: null,
        asset_id: null,
        put_url: null,
        put_headers: null,
        url_expires_at: null,
        status: "captured",
        attempts: 0,
        next_attempt_at: 0,
        last_error: null,
        note: null,
        saw_offline: false,
        created_at: now,
      });
    }
    this.refusals.push(...refused);
    this.publish();
    this.kick();
  }

  /** Seed the queue from what the server already holds for this assignment.
   *
   *  After a refresh the bytes of anything mid-flight are gone with the old
   *  page, but a presigned row is still on the server as `pending`, and it
   *  holds a quantity slot until it is confirmed or removed. Each becomes a
   *  file-less item at `uploaded`, so the one thing that can still succeed —
   *  confirm — is tried, and the ones that cannot are shown for removal. */
  adopt(assignmentId: string, rows: AssetRow[]): void {
    let changed = false;
    for (const r of rows) {
      if (r.status !== "pending" || this.discarded.has(r.id)) continue;
      const known = [...this.items.values()].some(
        (i) => i.asset_id === r.id || (i.assignment_id === assignmentId && i.sha256 === r.sha256),
      );
      if (known) continue;
      const id = crypto.randomUUID();
      this.items.set(id, {
        id,
        assignment_id: assignmentId,
        file: null,
        filename: r.filename ?? r.id.slice(0, 8),
        mime: r.mime_type ?? "application/octet-stream",
        size: r.size_bytes ?? 0,
        captured_at: r.captured_at ?? new Date(this.deps.now()).toISOString(),
        lat: r.captured_lat == null ? null : Number(r.captured_lat),
        lon: r.captured_lon == null ? null : Number(r.captured_lon),
        checks: [],
        sha256: r.sha256,
        asset_id: r.id,
        put_url: null,
        put_headers: null,
        url_expires_at: null,
        status: "uploaded",
        attempts: 0,
        next_attempt_at: 0,
        last_error: null,
        note: "Left over from an earlier session",
        saw_offline: false,
        created_at: this.deps.now(),
      });
      changed = true;
    }
    if (changed) {
      this.publish();
      this.kick();
    }
  }

  retry(id: string): void {
    const i = this.items.get(id);
    if (!i || i.status !== "failed" || !i.file) return;
    Object.assign(i, { status: "captured", attempts: 0, next_attempt_at: 0, last_error: null, put_url: null, put_headers: null, url_expires_at: null });
    this.publish();
    this.kick();
  }

  retryAll(assignmentId: string): void {
    for (const i of this.items.values()) {
      if (i.assignment_id === assignmentId && i.status === "failed" && i.file) {
        Object.assign(i, { status: "captured", attempts: 0, next_attempt_at: 0, last_error: null, put_url: null, put_headers: null, url_expires_at: null });
      }
    }
    this.publish();
    this.kick();
  }

  /** Drop an item. A presigned-but-unconfirmed asset is deleted on the server
   *  too, because it occupies one of the assignment's slots; a confirmed one
   *  is the gallery's to remove. */
  async discard(id: string): Promise<void> {
    const i = this.items.get(id);
    if (!i) return;
    this.aborts.get(id)?.abort();
    this.items.delete(id);
    progress.clear(id);
    this.publish();
    if (i.asset_id && i.status !== "confirmed") {
      this.discarded.add(i.asset_id);
      try {
        await this.deps.del(`/assets/${i.asset_id}`);
      } catch {
        // already gone, or not ours to delete any more — either way the slot
        // question is the server's next refetch to answer
      }
    }
    this.kick();
  }

  /** A confirmed row has served its purpose once the gallery shows the asset. */
  forget(id: string): void {
    const i = this.items.get(id);
    if (!i || i.status !== "confirmed") return;
    this.items.delete(id);
    this.publish();
  }

  clearRefusals(assignmentId: string): void {
    this.refusals = this.refusals.filter((r) => r.assignment_id !== assignmentId);
    this.publish();
  }

  // --- the loop ------------------------------------------------------------

  kick(): void {
    if (this.scheduling) {
      this.dirty = true;
      return;
    }
    this.schedule();
  }

  private schedule(): void {
    this.scheduling = true;
    try {
      do {
        this.dirty = false;
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        if (!this.deps.isOnline() || !this.deps.hasSession()) return;
        const now = this.deps.now();
        let earliest = Number.POSITIVE_INFINITY;
        for (const item of this.snapshot.items) {
          if (this.inFlight.has(item.id) || !this.items.has(item.id)) continue;
          const action = planNext(item, now);
          switch (action.type) {
            case "none":
              break;
            case "wait":
              earliest = Math.min(earliest, action.until);
              break;
            case "hash":
              if (this.hashing < HASH_SLOTS) this.dispatch(item, action);
              break;
            case "presign":
              if (!this.presigning && this.net < NET_SLOTS) this.dispatch(item, action);
              break;
            case "put":
            case "confirm":
              if (this.net < NET_SLOTS) this.dispatch(item, action);
              break;
          }
        }
        if (Number.isFinite(earliest)) {
          this.timer = setTimeout(() => this.kick(), Math.max(0, earliest - now));
        }
      } while (this.dirty);
    } finally {
      this.scheduling = false;
    }
  }

  private dispatch(item: QueueItem, action: Action): void {
    // A file-less item can only ever be confirmed. Anything else would need
    // the bytes, which left with the old page.
    if (!item.file && action.type !== "confirm") {
      Object.assign(item, { status: "failed", last_error: NO_FILE });
      this.publish();
      return;
    }
    this.inFlight.add(item.id);
    if (action.type === "hash") this.hashing++;
    else {
      this.net++;
      if (action.type === "presign") this.presigning = true;
    }
    void this.run(item, action).finally(() => {
      this.inFlight.delete(item.id);
      if (action.type === "hash") this.hashing--;
      else {
        this.net--;
        if (action.type === "presign") this.presigning = false;
      }
      this.kick();
    });
  }

  private async run(item: QueueItem, action: Action): Promise<void> {
    let outcome: Outcome | null;
    try {
      outcome = await this.step(item, action);
    } catch (e) {
      outcome = this.outcomeFromError(e, action.type);
    }
    // discarded while in flight: nothing to record
    if (outcome === null || !this.items.has(item.id)) return;

    // The hash is the moment two picks of one file become one upload.
    if (outcome.type === "hashed") {
      const twin = [...this.items.values()].find(
        (o) => o.id !== item.id && o.assignment_id === item.assignment_id && o.sha256 === outcome!.sha256,
      );
      if (twin) {
        if (!twin.file && twin.status === "failed") {
          // the leftover from an earlier session: give it its bytes back
          Object.assign(twin, { file: item.file, status: "captured", attempts: 0, next_attempt_at: 0, last_error: null, note: null, put_url: null, put_headers: null, url_expires_at: null });
        } else {
          this.refusals.push({
            id: `r${this.deps.now()}-${item.id.slice(0, 8)}`,
            assignment_id: item.assignment_id,
            filename: item.filename,
            size: item.size,
            findings: [{ code: "duplicate", severity: "block", message: `${item.filename} is the same file as one already queued.` }],
            at: this.deps.now(),
          });
        }
        this.items.delete(item.id);
        this.publish();
        return;
      }
    }

    const now = this.deps.now();
    const patch = applyResult(item, outcome, now);

    // A leftover with no bytes cannot go round again.
    if (!item.file && (patch.status === "presigned" || patch.status === "captured")) {
      Object.assign(patch, { status: "failed", last_error: NO_FILE, next_attempt_at: 0 });
    }
    // A PUT answered by nothing at all, twice, with the browser online
    // throughout: a network blip does not usually do that, a bucket without a
    // CORS rule for this origin always does. Stop early and say so — eight
    // rounds of backoff would take ten minutes to reach the same message.
    if (
      patch.status !== "failed" &&
      outcome.type === "retryable" &&
      /storage answered 0/.test(outcome.error) &&
      (patch.attempts ?? 0) >= 2 &&
      !item.saw_offline
    ) {
      Object.assign(patch, { status: "failed", last_error: CORS_HINT, next_attempt_at: 0 });
    }

    Object.assign(item, patch);
    this.publish();
    if (item.status === "confirmed") this.confirmedListeners.forEach((fn) => fn(item));
  }

  private async step(item: QueueItem, action: Action): Promise<Outcome | null> {
    switch (action.type) {
      case "hash":
        return { type: "hashed", sha256: await this.deps.sha256Hex(item.file!) };
      case "presign": {
        const p = await this.deps.post<Presign>(`/assignments/${item.assignment_id}/assets/presign`, {
          filename: item.filename,
          content_type: item.mime,
          size_bytes: item.size,
          sha256: item.sha256,
          captured_at: item.captured_at,
          lat: item.lat,
          lon: item.lon,
          // what the browser found before queueing; lands in asset.check_results
          checks: toCheckPayload(item.checks),
        });
        return { type: "presigned", asset_id: p.asset_id, url: p.url, headers: p.headers ?? {}, expires_in: p.expires_in, status: p.status };
      }
      case "put":
        return this.put(item);
      case "confirm": {
        const a = await this.deps.post<AssetRow>(`/assets/${item.asset_id}/confirm`);
        if (a.status === "ready") return { type: "confirmed" };
        if (a.status === "quarantined") return { type: "fatal", error: `confirm: ${a.quarantine_reason ?? "storage rejected the file"}` };
        return { type: "retryable", error: `confirm: server says ${a.status}` };
      }
      default:
        return null;
    }
  }

  private async put(item: QueueItem): Promise<Outcome> {
    if (!item.put_url) return { type: "put_rejected" };
    Object.assign(item, { status: "uploading" });
    this.publish();
    const ac = new AbortController();
    this.aborts.set(item.id, ac);
    try {
      const res: PutResult = await this.deps.xhrPut(item.put_url, item.file!, item.put_headers ?? {}, {
        onProgress: (sent, total) => progress.set(item.id, sent / Math.max(1, total)),
        signal: ac.signal,
        stallMs: STALL_MS,
      });
      // The status-to-outcome decision lives in machine.ts so it is
      // unit-tested alongside the rest of the state machine.
      return putOutcome(res.status, res.body);
    } finally {
      progress.clear(item.id);
      this.aborts.delete(item.id);
    }
  }

  private outcomeFromError(e: unknown, action: string): Outcome | null {
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
    if (e instanceof DOMException) {
      // our own discard, mid-PUT
      if (e.name === "AbortError") return null;
      // Chrome, when the file changed on disk after it was picked
      if (e.name === "NotReadableError" || e.name === "NotFoundError") {
        return { type: "fatal", error: `${label}: the file changed on disk since it was picked — pick it again` };
      }
    }
    // Unlike the phone, a TypeError here is what fetch throws for a network
    // failure ("Failed to fetch"), not a wrong argument to a native call.
    // Waiting can cure it.
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return { type: "retryable", error: `${label}: ${msg}` };
  }
}

export const uploadQueue = new UploadQueue({
  post: apiPost,
  del: apiDel,
  xhrPut: apiXhrPut,
  sha256Hex: realSha256,
  derive: deriveFacts,
  hasSession: () => loadSession() !== null,
  isOnline: () => (typeof navigator === "undefined" ? true : navigator.onLine !== false),
  now: Date.now,
});
