// A task offered to the worker, as the board and the offer screen word it. Pure.

import type { OfferRow } from "../src/api/types";
import { OFFER_STATE_TEXT, offerAmount, openOffers, placesText, respondBy } from "../src/offers";

const NOW = new Date("2026-10-18T10:00:00Z");

const offer = (over: Partial<OfferRow> = {}, task: Partial<OfferRow["task"]> = {}): OfferRow => ({
  id: "r1",
  state: "open",
  org_name: "Hyderabad Field Crew",
  quantity: 3,
  worker_limit: 3,
  places_left: 3,
  respond_by: "2026-10-19T10:00:00Z",
  due_on: null,
  instructions: null,
  response: null,
  responded_at: null,
  assignment_id: null,
  task: { id: "t1", reference_code: "TSK-21", title: "fan", instructions: null, due_on: null, target_unit: "videos", capture_spec: {}, ...task },
  ...over,
});

describe("offers on the board", () => {
  it("lists the open ones, the one closing soonest first", () => {
    const rows = [
      offer({ id: "late", respond_by: "2026-10-20T00:00:00Z" }),
      offer({ id: "done", state: "responded", response: "accepted" }),
      offer({ id: "soon", respond_by: "2026-10-18T12:00:00Z" }),
    ];
    expect(openOffers(rows).map((o) => o.id)).toEqual(["soon", "late"]);
  });

  it("says what accepting commits to, in the task's unit", () => {
    expect(offerAmount(offer({ quantity: 3 }))).toBe("3 videos");
    expect(offerAmount(offer({ quantity: 1 }, { target_unit: "photos" }))).toBe("1 photo");
    // an hours offer's quantity is hours, like an hours share (db/510)
    expect(offerAmount(offer({ quantity: 0.05 }, { target_unit: "hours" }))).toBe("3 min of footage");
    expect(offerAmount(offer({ quantity: 1.5 }, { target_unit: "hours" }))).toBe("1 h 30 min of footage");
  });

  it("says how long there is to answer", () => {
    expect(respondBy(offer({ respond_by: "2026-10-18T10:40:00Z" }), NOW)).toBe("Closes in 40 min");
    expect(respondBy(offer({ respond_by: "2026-10-18T15:00:00Z" }), NOW)).toBe("Closes in 5 h");
    expect(respondBy(offer({ respond_by: "2026-10-21T10:00:00Z" }), NOW)).toBe("Closes in 3 days");
    expect(respondBy(offer({ respond_by: "2026-10-18T09:00:00Z" }), NOW)).toBe("Closed");
  });

  it("counts the places left", () => {
    expect(placesText(offer({ places_left: 2, worker_limit: 3 }))).toBe("2 of 3 places left");
    expect(placesText(offer({ places_left: 1, worker_limit: 3 }))).toBe("Last place");
    expect(placesText(offer({ places_left: 1, worker_limit: 1 }))).toBe("One place");
    expect(placesText(offer({ places_left: 0 }))).toBe("No places left");
  });

  it("has the server's words for every state that cannot be answered", () => {
    for (const state of ["responded", "closed", "filled", "expired", "task_closed", "not_a_worker"]) {
      expect(OFFER_STATE_TEXT[state]).toBeTruthy();
    }
  });
});
