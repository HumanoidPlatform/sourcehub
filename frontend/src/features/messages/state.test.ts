// The pure rules under the conversation panels.

import { describe, expect, it } from "vitest";
import type { Thread, ThreadMessage } from "@api/types";
import {
  counterpartName, isReadOnly, newestFromOthers, readOnlyNote, seenByOtherSide, threadFor,
  unreadTotal,
} from "./state";

const T: Thread = {
  id: "t1", request_id: "r1", request_ref: "RFP-1011", request_title: "Storefront photos, Pune",
  client_org_id: "o-acme", client_org_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_org_name: "NorthStar Data Services",
  created_at: "2026-09-28T09:00:00Z", closed_at: null, closed_reason: null, closed_message: null,
  message_count: 2, last_seq: 2, last_message_at: "2026-09-28T09:05:00Z",
  last_message_preview: "Yes, drone footage is fine.",
  client_read_seq: 2, partner_read_seq: 1, unread_count: 1,
};

const msg = (seq: number, sender_org_id: string): ThreadMessage => ({
  id: `m${seq}`, thread_id: "t1", seq, sender_org_id, sender_user_id: "u", sender_name: "Someone",
  body: "…", created_at: "2026-09-28T09:00:00Z",
});

describe("read-only", () => {
  it("is a closed thread, whatever the reason", () => {
    expect(isReadOnly(null)).toBe(false);
    expect(isReadOnly(T)).toBe(false);
    expect(isReadOnly({ ...T, closed_at: "2026-09-29T00:00:00Z", closed_reason: "awarded_elsewhere" })).toBe(true);
  });

  it("is explained from the reader's side", () => {
    const lost = { ...T, closed_at: "x", closed_reason: "awarded_elsewhere" as const };
    expect(readOnlyNote(lost, "partner")).toBe("The RFP was awarded to another partner.");
    expect(readOnlyNote(lost, "client")).toBe("You awarded this RFP to another partner.");
    expect(readOnlyNote(lost, "ops")).toBe("The RFP was awarded to another partner.");
    const done = { ...T, closed_at: "x", closed_reason: "contract_completed" as const };
    expect(readOnlyNote(done, "partner")).toBe("Delivery is complete.");
    expect(readOnlyNote(done, "client")).toBe("Delivery is complete.");
  });
});

describe("seen", () => {
  it("means the OTHER organisation's stamp has passed the message", () => {
    // partner's message 1: the client has read up to 2 → seen
    expect(seenByOtherSide(T, msg(1, "o-northstar"))).toBe(true);
    // client's message 2: the partner has read up to 1 → not yet
    expect(seenByOtherSide(T, msg(2, "o-acme"))).toBe(false);
    expect(seenByOtherSide({ ...T, partner_read_seq: 2 }, msg(2, "o-acme"))).toBe(true);
  });

  it("picks the newest message from anyone but me", () => {
    const ms = [msg(1, "o-northstar"), msg(2, "o-acme"), msg(3, "o-northstar")];
    expect(newestFromOthers(ms, "o-northstar")?.id).toBe("m2");
    expect(newestFromOthers(ms, "o-acme")?.id).toBe("m3");
    expect(newestFromOthers([msg(1, "o-acme")], "o-acme")).toBeNull();
  });
});

describe("the list", () => {
  it("sums unread and finds a partner's thread", () => {
    const other = { ...T, id: "t2", partner_org_id: "o-kiwi", unread_count: 2 };
    expect(unreadTotal([T, other])).toBe(3);
    expect(threadFor([T, other], "o-kiwi")?.id).toBe("t2");
    expect(threadFor([T, other], "o-nobody")).toBeNull();
  });

  it("names the other side, with a fallback before the thread exists", () => {
    expect(counterpartName(T, "partner")).toBe("Acme Retail Analytics");
    expect(counterpartName(T, "client")).toBe("NorthStar Data Services");
    expect(counterpartName(null, "partner", "Acme Retail Analytics")).toBe("Acme Retail Analytics");
    expect(counterpartName(null, "partner")).toBe("the client");
    expect(counterpartName(null, "client")).toBe("the partner");
  });
});
