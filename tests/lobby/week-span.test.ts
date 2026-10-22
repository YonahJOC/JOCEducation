import { describe, expect, it } from "vitest";
import { weekSheetDays } from "@/lib/lobby/week-sheet";
import { zonedToInstant } from "@/lib/lobby/time";

/**
 * How far "this week at JOC" reaches.
 *
 * It used to be seven days from whenever somebody pressed the button, which
 * is a different week every day and always loses the day a week out. Made
 * on Thursday 22 October it ran to Wednesday the 28th and dropped Thursday
 * the 29th — an Art Therapy session that was simply missing from the sheet
 * sent to the staff group.
 *
 * It now runs to the end of the coming week: today, the rest of this week,
 * and all of next. The first test is the one that was broken.
 */

/** The last date the sheet covers, given the day it is made on. */
function lastDay(dateKey: string): string {
  const now = zonedToInstant(dateKey, "10:00");
  const days = weekSheetDays(now);
  const end = new Date(`${dateKey}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days - 1);
  return end.toISOString().slice(0, 10);
}

describe("the sheet reaches the end of the coming week", () => {
  it("made on a Thursday, it still contains the next Thursday", () => {
    // The bug, pinned: 22 October 2026 is a Thursday and 29 October is the
    // next one. The old seven-day window stopped on the 28th.
    const days = weekSheetDays(zonedToInstant("2026-10-22", "10:00"));
    expect(days).toBeGreaterThanOrEqual(8);
    expect(lastDay("2026-10-22") >= "2026-10-29").toBe(true);
  });

  it("always ends on a Saturday, whatever day it is made", () => {
    // Sunday the 18th through Saturday the 24th, every starting day.
    for (const key of [
      "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21",
      "2026-10-22", "2026-10-23", "2026-10-24",
    ]) {
      const end = new Date(`${lastDay(key)}T12:00:00Z`);
      expect(end.getUTCDay(), `${key} ended on ${lastDay(key)}`).toBe(6);
    }
  });

  it("never covers less than a week, and never more than two", () => {
    for (const key of [
      "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21",
      "2026-10-22", "2026-10-23", "2026-10-24",
    ]) {
      const days = weekSheetDays(zonedToInstant(key, "10:00"));
      expect(days, key).toBeGreaterThanOrEqual(8);
      expect(days, key).toBeLessThanOrEqual(14);
    }
  });

  it("gives a clean fortnight when made on a Sunday", () => {
    // Nothing of this week has gone, so it is this week and next entire.
    expect(weekSheetDays(zonedToInstant("2026-10-18", "10:00"))).toBe(14);
  });

  it("gives the shortest sheet on a Saturday", () => {
    // The week is over; what is left is all of next week plus today.
    expect(weekSheetDays(zonedToInstant("2026-10-24", "10:00"))).toBe(8);
  });

  it("reads the Jerusalem day, not the machine's", () => {
    // Late evening in Jerusalem is still the previous day in UTC. The sheet
    // belongs to the building it is made in.
    const lateThursday = zonedToInstant("2026-10-22", "23:30");
    expect(weekSheetDays(lateThursday)).toBe(weekSheetDays(zonedToInstant("2026-10-22", "09:00")));
  });
});
