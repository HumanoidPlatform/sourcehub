// How square the phone was held when the shutter fired.
//
// The accelerometer's gravity vector is enough. Two angles fall out of it by
// trigonometry — no model, no service, no permission prompt. Shaped like
// location.ts: a documented reading, a subscribe function, and failure that
// goes quiet rather than throwing, because not every device has the sensor.
//
// This measures squareness to a VERTICAL plane — a wall, a shelf, signage,
// which is the work the marketplace is written around. For overhead or
// tabletop capture the reference is wrong, which is why a client is asked for
// the tolerance rather than it being assumed.

import { Accelerometer } from "expo-sensors";

export interface Tilt {
  /** degrees of rotation about the camera axis, folded to the nearest quarter
   *  turn so a phone held in landscape reads level rather than 90 degrees off */
  roll: number;
  /** degrees the camera axis sits off horizontal */
  pitch: number;
  /** the worse of the two — what a single tolerance is checked against */
  off: number;
  /** which way up the phone is being held; null near the 45° boundary, and
   *  when it lies flat and gravity says nothing about the turn */
  held: Held | null;
}

export type Held = "portrait" | "landscape";

const DEG = 180 / Math.PI;

/** How far from the 45° boundary the phone must be before the turn is called.
 *  Inside that band a hand wobble flips the answer, so it answers nothing. */
const HELD_MARGIN = 10;
/** Below this the gravity vector is mostly along the camera axis — the phone
 *  is flat on a table or pointing at the ceiling, and which way it is turned
 *  cannot be read from gravity at all. */
const HELD_MIN_TILT = 0.25;

/** Fold an angle to its deviation from the nearest quarter turn, in [-45, 45].
 *
 * A phone held in landscape is rotated 90 degrees and is perfectly level.
 * Measuring roll against zero would flag every landscape shot — which is
 * exactly the orientation a shelf task asks for.
 */
function quarterTurn(deg: number): number {
  // JS % keeps the sign of the dividend, so normalise into [0, 90) first.
  const m = (((deg + 45) % 90) + 90) % 90;
  return m - 45;
}

/** Pitch and roll from a gravity vector, in degrees. Pure.
 *
 * Null when the vector cannot mean anything — freefall, or a sensor reporting
 * nonsense. Saying nothing is right here: a fabricated zero would read as
 * "perfectly square" and quietly pass.
 *
 * Both outputs are invariant to a global sign flip of the vector, which
 * matters because iOS and Android disagree about which way the accelerometer
 * points: negating it turns roll's atan2 by exactly 180 degrees, and 180 is a
 * multiple of the quarter turn folded away above, while pitch only ever
 * reaches a caller through its absolute value.
 */
export function anglesFrom(gx: number, gy: number, gz: number): Tilt | null {
  const mag = Math.hypot(gx, gy, gz);
  if (!Number.isFinite(mag) || mag < 0.1) return null;
  const roll = quarterTurn(Math.atan2(gx, -gy) * DEG);
  const pitch = Math.asin(Math.max(-1, Math.min(1, gz / mag))) * DEG;
  return {
    roll,
    pitch,
    off: Math.max(Math.abs(roll), Math.abs(pitch)),
    held: heldOrientation(gx, gy, gz),
  };
}

/** Which way up the phone is being held, from gravity alone. Pure.
 *
 * Gravity pulls down the screen's long axis when the phone is upright and
 * across its short axis when it is turned on its side, so the larger of the
 * two components names the turn. This is what the ORIENTATION check reads:
 * a recording's own container says how the encoder tagged it, which on an app
 * locked to portrait is not the same thing and was refusing landscape clips.
 *
 * null rather than a guess in the two cases where gravity cannot answer: near
 * the 45° diagonal, where the next wobble would say the opposite, and with the
 * phone near flat, where neither axis carries the pull.
 */
export function heldOrientation(gx: number, gy: number, gz: number): Held | null {
  const mag = Math.hypot(gx, gy, gz);
  if (!Number.isFinite(mag) || mag < 0.1) return null;
  const x = Math.abs(gx) / mag;
  const y = Math.abs(gy) / mag;
  if (Math.hypot(x, y) < HELD_MIN_TILT) return null;
  // The angle of the in-screen gravity direction, 0 = straight down the long
  // axis (portrait), 90 = across the short axis (landscape).
  const deg = Math.atan2(x, y) * DEG;
  if (Math.abs(deg - 45) < HELD_MARGIN) return null;
  return deg > 45 ? "landscape" : "portrait";
}

/** How square a whole recording was held, from the readings taken while it
 *  ran. Pure. The middle value, not the worst: a clip is minutes long and one
 *  wobble while stepping over something says nothing about the work, whereas
 *  a phone held crooked for most of it reads crooked here. Null when nothing
 *  was sampled, which the caller treats as "no reading" exactly as it treats a
 *  device with no accelerometer. */
export function medianOff(samples: number[]): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Watch the phone's attitude until the returned function is called.
 *
 * 10 Hz is plenty for a level a person reads and gentle on the battery; the
 * low pass keeps hand tremor out of the number.
 */
export function watchTilt(onChange: (t: Tilt) => void): () => void {
  let g: { x: number; y: number; z: number } | null = null;
  let sub: { remove: () => void } | null = null;
  try {
    Accelerometer.setUpdateInterval(100);
    sub = Accelerometer.addListener(({ x, y, z }) => {
      g = g
        ? { x: g.x * 0.8 + x * 0.2, y: g.y * 0.8 + y * 0.2, z: g.z * 0.8 + z * 0.2 }
        : { x, y, z };
      const t = anglesFrom(g.x, g.y, g.z);
      if (t) onChange(t);
    });
  } catch {
    // no accelerometer on this device: captures simply carry no attitude
  }
  return () => sub?.remove();
}
