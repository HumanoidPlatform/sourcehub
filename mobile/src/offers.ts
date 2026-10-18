// A task offered to this worker, as the board and the offer screen read it
// (backend delivery.my_offers). An offer used to be answered from an email
// link; the phone answers it now. Pure, like batches.ts: tested without a phone.

import type { OfferRow } from "@/api/types";
import { hoursText, unitText } from "@/batches";

/** The offers still open to answer, the one closing soonest first. */
export function openOffers(rows: OfferRow[]): OfferRow[] {
  return rows.filter((o) => o.state === "open").sort((a, b) => a.respond_by.localeCompare(b.respond_by));
}

/** What accepting commits the worker to: "3 photos", "3 min of footage". An
 *  hours offer's quantity is hours, like an hours share (db/510). */
export function offerAmount(o: OfferRow): string {
  const unit = o.task.target_unit;
  if (unit === "hours") return `${hoursText(o.quantity)} of footage`;
  if (unit === "audio_hours") return `${hoursText(o.quantity)} of audio`;
  return unitText(unit, o.quantity);
}

/** How long there is to answer, as a person reads it. */
export function respondBy(o: OfferRow, now: Date = new Date()): string {
  const ms = new Date(o.respond_by).getTime() - now.getTime();
  if (!Number.isFinite(ms)) return "";
  if (ms <= 0) return "Closed";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `Closes in ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Closes in ${hours} h`;
  return `Closes in ${Math.round(hours / 24)} days`;
}

/** How many can still say yes. */
export function placesText(o: OfferRow): string {
  if (o.places_left <= 0) return "No places left";
  if (o.places_left === 1) return o.worker_limit === 1 ? "One place" : "Last place";
  return `${o.places_left} of ${o.worker_limit} places left`;
}

/** The server's words for an offer that can no longer be answered (backend
 *  delivery._STATE_MESSAGES), for a card the list already says is closed. A
 *  refusal that comes back from the answer itself carries its own message. */
export const OFFER_STATE_TEXT: Record<string, string> = {
  responded: "You have already answered this offer.",
  closed: "This task is closed — the offer was withdrawn.",
  filled: "This task is closed — all places have been taken.",
  expired: "This task is closed — the time to respond has passed.",
  task_closed: "This task is no longer taking anyone.",
  not_a_worker: "You are no longer active for this organisation.",
};
