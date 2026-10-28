// Work taken off a worker (db/600): the task ended or the share was cancelled,
// so the assignment left their list and its queued captures can never be sent.
import { strandedAssignments, takenOff } from "../src/batches";

describe("takenOff", () => {
  it("says the work was taken off them, and nothing more is needed", () => {
    expect(takenOff(0)).toBe(
      "This work was taken off you: the task ended or your share was cancelled. Nothing more is needed from you on it.",
    );
  });

  it("counts what is still on the phone and can never be sent", () => {
    expect(takenOff(1)).toMatch(/1 capture still on this phone can never be sent\.$/);
    expect(takenOff(3)).toMatch(/3 captures still on this phone can never be sent\.$/);
  });
});

describe("strandedAssignments", () => {
  const outbox = {
    held: { queued: 2, failed: 0, confirmed: 5 },
    ended: { queued: 1, failed: 2, confirmed: 0 },
    done: { queued: 0, failed: 0, confirmed: 4 },
  };

  it("finds assignments with captures waiting that are no longer on the list", () => {
    expect(strandedAssignments(outbox, [{ id: "held" }])).toEqual(["ended"]);
  });

  it("ignores ones whose captures all went up", () => {
    expect(strandedAssignments(outbox, [{ id: "held" }, { id: "ended" }])).toEqual([]);
  });

  it("finds nothing when everything is still held", () => {
    expect(strandedAssignments({}, [{ id: "held" }])).toEqual([]);
  });
});
