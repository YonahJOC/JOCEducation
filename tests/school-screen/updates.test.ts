import { describe, expect, it } from "vitest";
import { ambassadorUpdates, updatesToday } from "@/lib/school-screen/updates";
import type { QueueItem } from "@/lib/school-screen/queue";
import type { ScreenStatus } from "@/lib/school-screen/rules";

/**
 * What a student is told happened to their own work.
 *
 * Every line is worked out from the state of something they sent in —
 * nothing on this page was written to them, because nobody writes to a
 * student here. The two things worth being sure of: something still
 * waiting is not news, and a no is not reported as the end of the road
 * when a teacher can still overrule it.
 */

const item = (over: Partial<QueueItem> = {}): QueueItem => ({
  id: "f1",
  kind: "flyer",
  title: "Bake sale",
  detail: null,
  imageUrl: null,
  quote: null,
  onScreen: null,
  by: "Rivka Mandel",
  endorsedBy: null,
  status: "PENDING" as ScreenStatus,
  at: "2026-10-22T10:00:00.000Z",
  mine: true,
  flyer: null,
  ...over,
});

describe("what happened to the things you sent in", () => {
  it("says nothing about something still waiting", () => {
    // "You sent this in" is not news to the person who sent it in.
    expect(ambassadorUpdates([item({ status: "PENDING" })])).toEqual([]);
  });

  it("says it is on the screen once a teacher has put it up", () => {
    const [u] = ambassadorUpdates([item({ status: "APPROVED" })]);
    expect(u.headline).toBe("It’s on the screen");
    expect(u.tone).toBe("good");
  });

  it("names the ambassador who passed it on", () => {
    const [u] = ambassadorUpdates([item({ status: "ENDORSED", endorsedBy: "Tzippy Katz" })]);
    expect(u.line).toContain("Tzippy Katz");
  });

  it("does not invent a name when nobody endorsed it", () => {
    const [u] = ambassadorUpdates([item({ status: "ENDORSED", endorsedBy: null })]);
    expect(u.line).not.toContain("undefined");
    expect(u.line).not.toContain("null");
  });

  it("leaves a set-aside item a way back", () => {
    // A student's no is not the school's no, and the page must not read
    // as though it were.
    const [u] = ambassadorUpdates([item({ status: "SET_ASIDE" })]);
    expect(u.line).toContain("A teacher can still put it up");
  });

  it("reports the school's no plainly", () => {
    const [u] = ambassadorUpdates([item({ status: "REJECTED" })]);
    expect(u.headline).toBe("Not approved");
    expect(u.tone).toBe("quiet");
  });
});

describe("reports a teacher has read", () => {
  it("appears once it has been read, and not before", () => {
    const unread = ambassadorUpdates([], [
      { id: "r1", eventTitle: "Kindness Booth", occurredOn: "2026-10-20", seenAt: null },
    ]);
    expect(unread).toEqual([]);

    const [u] = ambassadorUpdates([], [
      { id: "r1", eventTitle: "Kindness Booth", occurredOn: "2026-10-20", seenAt: "2026-10-21T09:00:00.000Z" },
    ]);
    expect(u.headline).toBe("Your teacher read your report");
    expect(u.line).toContain("Kindness Booth");
  });

  it("falls back to the day it happened when the run has no title", () => {
    const [u] = ambassadorUpdates([], [
      { id: "r1", eventTitle: null, occurredOn: "2026-10-20T00:00:00.000Z", seenAt: "2026-10-21T09:00:00.000Z" },
    ]);
    expect(u.line).toContain("2026-10-20");
  });
});

describe("the order and the count", () => {
  it("puts the newest first, whichever table it came from", () => {
    const list = ambassadorUpdates(
      [
        item({ id: "a", status: "APPROVED", at: "2026-10-20T10:00:00.000Z" }),
        item({ id: "b", status: "APPROVED", at: "2026-10-24T10:00:00.000Z" }),
      ],
      [{ id: "r1", eventTitle: "Run", occurredOn: "2026-10-01", seenAt: "2026-10-22T10:00:00.000Z" }],
    );
    expect(list.map((u) => u.key)).toEqual(["flyer-b", "report-r1", "flyer-a"]);
  });

  it("counts only the last day", () => {
    const now = new Date("2026-10-26T12:00:00.000Z");
    const list = ambassadorUpdates([
      item({ id: "a", status: "APPROVED", at: "2026-10-26T09:00:00.000Z" }),
      item({ id: "b", status: "APPROVED", at: "2026-10-20T09:00:00.000Z" }),
    ]);
    expect(updatesToday(list, now)).toBe(1);
  });
});
