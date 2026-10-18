import { describe, it, expect } from "vitest";
import { formatHebrewDate, formatDateLong } from "@/lib/lobby/time";

/**
 * The Hebrew date in the lobby header.
 *
 * Fixed instants, checked against the Hebrew calendar, so a change to the
 * formatter that quietly drops the month or the day fails here rather than
 * on a wall in front of a building full of people.
 */
describe("formatHebrewDate", () => {
  it("gives the day and the month", () => {
    // 18 October 2026, mid-morning Jerusalem time.
    const d = new Date("2026-10-18T07:37:00Z");
    expect(formatDateLong(d)).toBe("Sunday, October 18");
    // In Hebrew, and in letters: ז׳ בחשוון.
    expect(formatHebrewDate(d)).toBe("ז׳ בחשוון");
  });

  it("turns over at Jerusalem midnight, not at UTC midnight", () => {
    // 22:30 UTC is already the next day in Jerusalem (UTC+2/+3).
    const lateUtc = new Date("2026-10-18T22:30:00Z");
    const nextMorning = new Date("2026-10-19T06:00:00Z");
    expect(formatHebrewDate(lateUtc)).toBe(formatHebrewDate(nextMorning));
  });

  it("moves on by one across a day", () => {
    const a = formatHebrewDate(new Date("2026-10-18T09:00:00Z"));
    const b = formatHebrewDate(new Date("2026-10-19T09:00:00Z"));
    expect(a).not.toBe(b);
  });

  it("never throws", () => {
    expect(() => formatHebrewDate(new Date())).not.toThrow();
  });
});
