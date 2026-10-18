import { describe, expect, it } from "vitest";
import { gematria, hebrewDate, withHebrew } from "@/lib/hebrew-date";

/**
 * The Hebrew date, and the letters it is written with.
 *
 * The numerals are ours rather than Intl's — `numberingSystem: "hebr"`
 * resolves back to Latin digits in Node and in browsers — so the rules are
 * worth pinning. The two that matter are ט״ו and ט״ז, which are written that
 * way rather than י״ה and י״ו because those spell a Name.
 */

describe("gematria", () => {
  it("writes a single letter with a geresh", () => {
    expect(gematria(1)).toBe("א׳");
    expect(gematria(7)).toBe("ז׳");
    expect(gematria(9)).toBe("ט׳");
    expect(gematria(10)).toBe("י׳");
    expect(gematria(30)).toBe("ל׳");
  });

  it("writes several with a gershayim before the last", () => {
    expect(gematria(11)).toBe("י״א");
    expect(gematria(21)).toBe("כ״א");
    expect(gematria(29)).toBe("כ״ט");
  });

  it("never spells a Name: fifteen and sixteen", () => {
    expect(gematria(15)).toBe("ט״ו");
    expect(gematria(16)).toBe("ט״ז");
    expect(gematria(15)).not.toContain("י");
    expect(gematria(16)).not.toContain("י");
  });

  it("applies that to the last two digits of any number", () => {
    expect(gematria(115)).toBe("קט״ו");
    expect(gematria(116)).toBe("קט״ז");
  });

  it("writes a year, dropping the thousands", () => {
    // 5787 is written תשפ״ז, not ה׳תשפ״ז, on anything read at a glance.
    expect(gematria(5787)).toBe("תשפ״ז");
    expect(gematria(5786)).toBe("תשפ״ו");
  });

  it("gives nothing for a number that is not one", () => {
    expect(gematria(0)).toBe("");
    expect(gematria(-3)).toBe("");
    expect(gematria(NaN)).toBe("");
  });
});

describe("hebrewDate", () => {
  const d = (iso: string) => new Date(iso + "T09:00:00Z");

  it("is in Hebrew, in letters", () => {
    expect(hebrewDate(d("2026-10-18"))).toBe("ז׳ בחשוון");
  });

  it("adds the year when asked", () => {
    expect(hebrewDate(d("2026-10-18"), { year: true })).toBe("ז׳ בחשוון תשפ״ז");
  });

  it("gets the leap month right", () => {
    // Intl knows Adar II; we only letter the numbers.
    expect(hebrewDate(d("2027-03-15"))).toContain("אדר ב׳");
  });

  it("uses ט״ו where the day is the fifteenth", () => {
    expect(hebrewDate(d("2026-12-25"))).toBe("ט״ו בטבת");
  });

  it("reads the day in the zone it is given", () => {
    // Late in the UTC evening it is already tomorrow in Jerusalem.
    const late = new Date("2026-10-18T22:30:00Z");
    expect(hebrewDate(late, { timeZone: "Asia/Jerusalem" }))
      .toBe(hebrewDate(new Date("2026-10-19T06:00:00Z"), { timeZone: "Asia/Jerusalem" }));
  });

  it("never throws", () => {
    expect(() => hebrewDate(new Date())).not.toThrow();
  });
});

describe("withHebrew", () => {
  const d = new Date("2026-10-18T09:00:00Z");

  it("puts the Hebrew after the English", () => {
    expect(withHebrew("Sunday, October 18", d)).toContain("Sunday, October 18");
    expect(withHebrew("Sunday, October 18", d)).toContain("ז׳ בחשוון");
  });

  it("isolates the Hebrew so it cannot reorder the line around it", () => {
    const out = withHebrew("Mon 19 Oct", d);
    expect(out).toContain("⁨");
    expect(out).toContain("⁩");
    // The English must still start the string, whatever bidi does to it.
    expect(out.startsWith("Mon 19 Oct")).toBe(true);
  });

  it("takes the caller's separator", () => {
    expect(withHebrew("Today", d, { separator: " — " })).toContain("Today — ");
  });
});
