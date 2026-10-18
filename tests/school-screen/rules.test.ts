import { describe, expect, it } from "vitest";
import {
  dayEnd, dayKey, dayStart, emailAllowed, eventTitleSize, flyerShowing, flyerWarnings, gradeTiles,
  normalizeDomains, pickDedication, shortName, shoutOutFrom, themeParts, wordCount,
} from "@/lib/school-screen/rules";
import { esc, flyerHTML, marqueeHTML } from "@/lib/school-screen/markup";

describe("pickDedication", () => {
  const rows = [
    { schoolId: null, date: "2026-10-12", hebrewName: "כל ישראל", text: null },
    { schoolId: "s1", date: "2026-10-12", hebrewName: "איתמר לביא בן עינב", text: "Sponsored by the 10th grade" },
    { schoolId: "s1", date: "2026-10-13", hebrewName: "Tomorrow", text: null },
  ];

  it("prefers the school's own for today", () => {
    expect(pickDedication(rows, "s1", "2026-10-12")).toEqual({ hebrewName: "איתמר לביא בן עינב", text: "Sponsored by the 10th grade" });
  });

  it("falls back to the one for every school", () => {
    expect(pickDedication(rows, "s2", "2026-10-12")).toEqual({ hebrewName: "כל ישראל", text: null });
  });

  it("is nothing on a day with none", () => {
    expect(pickDedication(rows, "s2", "2026-10-14")).toBeNull();
  });

  it("ignores a blank name", () => {
    expect(pickDedication([{ schoolId: "s1", date: "2026-10-12", hebrewName: "  ", text: null }], "s1", "2026-10-12")).toBeNull();
  });
});

describe("flyerShowing", () => {
  const base = {
    status: "APPROVED" as const,
    template: "PROGRAM" as const,
    showFrom: new Date("2026-10-01T00:00:00Z"),
    showUntil: new Date("2026-10-31T00:00:00Z"),
    startsAt: null,
  };

  it("shows an approved flyer inside its window", () => {
    expect(flyerShowing(base, new Date("2026-10-15T12:00:00Z"))).toBe(true);
  });

  it("never shows one waiting or rejected", () => {
    expect(flyerShowing({ ...base, status: "PENDING" }, new Date("2026-10-15T12:00:00Z"))).toBe(false);
    expect(flyerShowing({ ...base, status: "REJECTED" }, new Date("2026-10-15T12:00:00Z"))).toBe(false);
  });

  it("respects both ends of the window", () => {
    expect(flyerShowing(base, new Date("2026-09-30T12:00:00Z"))).toBe(false);
    expect(flyerShowing(base, new Date("2026-11-01T12:00:00Z"))).toBe(false);
  });

  it("takes an event down the day after it, even with the window left open", () => {
    const ev = { ...base, template: "EVENT" as const, startsAt: dayStart("2026-10-15") };
    expect(flyerShowing(ev, new Date("2026-10-15T15:00:00Z"))).toBe(true);
    expect(flyerShowing(ev, new Date("2026-10-16T09:00:00Z"))).toBe(false);
  });
});

describe("gradeTiles", () => {
  it("turns a grade at or over the shared goal into a bonus round", () => {
    const t = gradeTiles([
      { label: "9th", hours: 231 }, { label: "10th", hours: 250 }, { label: "12th", hours: 262.4 },
    ], 250);
    expect(t.map((x) => [x.reached, x.over])).toEqual([[false, 0], [true, 0], [true, 12]]);
  });

  it("never divides by a zero goal or shows negative hours", () => {
    const t = gradeTiles([{ label: "9th", hours: -5 }], 0);
    expect(t[0]).toMatchObject({ hours: 0, reached: false });
  });
});

describe("shoutOutFrom", () => {
  const s = { firstName: "Rivka", lastName: "L", grade: "9th", showName: true };

  it("shows a name only with consent", () => {
    expect(shoutOutFrom(s)).toBe("— Rivka L., 9th grade");
    expect(shoutOutFrom({ ...s, showName: false })).toBe("— 9th grade");
  });

  it("takes a whole last name when the student gives one", () => {
    expect(shoutOutFrom({ ...s, lastName: "Levi" })).toBe("— Rivka Levi, 9th grade");
  });

  it("punctuates an initial but never a name", () => {
    // "Rivka Levi." would read as the end of a sentence on the wall.
    expect(shoutOutFrom({ ...s, lastName: "l" })).toBe("— Rivka L., 9th grade");
    expect(shoutOutFrom({ ...s, lastName: "Levi" })).not.toContain("Levi.");
  });

  it("keeps a name that is two words, or hyphenated", () => {
    expect(shoutOutFrom({ ...s, lastName: "Ben Zion" })).toBe("— Rivka Ben Zion, 9th grade");
    expect(shoutOutFrom({ ...s, lastName: "Bar-Lev" })).toBe("— Rivka Bar-Lev, 9th grade");
  });

  it("leaves a name alone when they give no surname at all", () => {
    expect(shoutOutFrom({ ...s, lastName: "" })).toBe("— Rivka, 9th grade");
    expect(shoutOutFrom({ ...s, lastName: "   " })).toBe("— Rivka, 9th grade");
  });

  it("does not capitalise a name the student wrote their own way", () => {
    expect(shoutOutFrom({ ...s, lastName: "de Leon" })).toBe("— Rivka de Leon, 9th grade");
  });

  it("does not say 'grade grade'", () => {
    expect(shoutOutFrom({ ...s, grade: "10th grade", showName: false })).toBe("— 10th grade");
  });

  it("copes with no grade and no consent", () => {
    expect(shoutOutFrom({ ...s, grade: "", showName: false })).toBe("");
  });
});

