import { describe, expect, it } from "vitest";
import { canApprove, canEndorse, decisionFor } from "@/lib/school-screen/stages";
import { flyerShowing, type ScreenStatus } from "@/lib/school-screen/rules";

/**
 * Two approvals before anything reaches a wall.
 *
 * A student ambassador reads the queue first and passes things on; the
 * school signs them off. The half of this that actually matters is the last
 * block: whatever the students do, only the school's APPROVED puts anything
 * in a hallway, and that is the property these screens have always had.
 */

describe("who may do which stage", () => {
  it("lets an ambassador give the first approval", () => {
    expect(canEndorse("ambassador")).toBe(true);
  });

  it("does not let an ambassador give the second", () => {
    // The whole point of two stages. A student passing something on must
    // not be able to put it in a hallway by themselves.
    expect(canApprove("ambassador")).toBe(false);
  });

  it("lets the school do both", () => {
    for (const role of ["teacher", "staff"] as const) {
      expect(canEndorse(role), role).toBe(true);
      expect(canApprove(role), role).toBe(true);
    }
  });

  it("lets nobody else do either", () => {
    for (const role of [null, undefined]) {
      expect(canEndorse(role)).toBe(false);
      expect(canApprove(role)).toBe(false);
    }
  });
});

describe("what a yes and a no mean, per role", () => {
  it("an ambassador endorses and sets aside", () => {
    expect(decisionFor("ambassador", true)).toBe("ENDORSED");
    expect(decisionFor("ambassador", false)).toBe("SET_ASIDE");
  });

  it("the school approves and rejects", () => {
    for (const role of ["teacher", "staff"] as const) {
      expect(decisionFor(role, true), role).toBe("APPROVED");
      expect(decisionFor(role, false), role).toBe("REJECTED");
    }
  });

  it("keeps a student's no apart from the school's", () => {
    // A fast finger must not produce something indistinguishable from the
    // school's own decision — an administrator has to be able to find the
    // pile and overturn it.
    expect(decisionFor("ambassador", false)).not.toBe(decisionFor("teacher", false));
  });

  it("lets the school approve straight through, with no ambassador involved", () => {
    // A school with nobody in the role, or one away for the week, must not
    // be left with a screen it cannot change.
    expect(decisionFor("teacher", true)).toBe("APPROVED");
  });
});

describe("what actually reaches a wall", () => {
  const window = {
    template: "PROGRAM" as const,
    showFrom: new Date("2026-10-01"),
    showUntil: new Date("2026-12-01"),
    startsAt: null,
  };
  const now = new Date("2026-10-20T10:00:00Z");

  it("shows an approved flyer", () => {
    expect(flyerShowing({ ...window, status: "APPROVED" }, now)).toBe(true);
  });

  it("shows nothing at any other stage", () => {
    // Endorsed is a student saying yes. It is not the school saying yes,
    // and the hallway is the school's.
    const others: ScreenStatus[] = ["PENDING", "ENDORSED", "SET_ASIDE", "REJECTED"];
    for (const status of others) {
      expect(flyerShowing({ ...window, status }, now), status).toBe(false);
    }
  });

  it("still respects the show window once approved", () => {
    expect(flyerShowing({ ...window, status: "APPROVED" }, new Date("2026-09-01"))).toBe(false);
    expect(flyerShowing({ ...window, status: "APPROVED" }, new Date("2027-01-01"))).toBe(false);
  });
});
