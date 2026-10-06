// Where a capture says it was taken. A position kept warm while the camera is
// open is used as is; a slow fresh request falls back to the last known one,
// which is stale only when it is actually old.

const mockCurrent = jest.fn();
const mockLast = jest.fn();
jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  getCurrentPositionAsync: (...a: unknown[]) => mockCurrent(...a),
  getLastKnownPositionAsync: (...a: unknown[]) => mockLast(...a),
}));

import { currentFix, type Fix } from "../src/capture/location";

const loc = (ageMs: number) => ({ coords: { latitude: 12.9, longitude: 77.6, accuracy: 20 }, timestamp: Date.now() - ageMs });
const never = () => new Promise(() => {});

beforeEach(() => {
  mockCurrent.mockReset();
  mockLast.mockReset();
});

describe("the position stamped on a capture", () => {
  it("uses a warm fix under 30 s old without asking the phone", async () => {
    const warm: Fix = { lat: 1, lon: 2, accuracy: 10, stale: false, at: Date.now() - 5_000 };
    const f = await currentFix(warm);
    expect(f).toMatchObject({ lat: 1, stale: false });
    expect(mockCurrent).not.toHaveBeenCalled();
  });

  it("a slow fresh request falls back to a recent last-known fix, not stale", async () => {
    mockCurrent.mockImplementation(never);
    mockLast.mockResolvedValue(loc(10_000));
    expect(await currentFix(null, 10)).toMatchObject({ stale: false });
  });

  it("a last-known fix 10 minutes old is stale", async () => {
    mockCurrent.mockImplementation(never);
    mockLast.mockResolvedValue(loc(600_000));
    expect(await currentFix(null, 10)).toMatchObject({ stale: true });
  });

  it("a fresh fix is fresh", async () => {
    mockCurrent.mockResolvedValue(loc(0));
    expect(await currentFix(null, 1000)).toMatchObject({ stale: false, lat: 12.9 });
  });

  it("no position at all is null", async () => {
    mockCurrent.mockImplementation(never);
    mockLast.mockResolvedValue(null);
    expect(await currentFix(null, 10)).toBeNull();
  });
});
