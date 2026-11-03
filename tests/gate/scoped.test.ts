import { describe, expect, it } from "vitest";
import { can, isInternal, CAPABILITIES } from "@/lib/access";

/**
 * Somebody brought in for one job, and only that job.
 *
 * A @justonechesed.org address grants the run of the site on its own —
 * lesson plans, the resource library, the Teachers' Board, the shop. That
 * is right for almost everybody at JOC and wrong for somebody brought in
 * to look after the screens.
 *
 * A scoped admin role takes the address's grant away and leaves exactly
 * what the capabilities open. The thing worth holding is that the address
 * can never win: the whole point is that it stops counting.
 */

const screens = {
  email: "someone@justonechesed.org",
  role: "STAFF",
  capabilities: ["lobby", "school_screens"],
  scoped: true,
};

const ordinary = {
  email: "someone@justonechesed.org",
  role: "STAFF",
  capabilities: null,
};

describe("a scoped role", () => {
  it("stops a JOC address granting the run of the site", () => {
    expect(isInternal(ordinary)).toBe(true);
    expect(isInternal(screens)).toBe(false);
  });

  it("keeps exactly the capabilities it names", () => {
    expect(can(screens, "lobby")).toBe(true);
    expect(can(screens, "school_screens")).toBe(true);
  });

  it("opens nothing else at all", () => {
    const extra = CAPABILITIES.filter(
      (c) => c !== "lobby" && c !== "school_screens" && can(screens, c),
    );
    expect(extra).toEqual([]);
  });

  it("does not take anything from somebody who is not scoped", () => {
    // The flag is opt-in. Everybody at JOC who has not been given a scoped
    // role keeps what they had.
    expect(isInternal({ email: "someone@justonechesed.org", role: "STAFF" })).toBe(true);
    expect(isInternal({ email: "someone@justonechesed.org", role: "ADMIN" })).toBe(true);
  });

  it("is not something a plain teacher accidentally has", () => {
    expect(isInternal({ email: "teacher@aschool.org", role: "TEACHER" })).toBe(false);
  });
});

describe("looking after screens is separable from running schools", () => {
  it("school_screens does not bring the client list with it", () => {
    for (const c of ["schools", "pricing", "money_view", "orders", "users", "messages"] as const) {
      expect(can(screens, c), c).toBe(false);
    }
  });
});
