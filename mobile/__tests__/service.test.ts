// The Android foreground service's lifecycle, against a fake of the library.
// What is guarded: the service is started once and stopped once; a release
// is honoured even when the OS stopped the service without saying so (the
// flag is cleared, the next hold starts afresh); a task left over from an
// earlier hold never stops the service a later hold owns.

import { Platform } from "react-native";
// jest.mock calls are hoisted above every import, so the module under test
// sees the fakes below even though it is imported here
import { uploadService } from "../src/upload/service";

type Task = () => Promise<void>;
const lib = {
  starts: [] as unknown[],
  stops: 0,
  tasks: [] as Task[],
  refuse: false,
};

jest.mock("react-native-background-actions", () => ({
  __esModule: true,
  default: {
    start: jest.fn(async (task: Task, options: unknown) => {
      if (lib.refuse) throw new Error("ForegroundServiceStartNotAllowedException");
      lib.starts.push(options);
      lib.tasks.push(task);
    }),
    stop: jest.fn(async () => {
      lib.stops++;
    }),
    updateNotification: jest.fn(async () => undefined),
    isRunning: jest.fn(() => true),
  },
}));

const box = { queued: 2 };
jest.mock("../src/db/outbox", () => ({
  summary: async () => ({ queued: box.queued, failed: 0, confirmed: 0 }),
}));

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(async () => {
  Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
  lib.starts = [];
  lib.stops = 0;
  lib.tasks = [];
  lib.refuse = false;
  box.queued = 2;
  await uploadService.release();
  lib.stops = 0;
});

describe("uploadService", () => {
  it("starts the service once however often it is held, and stops it on release", async () => {
    await uploadService.hold();
    await uploadService.hold();
    await uploadService.hold();
    expect(lib.starts).toHaveLength(1);
    expect(uploadService.held).toBe(true);
    expect((lib.starts[0] as { foregroundServiceType: string[] }).foregroundServiceType).toEqual(["dataSync"]);
    await uploadService.release();
    expect(uploadService.held).toBe(false);
    expect(lib.stops).toBe(1);
    // a second release is nothing
    await uploadService.release();
    expect(lib.stops).toBe(1);
  });

  it("takes the service afresh after a release, even one the OS forced", async () => {
    await uploadService.hold();
    // Android stopped the service on its own (six-hour budget): the library
    // tells nobody. The app comes back in front, releases, the next step holds.
    await uploadService.release();
    await uploadService.hold();
    expect(lib.starts).toHaveLength(2);
    expect(uploadService.held).toBe(true);
  });

  it("lets go by itself once the outbox has drained", async () => {
    await uploadService.hold();
    box.queued = 0;
    await lib.tasks[0]!();
    expect(uploadService.held).toBe(false);
    expect(lib.stops).toBe(1);
  });

  it("a task left from an earlier hold never stops the service a later hold owns", async () => {
    await uploadService.hold();
    const stale = lib.tasks[0]!;
    await uploadService.release();
    await uploadService.hold();
    expect(lib.stops).toBe(1);
    box.queued = 0;
    await stale(); // the old task ends: it must not touch the new service
    expect(lib.stops).toBe(1);
    expect(uploadService.held).toBe(true);
    await lib.tasks[1]!(); // the owner drains and lets go
    expect(lib.stops).toBe(2);
    expect(uploadService.held).toBe(false);
  });

  it("a refused start leaves the loop foreground only", async () => {
    lib.refuse = true;
    await uploadService.hold();
    await flush();
    expect(uploadService.held).toBe(false);
    expect(lib.starts).toHaveLength(0);
  });

  it("does nothing on a platform without the service", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    expect(uploadService.available).toBe(false);
    await uploadService.hold();
    expect(lib.starts).toHaveLength(0);
    expect(uploadService.held).toBe(false);
  });
});
