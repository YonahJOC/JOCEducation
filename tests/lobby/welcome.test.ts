import { describe, expect, it } from "vitest";
import { programSlideHTML } from "@/lib/lobby/screen-markup";
import type { LobbyEvent } from "@/lib/lobby/screen-data";

/**
 * The card a family sees when they walk in.
 *
 * Two things are being pinned. That a family who are here now are greeted
 * by name — and that nobody else is, because the trigger is a word somebody
 * typed into a free-text box and the cost of reading it too eagerly is a
 * seminary group being welcomed as somebody's relatives.
 */

const ev = (over: Partial<LobbyEvent> = {}): LobbyEvent => ({
  id: "1",
  program: "Pizza Making",
  groupLine: "the Weidenfeld family",
  time: "4pm",
  timeRange: "4pm – 6pm",
  allDay: false,
  label: "Happening now",
  venue: { chip: "JOC Center", icon: "home_work", color: "#214ba5", tint: "#eaf0ff" },
  ...over,
});

/** What a person standing in front of the screen would read off it. */
const text = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

describe("a family, here now", () => {
  const html = programSlideHTML(ev());

  it("greets them instead of announcing the activity", () => {
    expect(text(html)).toContain("Welcome to Just One Chesed!");
  });

  it("gives the big slot to the family, not the programme", () => {
    expect(html).toMatch(/class="slide-program">The Weidenfeld Family</);
  });

  it("tidies the name without touching the surname", () => {
    // "the Weidenfeld family" is how it reads in a diary and not how it
    // should read on a wall.
    expect(text(html)).toContain("The Weidenfeld Family");
    expect(text(html)).not.toContain("the Weidenfeld family");
  });

  it("keeps what they are here for, beside the time", () => {
    expect(text(html)).toContain("4pm – 6pm · Pizza Making");
  });

  it("says Welcome on the chip, in orange", () => {
    expect(html).toContain('class="slide-label" style="background:#ff8e00"');
    expect(html).toMatch(/<i><\/i>Welcome</);
  });

  it("still says where in the building", () => {
    expect(text(html)).toContain("JOC Center");
  });
});

describe("the ways a family gets written", () => {
  const greeted = (groupLine: string) => text(programSlideHTML(ev({ groupLine })));

  it("catches a capital Family", () => {
    expect(greeted("Cohen Family")).toContain("Welcome to Just One Chesed!");
    expect(greeted("Cohen Family")).toContain("Cohen Family");
  });

  it("catches a leading 'the' and capitalises it", () => {
    expect(greeted("the Levy family")).toContain("The Levy Family");
  });

  it("catches two of them", () => {
    expect(greeted("the Gold and Stern families")).toContain("The Gold and Stern Families");
  });

  it("leaves a hyphenated or particled surname exactly as typed", () => {
    // No rule here is clever enough to case these, and a wrong guess puts
    // somebody's name up wrong in their own building.
    expect(greeted("the Ben-Zion family")).toContain("The Ben-Zion Family");
    expect(greeted("the de Vries family")).toContain("The de Vries Family");
  });
});

describe("everyone else, unchanged", () => {
  it("leaves a seminary group alone", () => {
    const html = programSlideHTML(ev({ groupLine: "Machon Maayan", program: "The Kindness Booth" }));
    expect(text(html)).not.toContain("Welcome");
    expect(html).toMatch(/class="slide-program">The Kindness Booth</);
    expect(html).toMatch(/class="slide-group">Machon Maayan</);
  });

  it("does not greet a word that merely contains it", () => {
    // "Familia" is not "family"; the boundary in the pattern is the point.
    expect(text(programSlideHTML(ev({ groupLine: "Familia Tours" })))).not.toContain("Welcome");
  });

  it("does not greet a family who are not here yet", () => {
    // Later today, tomorrow, Thursday: nobody is standing in the doorway.
    for (const label of ["Next up", "Later today", "Tomorrow", "Thursday"]) {
      expect(text(programSlideHTML(ev({ label }))), label).not.toContain("Welcome to Just One Chesed!");
    }
  });

  it("still shows them normally when they are not here yet", () => {
    const html = programSlideHTML(ev({ label: "Tomorrow" }));
    expect(html).toMatch(/class="slide-program">Pizza Making</);
    expect(html).toMatch(/class="slide-group">the Weidenfeld family</);
  });

  it("keeps an all-day item reading All day", () => {
    expect(text(programSlideHTML(ev({ label: "Tomorrow", allDay: true })))).toContain("All day");
  });
});
