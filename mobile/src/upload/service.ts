// The Android foreground service that keeps uploads going when the app is not
// in front. The upload loop (uploader.ts) runs in JavaScript, and Android
// stops a backgrounded app's JavaScript within a minute unless a foreground
// service — a notification the user can see — says work is in progress. This
// starts one whenever a run begins while the app is in front, keeps it until
// the outbox has nothing left to send, and shows how far along things are.
// While it is held the loop treats "in the background" as "in front".
//
// Started from the foreground only: Android 12+ refuses to start one from the
// background, so it is taken the moment a run begins rather than when the
// worker switches away. Android 15 allows a dataSync service six hours in any
// twenty-four; past that the OS stops it, the loop goes back to foreground
// only until the app is opened again, and resume covers the gap. iOS has no
// equivalent here: an in-flight chunk completes under the background session
// and the next waits for the foreground (UploaderMount keeps the screen on).

import { Platform } from "react-native";
import BackgroundService from "react-native-background-actions";
import { summary } from "@/db/outbox";
import { uploadsLine } from "./words";

const TASK = {
  taskName: "uploads",
  taskTitle: "Uploading captures",
  // the icon expo-notifications already puts in the build (app.json plugins)
  taskIcon: { name: "notification_icon", type: "drawable" },
  color: "#091CFF",
  linkingURI: "cosarathi://assignments",
  foregroundServiceType: ["dataSync" as const],
};

/** how often the service checks whether the outbox has drained */
const DRAIN_POLL_MS = 3_000;
/** the service lets go when nothing queued may move for longer than this */
const IDLE_RELEASE_MS = 2 * 60_000;
/** the notification is redrawn at most this often */
const REPORT_MS = 1_000;

class UploadService {
  /** whether the service is up: the loop keeps running in the background while it is */
  held = false;
  /** Bumped by every hold and release. The task a hold started checks it, so
   *  a task left over from an earlier hold ends itself without stopping the
   *  service a later hold owns. */
  private gen = 0;
  /** start and stop never overlap: a stop still in flight would otherwise end
   *  the service a hold had just started */
  private op: Promise<void> = Promise.resolve();
  private lastReport = 0;
  private lastLine = "";

  get available(): boolean {
    return Platform.OS === "android";
  }

  /** Take the service, if it is not held already. Best effort: an OS that
   *  refuses (started from the background, the daily budget spent) leaves the
   *  loop as it was, foreground only. */
  async hold(): Promise<void> {
    if (!this.available || this.held) return;
    this.held = true;
    const gen = ++this.gen;
    this.op = this.op.then(async () => {
      if (this.gen !== gen) return; // released again before the start could run
      try {
        await BackgroundService.start(() => this.untilDrained(gen), {
          ...TASK,
          taskDesc: "Starting…",
          progressBar: { max: 100, value: 0, indeterminate: true },
        });
      } catch {
        if (this.gen === gen) this.held = false;
      }
    });
    await this.op;
  }

  /** Let the service go. The loop calls this when the queue cannot move —
   *  offline, signed out, halted — since a held service only keeps the phone
   *  awake for nothing then; and each time the app comes back in front,
   *  because Android may have stopped the service while the app was away
   *  (the daily budget spent) without telling this side, and a flag left
   *  standing would keep every later hold from happening. The next step in
   *  front takes it afresh. */
  async release(): Promise<void> {
    if (!this.available || !this.held) return;
    this.held = false;
    this.gen++;
    this.op = this.op.then(() => BackgroundService.stop().catch(() => undefined));
    await this.op;
  }

  /** the task the service runs: wait until nothing is queued, then let go */
  private async untilDrained(gen: number): Promise<void> {
    try {
      while (this.held && this.gen === gen) {
        const box = await summary();
        if (box.queued === 0) break;
        // Everything left is waiting out a long backoff — a server failing the
        // same way again and again. Holding the service (and its notification,
        // and the phone awake) for that spends the daily budget on nothing;
        // the rows go when the app is next opened, or at once on "Upload now".
        if (box.nextDue != null && box.nextDue - Date.now() > IDLE_RELEASE_MS) break;
        await new Promise((r) => setTimeout(r, DRAIN_POLL_MS));
      }
    } finally {
      // drained: let go. Released or re-held meanwhile: the newer hold owns
      // the service, and this task simply ends.
      if (this.held && this.gen === gen) await this.release();
    }
  }

  /** what the notification says: how many are left and how far the current one is */
  report(left: number, fraction: number): void {
    if (!this.held) return;
    const now = Date.now();
    const line = uploadsLine(left, fraction);
    if (line === this.lastLine || now - this.lastReport < REPORT_MS) return;
    this.lastReport = now;
    this.lastLine = line;
    void BackgroundService.updateNotification({
      taskDesc: line,
      progressBar: { max: 100, value: Math.round(fraction * 100) },
    }).catch(() => undefined);
  }
}

export const uploadService = new UploadService();
