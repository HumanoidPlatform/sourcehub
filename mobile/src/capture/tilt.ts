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
}

const DEG = 180 / Math.PI;

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
  return { roll, pitch, off: Math.max(Math.abs(roll), Math.abs(pitch)) };
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
