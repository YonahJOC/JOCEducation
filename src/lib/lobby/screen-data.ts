import { createHash } from "node:crypto";
import { buildScreenData } from "@/lib/school-screen/data";
import type { ScreenData } from "@/lib/school-screen/types";
import { readDoc } from "@/lib/lobby/store";
import { combineEvents } from "@/lib/lobby/events";
import { buildView } from "@/lib/lobby/model";
import { liveTotals } from "@/lib/lobby/live";
import { prisma } from "@/lib/prisma";
import type { Slide, WeekDay } from "@/lib/lobby/model";

/**
 * What the lobby wall reads.
 *
 * The wall is a school's live screen now, so it is served the same
 * `ScreenData` a school's TV gets — dedication, flyers, photos, shout-outs,
 * the lot — built for the `joc-lobby` school by the very function that
 * builds every other school's. Nothing about that path is reimplemented
 * here, which is the point: the two walls cannot drift apart.
 *
 * On top of it rides `lobby`, which is the part a school has no equivalent
 * of: the programme calendar somebody types into the lobby panel, the two
 * counters, what the building is learning this cycle, and the hours figure
 * the app reports. A school screen shows flyers where this shows the diary.
 */

/** One programme, with everything already formatted for the wall. */
export type LobbyEvent = {
  id: string;
  program: string;
  groupLine: string;
  /** "1:30pm" */
  time: string;
  /** "1:30pm – 2:30pm" */
  timeRange: string;
  allDay: boolean;
  /** "Happening now", "Next up", or the day it falls on. */
  label: string;
  venue: { chip: string; icon: string; color: string; tint: string } | null;
};

export type LobbyDay = {
  key: string;
  dowShort: string;
  num: number;
  mon: string;
  events: LobbyEvent[];
};

export type LobbyScreenData = ScreenData & {
  lobby: {
    /** Today's programmes that have not finished. */
    today: LobbyEvent[];
    /** The week ahead, for when today is done — the panel is never empty. */
    ahead: LobbyEvent[];
    /** The days still to come, for the card on the right. */
    week: LobbyDay[];
    /** All-day items. */
    banners: LobbyEvent[];
    theme: { en: string; he: string; question: string };
    counters: { beds: number; pizzas: number };
    /** Hours across every organisation on the app, or null if it did not answer. */
    hours: number | null;
  };
};

/** The slug the lobby's own school record goes by. */
export const LOBBY_SLUG = "joc-lobby";

const toEvent = (e: Slide | (WeekDay["events"][number] & { label?: string })): LobbyEvent => ({
  id: e.id,
  program: e.program,
  groupLine: e.groupLine,
  time: e.time,
  timeRange: e.timeRange,
  allDay: e.allDay,
  label: "label" in e && e.label ? e.label : "",
  venue: e.venue
    ? { chip: e.venue.chip, icon: e.venue.icon, color: e.venue.color, tint: e.venue.tint }
    : null,
});

/**
 * The version the TVs hang their ETag on.
 *
 * It has to cover the whole payload, which is why it is recomputed here.
 * `buildScreenData` hashes its own result and returns that as `version` —
 * correct for a school, whose screen is entirely that data, and wrong the
 * moment anything is added on top. Everything below is: the programme
 * diary, the counters, the theme, the ticker.
 *
 * Left as the school's hash, a programme Dalia typed in would not move the
 * version, every screen would be answered 304, and the wall would quietly
 * go on showing yesterday until something unrelated changed.
 */
function versionOf(d: Omit<LobbyScreenData, "version">): string {
  return createHash("sha1").update(JSON.stringify(d)).digest("hex").slice(0, 16);
}

export async function buildLobbyScreenData(
  origin: string,
  now = new Date(),
): Promise<LobbyScreenData | null> {
  const base = await buildScreenData(LOBBY_SLUG, origin, now);
  if (!base) return null;

  const doc = await readDoc();
  // Google is read in the browser, as it is on the panel's own preview: the
  // key is the calendar's, not a secret this server holds.
  const view = buildView(combineEvents(doc, null), doc.settings, now);
  const live = await liveTotals();

  /**
   * The ticker along the foot: every school the app reports, not only the
   * ones with a screen of their own.
   *
   * A school's own screen shows the others that have a screen up, which is
   * the right list for a school — it is the company it keeps. On the lobby
   * wall that filter left the ticker empty, because almost nobody has set a
   * screen URL. Here it is every school the app has figures for, which is
   * what the wall in this building should be showing.
   *
   * Hours all-time, as the app reports them; the label says so.
   */
  const network = await prisma.appSchoolStats
    .findMany({
      where: { hoursAllTime: { gt: 0 }, school: { isTest: false } },
      orderBy: { hoursAllTime: "desc" },
      select: { hoursAllTime: true, school: { select: { name: true, screenShortName: true } } },
    })
    .catch(() => []);

  const assembled: Omit<LobbyScreenData, "version"> = {
    ...base,
    // The lobby keeps its own cycle theme. A school's comes from the Cycle
    // it is running, and editing that to change this wall would change
    // every school's screen with it.
    // The topic a school takes from its Cycle; the lobby's is its own.
    theme: {
      en: doc.settings.theme.en,
      he: doc.settings.theme.he || null,
      topic: doc.settings.theme.question || null,
    },
    network: network.map((n) => ({
      name: n.school.screenShortName || n.school.name,
      hours: n.hoursAllTime ?? 0,
    })),
    networkSchools: network.length,
    // The counter beside the ticker is the app’s own all-schools figure,
    // not our sum of the rows above: the app counts organisations this
    // portal does not track.
    worldHours: live.hours,
    // A school shows hours by grade. The lobby has no grades; its three
    // tiles are built on the client from `lobby` below.
    grades: null,
    lobby: {
      today: view.slides.map(toEvent),
      ahead: view.ahead.map(toEvent),
      week: view.week.map((d) => ({
        key: d.key,
        dowShort: d.dowShort,
        num: d.num,
        mon: d.mon,
        events: d.events.map(toEvent),
      })),
      banners: view.banners.map(toEvent),
      theme: doc.settings.theme,
      counters: { beds: doc.counters.values.beds, pizzas: doc.counters.values.pizzas },
      hours: live.hours,
    },
  };

  return { ...assembled, version: versionOf(assembled) };
}
