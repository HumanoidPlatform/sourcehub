import { target } from "../src/notifications/link";

describe("where a notification takes the worker", () => {
  it("opens the assignment a row or push is about", () => {
    expect(target({ link_page: "assignment", link_params: { id: "a1" } })).toBe("/assignments/a1");
    expect(target({ link_page: "assignment", link_params: { assignment_id: "a2" } })).toBe("/assignments/a2");
  });

  it("falls back to the board for anything else", () => {
    // an offer row carries no link: it is answered from the email
    expect(target({ link_page: null, link_params: {} })).toBe("/assignments");
    expect(target({ link_page: "tasks", link_params: { id: "t1" } })).toBe("/assignments");
    expect(target({ link_page: "assignment", link_params: null })).toBe("/assignments");
    expect(target({})).toBe("/assignments");
  });

  it("ignores an id that is not a string, as a push payload might carry", () => {
    expect(target({ link_page: "assignment", link_params: { id: 42 } })).toBe("/assignments");
  });
});
