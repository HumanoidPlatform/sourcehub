// The web policy on top of the shared rules.
//
// rules.ts is the phone's file, unchanged, and it assumes a live capture: a
// missing fix is a block, a tilt reading is available. A browser upload is a
// gallery upload — no accelerometer, no live fix, no proof the file was shot
// by this worker just now — so the conditions the browser cannot verify are
// named as WARNINGS for a reviewer rather than pretended to have passed or
// refused outright. That substitution lives here so rules.ts stays a copy.
//
// Every web upload also carries `web_upload`, so gate 1 and anything that
// later reads asset.check_results can tell it from a live capture.

import type { CaptureSpec, DeviceCheck } from "@api/types";
import { MAX_CHECK_CODE, MAX_CHECK_MESSAGE, MAX_CHECKS } from "./config";
import type { Derived } from "./facts";
import { checkCapture, type Finding } from "./rules";

export function webChecks(d: Derived, spec: CaptureSpec | null | undefined, targetUnit?: string | null): Finding[] {
  const out: Finding[] = [];

  for (const f of checkCapture(d.facts, spec, targetUnit)) {
    if (f.code === "gps_missing") {
      // The client asked for a fix and the file carries none. On the phone
      // that refuses the shot; here nobody can be asked to step outside.
      out.push({
        code: "gps_unverified",
        severity: "warn",
        message: "Location is required for this task and the file carries none — a reviewer will judge it.",
      });
    } else {
      out.push(f);
    }
  }

  const tilt = spec?.max_tilt_deg;
  if (typeof tilt === "number" && tilt > 0) {
    out.push({
      code: "tilt_unverified",
      severity: "warn",
      message: `Squareness within ${tilt}° is required and cannot be measured on an uploaded file — a reviewer will judge it.`,
    });
  }

  if (!d.decoded && d.facts.kind === "photo") {
    out.push({
      code: "dimensions_unknown",
      severity: "warn",
      message: "The browser could not read this image's dimensions, so its size and orientation were not checked.",
    });
  }

  if (!d.captured_from_exif) {
    out.push({
      code: "captured_at_inferred",
      severity: "warn",
      message: "The file carries no capture time; its modified time was used instead.",
    });
  }

  out.push({
    code: "web_upload",
    severity: "warn",
    message: "Uploaded from the console, not captured live on a phone.",
  });

  return out;
}

/** What rides with the presign: the warnings, trimmed to the server's limits
 *  so an over-long message cannot 422 a good file. Blocks never get this far —
 *  a blocked file is refused before it is queued, as on the phone. */
export function toCheckPayload(findings: Finding[]): DeviceCheck[] {
  return findings
    .filter((f) => f.severity === "warn")
    .slice(0, MAX_CHECKS)
    .map((f) => ({
      code: f.code.slice(0, MAX_CHECK_CODE),
      severity: f.severity,
      message: f.message.slice(0, MAX_CHECK_MESSAGE),
    }));
}
