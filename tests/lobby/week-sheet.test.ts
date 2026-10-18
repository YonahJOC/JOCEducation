import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/lobby/config";
import { manualToEvent } from "@/lib/lobby/events";
import { buildWeekSheet } from "@/lib/lobby/week-sheet";
import { buildPosterSvg, wrap } from "@/lib/lobby/poster";
import type { ManualProgram } from "@/lib/lobby/types";

/**
 * The week sheet, and the picture made from it.
 *
 * The sheet is where the mistakes would be: it is the one place that had to
 * differ from the screen's own week — today included, nothing capped at two
 * — so these pin exactly that.
 */

const S = defaultSettings();

const prog = (over: Partial<ManualProgram>): ManualProgram => ({
  id: Math.random().toString(36).slice(2),
  program: "Pizza Making",
  group: "",
  date: "2026-10-18",
  allDay: false,
  start: "10:00",
  end: "11:30",
  location: "",
  venue: "center",
  notes: "",
  createdAt: "",
  updatedAt: "",
  ...over,
});

const ev = (over: Partial<ManualProgram>) => manualToEvent(prog(over));

/** A Sunday, mid-morning Jerusalem time. */
const NOW = new Date("2026-10-18T07:00:00Z");

describe("buildWeekSheet", () => {
  it("includes today, which the screen's own week does not", () => {
    const sheet = buildWeekSheet([ev({ program: "Kindness Booth" })], S, NOW);
    expect(sheet.days).toHaveLength(1);
    expect(sheet.days[0].isToday).toBe(true);
    expect(sheet.days[0].events[0].program).toContain("Kindness Booth");
  });

  it("keeps every program on a day, not the first two", () => {
    const many = ["a", "b", "c", "d", "e"].map((k, i) =>
      ev({ program: "Program " + k, start: String(9 + i).padStart(2, "0") + ":00", end: "23:00" }),
    );
    const sheet = buildWeekSheet(many, S, NOW);
    expect(sheet.days[0].events).toHaveLength(5);
    expect(sheet.programCount).toBe(5);
  });

  it("drops days with nothing on them", () => {
    const sheet = buildWeekSheet(
      [ev({ program: "One" }), ev({ program: "Two", date: "2026-10-21" })],
      S,
      NOW,
    );
    expect(sheet.days).toHaveLength(2);
    expect(sheet.days.map((d) => d.isToday)).toEqual([true, false]);
  });

  it("stops at the window and does not run on", () => {
    const sheet = buildWeekSheet([ev({ program: "Much later", date: "2026-11-30" })], S, NOW, 7);
    expect(sheet.days).toHaveLength(0);
    expect(sheet.programCount).toBe(0);
  });

  it("widens when asked for a fortnight", () => {
    const later = ev({ program: "Next week", date: "2026-10-27" });
    expect(buildWeekSheet([later], S, NOW, 7).days).toHaveLength(0);
    expect(buildWeekSheet([later], S, NOW, 14).days).toHaveLength(1);
  });

  it("puts all-day items before timed ones", () => {
    const sheet = buildWeekSheet(
      [ev({ program: "Timed" }), ev({ program: "All day", allDay: true })],
      S,
      NOW,
    );
    expect(sheet.days[0].events[0].allDay).toBe(true);
  });

  it("labels the range, in both calendars", () => {
    const sheet = buildWeekSheet([ev({ program: "One" })], S, NOW);
    expect(sheet.range).toMatch(/October 2026$/);
    expect(sheet.hebrewRange).not.toBe("");
  });
});

describe("wrap", () => {
  it("breaks on words, never mid-word", () => {
    const lines = wrap("Build A Bed for the Lieberman family", 300, 34);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l.trim()).not.toBe("");
  });

  it("marks what it had to cut rather than losing it silently", () => {
    const lines = wrap(
      "A very long program name that will certainly not fit on two short lines at all",
      200,
      34,
      2,
    );
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });

  it("never returns nothing", () => {
    expect(wrap("", 300, 34)).toEqual([""]);
  });
});

describe("buildPosterSvg", () => {
  const sheet = buildWeekSheet(
    [ev({ program: "Kindness Booth" }), ev({ program: "Build A Bed", date: "2026-10-20" })],
    S,
    NOW,
  );

  it("is one well-formed svg with a real height", () => {
    const svg = buildPosterSvg(sheet);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    const h = Number(/height="(\d+)"/.exec(svg)?.[1]);
    expect(h).toBeGreaterThan(400);
  });

  it("names every program on it", () => {
    const svg = buildPosterSvg(sheet);
    expect(svg).toContain("Kindness Booth");
    expect(svg).toContain("Build A Bed");
  });

  it("escapes a program name that contains markup", () => {
    const nasty = buildWeekSheet([ev({ program: 'Bake <script>&"' })], S, NOW);
    const svg = buildPosterSvg(nasty);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("says so plainly when there is nothing on", () => {
    const svg = buildPosterSvg(buildWeekSheet([], S, NOW));
    expect(svg).toContain("Nothing on the calendar this week.");
  });

  it("names the place, not the screen's category for it", () => {
    // "Off-site, The Rova" and "The Shuk, Machane Yehuda Shuk" both put a
    // label in front of the only part a reader needed.
    const svg = buildPosterSvg(
      buildWeekSheet(
        [
          ev({ program: "Kindness Booth", venue: "other", location: "The Rova, Jerusalem" }),
          ev({ program: "Shuk run", venue: "shuk", location: "Machane Yehuda Shuk" }),
        ],
        S,
        NOW,
      ),
    );
    expect(svg).toContain("The Rova");
    expect(svg).toContain("Machane Yehuda Shuk");
    expect(svg).not.toContain("Off-site");
  });

  it("still names the centre, which has no street under it", () => {
    const svg = buildPosterSvg(
      buildWeekSheet([ev({ program: "Pizza Making", venue: "center" })], S, NOW),
    );
    expect(svg).toMatch(/JOC Cent(er|re)/);
  });

  it("embeds the wordmark when given one, and never fetches it", () => {
    const svg = buildPosterSvg(sheet, { logoDataUrl: "data:image/png;base64,AAAA" });
    expect(svg).toContain('href="data:image/png;base64,AAAA"');
    expect(svg).not.toContain("/brand/");
  });

  it("grows taller as the week fills up", () => {
    const one = buildPosterSvg(buildWeekSheet([ev({ program: "One" })], S, NOW));
    const lots = buildPosterSvg(
      buildWeekSheet(
        ["a", "b", "c", "d"].map((k, i) => ev({ program: "Program " + k, date: "2026-10-1" + (8 + i) })),
        S,
        NOW,
      ),
    );
    const h = (s: string) => Number(/height="(\d+)"/.exec(s)?.[1]);
    expect(h(lots)).toBeGreaterThan(h(one));
  });
});
