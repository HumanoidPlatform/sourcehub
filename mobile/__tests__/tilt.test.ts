import { anglesFrom, heldOrientation, medianOff } from "@/capture/tilt";

// Gravity as the accelerometer reports it, in G. The device frame: x to the
// right of the screen, y up the screen, z out of the screen towards the user.
// A vector is written here the way the phone would actually feel it.
const g = (deg: number) => (deg * Math.PI) / 180;

/** Phone upright, rolled `deg` clockwise about the camera axis. */
const rolled = (deg: number) => ({ x: Math.sin(g(deg)), y: -Math.cos(g(deg)), z: 0 });

/** Phone upright and level, tipped back `deg` so the camera looks upward. */
const tipped = (deg: number) => ({ x: 0, y: -Math.cos(g(deg)), z: Math.sin(g(deg)) });

const near = (got: number | undefined, want: number) => expect(got).toBeCloseTo(want, 4);

describe("anglesFrom", () => {
  it("reads a phone held upright and square as level", () => {
    const t = anglesFrom(0, -1, 0);
    near(t?.roll, 0);
    near(t?.pitch, 0);
    near(t?.off, 0);
  });

  // The case the fold exists for. A phone in landscape is rotated a quarter
  // turn and is perfectly level; measuring roll against zero would flag every
  // landscape shot — which is the orientation a shelf task asks for.
  it("reads landscape as level, not as 90 degrees off", () => {
    near(anglesFrom(-1, 0, 0)?.off, 0); // turned one way
    near(anglesFrom(1, 0, 0)?.off, 0); // and the other
  });

  it("reads upside down as level too", () => {
    near(anglesFrom(0, 1, 0)?.off, 0);
  });

  it("measures roll within a quarter turn", () => {
    near(anglesFrom(rolled(15).x, rolled(15).y, rolled(15).z)?.roll, 15);
    near(anglesFrom(rolled(-12).x, rolled(-12).y, rolled(-12).z)?.roll, -12);
  });

  it("measures the same roll when the phone is in landscape", () => {
    // upright rolled 10, then turned a quarter: x and y swap roles
    const r = rolled(100);
    near(anglesFrom(r.x, r.y, r.z)?.roll, 10);
  });

  it("measures pitch away from vertical", () => {
    const t = tipped(20);
    near(anglesFrom(t.x, t.y, t.z)?.pitch, 20);
    near(anglesFrom(t.x, t.y, t.z)?.off, 20);
  });

  it("reads a phone flat on a table as fully off square", () => {
    // the camera points straight down, not at a wall
    near(Math.abs(anglesFrom(0, 0, -1)!.pitch), 90);
    near(anglesFrom(0, 0, -1)?.off, 90);
  });

  it("takes the worse of the two angles", () => {
    // rolled 5, tipped 25 — a single tolerance should see the 25
    const t = anglesFrom(Math.sin(g(5)), -Math.cos(g(5)) * Math.cos(g(25)), Math.sin(g(25)));
    expect(t!.off).toBeGreaterThan(24);
    expect(t!.off).toBeLessThan(26);
  });

  // iOS and Android disagree about which way the accelerometer points. The
  // fold makes roll immune (180 is a multiple of the quarter turn) and pitch
  // only ever reaches a caller through its absolute value, so the verdict must
  // not move when the whole vector flips.
  it("gives the same verdict whichever sign convention the platform uses", () => {
    for (const v of [rolled(15), tipped(20), { x: 0.2, y: -0.9, z: 0.3 }]) {
      const a = anglesFrom(v.x, v.y, v.z)!;
      const b = anglesFrom(-v.x, -v.y, -v.z)!;
      near(b.roll, a.roll);
      near(Math.abs(b.pitch), Math.abs(a.pitch));
      near(b.off, a.off);
    }
  });

  // A fabricated zero would read as "perfectly square" and quietly pass.
  it("says nothing when the vector cannot mean anything", () => {
    expect(anglesFrom(0, 0, 0)).toBeNull();
    expect(anglesFrom(0.01, 0, 0)).toBeNull();
    expect(anglesFrom(NaN, 0, 0)).toBeNull();
  });
});

// Which way up the phone is, from gravity alone. The orientation check reads
// this rather than the recording's own frame — see validation/rules.ts.
describe("heldOrientation", () => {
  it("calls a phone held upright portrait, and one on its side landscape", () => {
    expect(heldOrientation(0, -1, 0)).toBe("portrait");
    expect(heldOrientation(0, 1, 0)).toBe("portrait");
    expect(heldOrientation(-1, 0, 0)).toBe("landscape");
    expect(heldOrientation(1, 0, 0)).toBe("landscape");
  });

  it("still answers when the phone is also pitched back", () => {
    expect(heldOrientation(0.05, -0.7, 0.7)).toBe("portrait");
    expect(heldOrientation(-0.7, 0.05, 0.7)).toBe("landscape");
  });

  it("says nothing on the diagonal, where the next wobble would say the opposite", () => {
    expect(heldOrientation(0.7, -0.7, 0)).toBeNull();
    expect(heldOrientation(-0.66, -0.75, 0)).toBeNull();
  });

  it("says nothing about a phone lying flat, or about nonsense", () => {
    expect(heldOrientation(0, 0, 1)).toBeNull();
    expect(heldOrientation(0, 0, 0)).toBeNull();
    expect(heldOrientation(NaN, 0, 0)).toBeNull();
  });

  it("rides along with every tilt reading", () => {
    expect(anglesFrom(-1, 0, 0)?.held).toBe("landscape");
    expect(anglesFrom(0, -1, 0)?.held).toBe("portrait");
  });
});

// How square a whole recording was held. The middle reading, so a moment of
// wobble does not refuse a clip and a crooked clip is not saved by one good
// instant at the start.
describe("medianOff", () => {
  it("has nothing to say about nothing", () => {
    expect(medianOff([])).toBeNull();
  });

  it("takes the middle of an odd run and the mean of the middle pair", () => {
    expect(medianOff([9, 1, 5])).toBe(5);
    expect(medianOff([4, 10, 2, 8])).toBe(6);
    expect(medianOff([7])).toBe(7);
  });

  it("ignores one wobble among thirty steady readings", () => {
    const steady = Array.from({ length: 29 }, () => 4);
    expect(medianOff([...steady, 38])).toBe(4);
  });

  it("reads a clip held crooked as crooked, however it started", () => {
    const crooked = Array.from({ length: 29 }, () => 22);
    expect(medianOff([2, ...crooked])).toBe(22);
  });
});
