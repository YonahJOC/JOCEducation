import { describe, expect, it } from "vitest";
import { slideState, type SlideFacts } from "@/lib/school-screen/slideshow";

/**
 * The three chips over the slideshow.
 *
 * This is the same rule the television uses, asked of day keys instead of
 * Date objects — so the thing a teacher sees under "On the screen" is the
 * thing actually in the corridor. The one that matters is the last block:
 * an event comes down the day after it happens whatever the window says.
 */

const f = (over: Partial<SlideFacts> = {}): SlideFacts => ({
  status: "APPROVED",
  template: "PROGRAM",
  showFrom: "2026-10-20",
  showUntil: "2026-10-30",
  startsOn: null,
  ...over,
});

describe("where a flyer is in its life", () => {
  it("is on the screen inside its window", () => {
    expect(slideState(f(), "2026-10-26")).toBe("showing");
  });

  it("counts the first and the last day as on the screen", () => {
    expect(slideState(f(), "2026-10-20")).toBe("showing");
    expect(slideState(f(), "2026-10-30")).toBe("showing");
  });

  it("is coming up before its window", () => {
    expect(slideState(f(), "2026-10-19")).toBe("coming");
  });

  it("has come down after it", () => {
    expect(slideState(f(), "2026-10-31")).toBe("down");
  });

  it("takes an event down the day after it happens", () => {
    // The window runs to the 30th, but the bake sale was on the 22nd. A
    // flyer for last Thursday is how a corridor learns nobody is looking
    // after the screen.
    const event = f({ template: "EVENT", startsOn: "2026-10-22" });
    expect(slideState(event, "2026-10-22")).toBe("showing");
    expect(slideState(event, "2026-10-23")).toBe("down");
  });

  it("leaves a programme up for its whole window", () => {
    // Only events expire on their own date; a programme runs all term.
    expect(slideState(f({ startsOn: "2026-10-22" }), "2026-10-23")).toBe("showing");
  });

  it("calls anything nobody has signed off waiting, whatever its dates", () => {
    for (const status of ["PENDING", "ENDORSED", "SET_ASIDE", "REJECTED"] as const) {
      expect(slideState(f({ status }), "2026-10-26"), status).toBe("waiting");
    }
  });
});
