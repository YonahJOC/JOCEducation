import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPES, FILTERS, clockOf, matchesFilter, matchesSearch, mayChange, parseFilter,
  parseGroupSize, parseStatus, parseType, pinWallClock, summaryLine, takesGroupSize, toInputs,
} from "@/lib/experiences";

/**
 * The Experiences log's rules: what a row is called when nobody named it,
 * which rows each filter shows, when it happened, and who may change it.
 * Pure functions — the pages and actions lean on every one of them.
 */

describe("summaryLine", () => {
  it("keeps what somebody wrote", () => {
    expect(summaryLine("CALL", "The Cohens", "  Asked about Sukkot  ")).toBe("Asked about Sukkot");
  });

  it("fills a blank one in from the type and the client", () => {
    expect(summaryLine("CALL", "The Cohens", "")).toBe("Call with The Cohens");
    expect(summaryLine("WHATSAPP", "The Cohens")).toBe("WhatsApp with The Cohens");
    expect(summaryLine("EXPERIENCE_BOOKED", "Shul youth")).toBe("Experience booked for Shul youth");
    expect(summaryLine("EXPERIENCE_DONE", "Shul youth", null)).toBe("Experience with Shul youth");
  });

  it("has a line for every type", () => {
    for (const t of ACTIVITY_TYPES) expect(summaryLine(t, "X").length).toBeGreaterThan(1);
  });

  it("never comes back empty, and never runs long", () => {
    expect(summaryLine("NOTE", "  ")).toBe("Note on a client");
    expect(summaryLine("NOTE", "X", "a".repeat(500))).toHaveLength(200);
  });
});

describe("filters", () => {
  it("all covers every type, so a new one cannot go missing", () => {
    expect([...FILTERS.all].sort()).toEqual([...ACTIVITY_TYPES].sort());
  });

  it("talk, booked and done between them cover everything, once each", () => {
    const parts = [...FILTERS.talk, ...FILTERS.booked, ...FILTERS.done];
    expect(parts.sort()).toEqual([...ACTIVITY_TYPES].sort());
  });

  it("matches by type", () => {
    expect(matchesFilter("CALL", "talk")).toBe(true);
    expect(matchesFilter("CALL", "booked")).toBe(false);
    expect(matchesFilter("EXPERIENCE_DONE", "done")).toBe(true);
    expect(matchesFilter("EXPERIENCE_DONE", "all")).toBe(true);
    expect(matchesFilter("VISIT", "all")).toBe(false);
  });

  it("reads anything unknown as all", () => {
    expect(parseFilter("booked")).toBe("booked");
    expect(parseFilter("constructor")).toBe("all");
    expect(parseFilter(undefined)).toBe("all");
  });
});

describe("matchesSearch", () => {
  const row = { clientName: "The Levine family", summary: "Call with them", detail: "Wants a date in Adar" };
  it("finds the client, the summary and the detail, ignoring case", () => {
    expect(matchesSearch(row, "levine")).toBe(true);
    expect(matchesSearch(row, "CALL")).toBe(true);
    expect(matchesSearch(row, "adar")).toBe(true);
    expect(matchesSearch(row, "purim")).toBe(false);
  });
  it("matches everything when the box is empty", () => {
    expect(matchesSearch({ ...row, detail: null }, "   ")).toBe(true);
  });
});

describe("pinWallClock", () => {
  const now = new Date("2026-10-11T15:42:00.000Z");

  it("keeps the time as typed, in UTC", () => {
    expect(pinWallClock("2026-11-02", "14:30", now).toISOString()).toBe("2026-11-02T14:30:00.000Z");
  });

  it("files a date with no time at midnight", () => {
    expect(pinWallClock("2026-11-02", "", now).toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(pinWallClock("2026-11-02", "2pm", now).toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });

  it("means now when there is no date", () => {
    expect(pinWallClock("", "14:30", now)).toBe(now);
    expect(pinWallClock("next tuesday", "", now)).toBe(now);
  });

  it("round-trips through the edit inputs", () => {
    expect(toInputs(pinWallClock("2026-11-02", "09:05", now))).toEqual({ when: "2026-11-02", time: "09:05" });
    expect(toInputs(pinWallClock("2026-11-02", "", now))).toEqual({ when: "2026-11-02", time: "" });
  });
});

describe("clockOf", () => {
  it("shows a time somebody typed", () => {
    expect(clockOf(new Date("2026-11-02T14:30:00.000Z"))).toBe("2:30 PM");
  });
  it("shows nothing for a date with no time", () => {
    expect(clockOf(new Date("2026-11-02T00:00:00.000Z"))).toBeNull();
  });
});

describe("parsing what a form sends", () => {
  it("group size is a whole, plausible number or nothing", () => {
    expect(parseGroupSize("40")).toBe(40);
    expect(parseGroupSize(" 12 ")).toBe(12);
    expect(parseGroupSize("0")).toBeNull();
    expect(parseGroupSize("-3")).toBeNull();
    expect(parseGroupSize("4.5")).toBeNull();
    expect(parseGroupSize("20000")).toBeNull();
    expect(parseGroupSize(null)).toBeNull();
  });

  it("only the experience itself has a group", () => {
    expect(takesGroupSize("EXPERIENCE_BOOKED")).toBe(true);
    expect(takesGroupSize("EXPERIENCE_DONE")).toBe(true);
    expect(takesGroupSize("CALL")).toBe(false);
  });

  it("an unknown status is a lead, an unknown type is nothing", () => {
    expect(parseStatus("REGULAR")).toBe("REGULAR");
    expect(parseStatus("VIP")).toBe("LEAD");
    expect(parseType("MEETING")).toBe("MEETING");
    expect(parseType("VISIT")).toBeNull();
  });
});

describe("mayChange", () => {
  it("lets the author change their own entry", () => {
    expect(mayChange({ authorId: "u1" }, { id: "u1", superAdmin: false })).toBe(true);
  });
  it("does not let anybody else", () => {
    expect(mayChange({ authorId: "u1" }, { id: "u2", superAdmin: false })).toBe(false);
    expect(mayChange({ authorId: null }, { id: null, superAdmin: false })).toBe(false);
    expect(mayChange({ authorId: null }, { id: "u2", superAdmin: false })).toBe(false);
  });
  it("always lets a super admin", () => {
    expect(mayChange({ authorId: "u1" }, { id: "u9", superAdmin: true })).toBe(true);
    expect(mayChange({ authorId: null }, { id: null, superAdmin: true })).toBe(true);
  });
});
