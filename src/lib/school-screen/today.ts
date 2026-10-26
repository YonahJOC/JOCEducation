import type { SchoolTodayRow } from "@/lib/school-today";

/**
 * What the hallway screen needs from a teacher, on the school's home page.
 *
 * A teacher does not sign in to look after a television. They sign in, see
 * what is waiting, and leave — so the one thing the screen must manage to
 * say on that page is "seven things have been sitting here since Tuesday".
 * Everything else about it can wait until they open it.
 *
 * Pure, and separate from the queries, because the part worth being sure
 * of is which of these appear and in what order.
 */

export type ScreenTodayCounts = {
  /** Passed on by an ambassador, waiting for the school's sign-off. */
  endorsed: number;
  /** Nobody has looked at these at all. */
  pending: number;
  /** A student said no; the school can still say yes. */
  setAside: number;
  /** Something is already dedicated for today. */
  dedicationToday: boolean;
  /** This school's screen is switched on. Nothing shows if it is not. */
  screenUp: boolean;
};

const UPLOADS = "/school/uploads";

export function screenTodayRows(c: ScreenTodayCounts): SchoolTodayRow[] {
  // A school with no screen is not behind on one.
  if (!c.screenUp) return [];

  const rows: SchoolTodayRow[] = [];

  if (c.endorsed > 0) {
    rows.push({
      id: "screen-endorsed",
      kind: "SCREEN_ENDORSED",
      label: "On the screen?",
      figure: String(c.endorsed),
      // The most time-sensitive thing a teacher owns here: a student has
      // done their half and is waiting to see whether it went up.
      tone: "warn",
      weight: 90,
      title: `${c.endorsed} passed on by your ambassadors`,
      line: "Your yes is what puts them in the hallway.",
      action: { label: "Have a look", href: UPLOADS },
    });
  }

  if (c.pending > 0) {
    rows.push({
      id: "screen-pending",
      kind: "SCREEN_PENDING",
      label: "Not looked at",
      figure: String(c.pending),
      tone: "info",
      weight: 65,
      title: `${c.pending} nobody has looked at yet`,
      // Not a complaint about the students. A school whose ambassador is
      // away for a week must not have a stuck screen.
      line: "Your ambassadors get first look, but you do not have to wait for them.",
      action: { label: "Have a look", href: UPLOADS },
    });
  }

  if (c.setAside > 0) {
    rows.push({
      id: "screen-aside",
      kind: "SCREEN_ASIDE",
      label: "Set aside",
      figure: String(c.setAside),
      tone: "quiet",
      weight: 45,
      title: `${c.setAside} set aside by an ambassador`,
      line: "A student said no to these. You can still put any of them up.",
      action: { label: "See them", href: `${UPLOADS}?tab=aside` },
    });
  }

  if (!c.dedicationToday) {
    rows.push({
      id: "screen-dedication",
      kind: "SCREEN_DEDICATION",
      label: "Dedication",
      figure: "None today",
      word: true,
      tone: "quiet",
      weight: 40,
      title: "No dedication set for today",
      // Deliberately not orange and deliberately not a telling-off: most
      // days there is nobody to dedicate the day to, and that is fine.
      line: "The screen shows one across the top when there is one to show.",
      action: { label: "Set one", href: "/school/screen?tab=dedication" },
    });
  }

  return rows;
}
