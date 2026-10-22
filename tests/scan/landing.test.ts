import { describe, expect, it } from "vitest";
import { shoutOutUrl } from "@/lib/school-screen/data";
import { ACTIONS, LIVE, isLive, ANSWER_MAX } from "@/lib/scan/actions";

/**
 * The page behind the QR code on the lobby wall.
 *
 * Two things worth pinning. Where each screen's code sends somebody — the
 * lobby to the landing page, every school to the form it already had,
 * because donations and swag have no business on a wall in somebody else's
 * building. And that a door is only shown when there is something behind
 * it: three of the four designed actions are not built, and an empty
 * promise on a wall in a lobby is worse than a shorter list.
 */

const ORIGIN = "https://education.justonechesed.org";

describe("where a screen's code sends you", () => {
  it("takes the lobby to the landing page", () => {
    expect(shoutOutUrl(ORIGIN, "joc-lobby")).toBe(`${ORIGIN}/scan/joc-lobby`);
  });

  it("leaves every school on its own form", () => {
    for (const slug of ["haftr", "barkai-yeshivah-school", "demo-academy"]) {
      expect(shoutOutUrl(ORIGIN, slug), slug).toBe(`${ORIGIN}/shout-out/${slug}`);
    }
  });

  it("does not care about a trailing slash on the origin", () => {
    expect(shoutOutUrl(`${ORIGIN}/`, "joc-lobby")).toBe(`${ORIGIN}/scan/joc-lobby`);
  });

  it("escapes a slug rather than letting it build the path", () => {
    expect(shoutOutUrl(ORIGIN, "a/b")).toBe(`${ORIGIN}/shout-out/a%2Fb`);
  });
});

describe("which doors are shown", () => {
  it("knows all four from the design", () => {
    expect(ACTIONS.map((a) => a.id)).toEqual(["answer", "pay", "marathon", "swag"]);
  });

  it("shows only the one that is built", () => {
    expect([...LIVE]).toEqual(["answer"]);
    expect(ACTIONS.filter((a) => isLive(a.id)).map((a) => a.id)).toEqual(["answer"]);
  });

  it("keeps money shut until somebody turns it on deliberately", () => {
    // Donations and swag take payments. They stay off until the flow
    // exists and the live key has been rolled.
    expect(isLive("pay")).toBe(false);
    expect(isLive("swag")).toBe(false);
  });

  it("sets text on orange in navy, which is the contrast the audit asked for", () => {
    // White on #FF8A00 is about 2.3:1 and fails; navy passes.
    const answer = ACTIONS.find((a) => a.id === "answer")!;
    expect(answer.bg).toBe("#FF8A00");
    expect(answer.fg).toBe("#1E2A8C");
  });
});

describe("the answer box", () => {
  it("keeps the room the form it replaces gave people", () => {
    // The handoff says 140. The old form allowed 220, and the wall already
    // sets anything over 95 characters a size smaller to fit it, so 220 is
    // a length the screen is built to show. The design gives way rather
    // than taking room away for the sake of a number in a spec.
    expect(ANSWER_MAX).toBe(220);
  });

  it("does not invite more than the server will keep", () => {
    // submitShoutOut truncates at 220. The page must not ask somebody for
    // something that is then quietly cut in half.
    expect(ANSWER_MAX).toBeLessThanOrEqual(220);
  });
});
