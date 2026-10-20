// The device checks as the presign sends them, held to the server's
// DeviceCheck contract (backend api/v1/media.py).
//
// The checks are measurements the server records and never acts on, yet one
// the contract refuses fails the WHOLE presign with a 422 — which the uploader
// rightly treats as fatal, so the capture could never be sent. That happened:
// CLIP's margin went out as a `score`, and every capture with a negative
// margin (every off-subject photo, every ceiling-fan clip) was refused. So the
// rows are conformed here, at send time, rather than trusted: this also
// rescues rows already queued by a build that wrote them wrong.

/** the server's limits, mirrored */
const MAX_CHECKS = 20;
const MAX_CODE = 40;
const MAX_MESSAGE = 300;
const MAX_DETAIL_BYTES = 1024;
const SEVERITIES = new Set(["block", "warn", "info"]);

type Check = {
  code: string;
  severity: string;
  message: string;
  score?: number;
  detail?: Record<string, unknown>;
};

function conform(raw: unknown): Check | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.code !== "string" || c.code.length === 0 || c.code.length > MAX_CODE) return null;
  if (typeof c.severity !== "string" || !SEVERITIES.has(c.severity)) return null;
  if (typeof c.message !== "string" || c.message.length === 0) return null;
  const out: Check = { code: c.code, severity: c.severity, message: c.message.slice(0, MAX_MESSAGE) };
  let detail =
    c.detail && typeof c.detail === "object" && !Array.isArray(c.detail) ? { ...(c.detail as Record<string, unknown>) } : undefined;
  if (typeof c.score === "number" && Number.isFinite(c.score)) {
    // a score outside 0..1 is not a confidence; keep the number, not the field
    if (c.score >= 0 && c.score <= 1) out.score = c.score;
    else detail = { ...(detail ?? {}), score_raw: c.score };
  }
  if (detail) out.detail = JSON.stringify(detail).length <= MAX_DETAIL_BYTES ? detail : { truncated: true };
  return out;
}

/** The outbox row's stored checks, ready for the presign body. Warnings and
 *  blocks are kept ahead of measurements if there are too many. */
export function checksForServer(raw: string | null): Check[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const all = parsed.map(conform).filter((c): c is Check => c !== null);
  if (all.length <= MAX_CHECKS) return all;
  return [...all.filter((c) => c.severity !== "info"), ...all.filter((c) => c.severity === "info")].slice(0, MAX_CHECKS);
}
