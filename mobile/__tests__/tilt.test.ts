import { anglesFrom } from "@/capture/tilt";

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