describe("email domains", () => {
  it("normalizes what somebody types", () => {
    expect(normalizeDomains("@HAFTR.org, haftr.org; students.haftr.org nonsense")).toEqual(["haftr.org", "students.haftr.org"]);
  });

  it("takes the school's domain and its subdomains, nothing else", () => {
    const d = ["haftr.org"];
    expect(emailAllowed("a@haftr.org", d)).toBe(true);
    expect(emailAllowed("a@students.haftr.org", d)).toBe(true);
    expect(emailAllowed("a@nothaftr.org", d)).toBe(false);
    expect(emailAllowed("a@gmail.com", d)).toBe(false);
    expect(emailAllowed(null, d)).toBe(false);
  });

  it("takes any account while a school has set none", () => {
    expect(emailAllowed("a@gmail.com", [])).toBe(true);
  });
});

describe("Jerusalem days", () => {
  it("starts a day at local midnight on both sides of the clocks changing", () => {
    // Winter, UTC+2.
    expect(dayStart("2026-12-01").toISOString()).toBe("2026-11-30T22:00:00.000Z");
    // Summer, UTC+3.
    expect(dayStart("2026-07-01").toISOString()).toBe("2026-06-30T21:00:00.000Z");
  });

  it("ends a day one millisecond before the next begins", () => {
    expect(dayEnd("2026-12-01").toISOString()).toBe("2026-12-01T21:59:59.999Z");
    expect(dayKey(dayEnd("2026-12-01"))).toBe("2026-12-01");
  });
});

describe("flyer guidelines", () => {
  it("counts words, not punctuation", () => {
    expect(wordCount("Bake 4 Chesed", "— · Cafeteria")).toBe(4);
  });

  it("warns about an event with no date, no photo, too many words", () => {
    const w = flyerWarnings({
      template: "EVENT", title: "A very long event name that goes on", line: "and on and on and on", place: "x",
    });
    expect(w.join(" ")).toMatch(/words/);
    expect(w.join(" ")).toMatch(/No date/);
    expect(w.join(" ")).toMatch(/No photo/);
    expect(w.join(" ")).toMatch(/60px/);
  });

  it("is quiet about a good one", () => {
    expect(flyerWarnings({
      template: "EVENT", title: "Kindness Booth", startsAt: "2026-10-23", hasImage: true, place: "Main lobby",
    })).toEqual([]);
  });

  it("sizes an event title to fit, never over 72px", () => {
    expect(eventTitleSize("Kindness Booth")).toBe(64);
    expect(eventTitleSize("Run")).toBe(72);
  });
});

describe("markup", () => {
  it("escapes everything a person typed", () => {
    expect(esc(`<img src=x onerror="a">`)).toBe("&lt;img src=x onerror=&quot;a&quot;&gt;");
    const html = flyerHTML({
      id: "1", template: "EVENT", title: "<script>", line: null, startsAt: null, time: null, place: null,
      ambassadors: null, icon: null, imageUrl: "javascript:alert(1)", qrSvg: "<script>x</script>", qrLabel: null,
    }, "HAFTR");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });

  it("doubles the ticker so the loop has no seam", () => {
    const html = marqueeHTML([{ name: "Ramaz", hours: 1530 }]);
    expect(html.match(/Ramaz/g)).toHaveLength(2);
  });
});

describe("names", () => {
  it("splits a theme from its English and finds the Hebrew", () => {
    expect(themeParts("Hachnasat Orchim-Welcoming Guests")).toEqual({ en: "Hachnasat Orchim", he: "הכנסת אורחים" });
    expect(themeParts("Something New")).toEqual({ en: "Something New", he: null });
  });

  it("uses a set short name, or the first two words", () => {
    expect(shortName("HAFTR High School", "HAFTR")).toBe("HAFTR");
    expect(shortName("Ulpana Orot Girls High School")).toBe("Ulpana Orot");
    expect(shortName("Ramaz")).toBe("Ramaz");
  });
});
