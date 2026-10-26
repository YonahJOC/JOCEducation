import { describe, expect, it } from "vitest";
import { screenTodayRows, type ScreenTodayCounts } from "@/lib/school-screen/today";

/**
 * What the hallway screen says on a school's home page.
 *
 * A teacher does not sign in to look after a television, so this has one
 * job: say that seven things have been sitting there since Tuesday, and
 * otherwise keep quiet. The rules worth holding: a school without a screen
 * hears nothing about one, and nothing here reads as a telling-off.
 */

const counts = (over: Partial<ScreenTodayCounts> = {}): ScreenTodayCounts => ({
  endorsed: 0,
  pending: 0,
  setAside: 0,
  dedicationToday: true,
  screenUp: true,
  ...over,
});

describe("a school with no screen", () => {
  it("is told nothing about one", () => {
    // Including the dedication row, which would otherwise appear for every
    // school in the country every day.
    expect(screenTodayRows(counts({ screenUp: false, endorsed: 4, dedicationToday: false }))).toEqual([]);
  });
});

describe("what a teacher is told", () => {
  it("says nothing at all on a quiet day", () => {
    expect(screenTodayRows(counts())).toEqual([]);
  });

  it("puts what students passed on above everything else it has", () => {
    const rows = screenTodayRows(counts({ endorsed: 3, pending: 2, setAside: 1, dedicationToday: false }));
    expect(rows[0].kind).toBe("SCREEN_ENDORSED");
    expect(rows.map((r) => r.weight)).toEqual([...rows.map((r) => r.weight)].sort((a, b) => b - a));
  });

  it("is the only screen row that may be loud", () => {
    // Orange on a school's own page means "you are holding something up".
    const rows = screenTodayRows(counts({ endorsed: 3, pending: 2, setAside: 1, dedicationToday: false }));
    expect(rows.filter((r) => r.tone === "warn").map((r) => r.kind)).toEqual(["SCREEN_ENDORSED"]);
  });

  it("does not blame the students for what nobody has reached", () => {
    const [row] = screenTodayRows(counts({ pending: 5 }));
    expect(row.title).toBe("5 nobody has looked at yet");
    expect(row.line).toContain("you do not have to wait for them");
  });

  it("sends a set-aside pile to the tab that holds it", () => {
    const [row] = screenTodayRows(counts({ setAside: 2 }));
    expect(row.action?.href).toBe("/school/uploads?tab=aside");
  });

  it("mentions the dedication only when there is none, and quietly", () => {
    expect(screenTodayRows(counts({ dedicationToday: true }))).toEqual([]);
    const [row] = screenTodayRows(counts({ dedicationToday: false }));
    expect(row.kind).toBe("SCREEN_DEDICATION");
    // Most days there is nobody to dedicate the day to, and that is fine.
    expect(row.tone).toBe("quiet");
    expect(row.action?.href).toBe("/school/screen?tab=dedication");
  });

  it("gives every row somewhere to go", () => {
    const rows = screenTodayRows(counts({ endorsed: 1, pending: 1, setAside: 1, dedicationToday: false }));
    expect(rows).toHaveLength(4);
    for (const r of rows) expect(r.action?.href, r.kind).toBeTruthy();
  });
});
