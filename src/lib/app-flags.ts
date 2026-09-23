/**
 * Which schools need somebody to call them, and why.
 *
 * The rules live here, away from the database and the page, because they are
 * the product. Everything else on the panel is arrangement; this is the part
 * that decides whether a coordinator rings a school today.
 */

export type FlagKind = "message" | "hours" | "drop" | "quiet";

/** Worst first. A waiting message outranks everything — somebody asked us. */
export const FLAG_PRIORITY: Record<FlagKind, number> = {
  message: 0,
  hours: 1,
  drop: 2,
  quiet: 3,
};

export type Flag = {
  kind: FlagKind;
  /** The band's label and the one figure in it. */
  label: string;
  figure: string;
  /** Said in full on the row. */
  reason: string;
  /** How long the condition has held, in days. */
  days: number;
  /** The one thing to do about it. */
  action: { label: string; kind: "message" | "hours" | "school" };
};

/** What a school looks like to the flag rules. Everything nullable is a thing the app may not answer. */
export type FlagInput = {
  status: string;
  /** Oldest unanswered message from the school, if any. */
  unansweredSince: Date | null;
  /** Hours waiting for approval. */
  unapprovedMinutes: number;
  unapprovedOldestAt: Date | null;
  /** Active students this month and last. */
  activeStudents: number;
  activeStudentsLast: number;
  /** The most recent thing anybody there did. */
  lastActivityAt: Date | null;
};

const DAY = 86_400_000;
const daysSince = (d: Date, now: number) => Math.floor((now - new Date(d).getTime()) / DAY);

/** Hours, to one decimal, from minutes. */
export function hours(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

/**
 * The flag on one school, or null.
 *
 * Only ever one. A school with three problems still gets one phone call, and
 * a row carrying three bands is a row nobody reads.
 */
export function flagFor(s: FlagInput, now = Date.now()): Flag | null {
  // Somebody at the school asked us something and we have not answered.
  if (s.unansweredSince) {
    const days = daysSince(s.unansweredSince, now);
    return {
      kind: "message",
      label: "Waiting on us",
      figure: days === 0 ? "today" : `${days}d`,
      reason: "They sent a message nobody has answered.",
      days,
      action: { label: "Read message", kind: "message" },
    };
  }

  // Hours sitting unapproved. A student who logs chesed and watches it sit
  // there stops logging, which is the thing this whole panel exists to catch.
  if (s.unapprovedOldestAt && s.unapprovedMinutes > 0) {
    const days = daysSince(s.unapprovedOldestAt, now);
    if (days > 7) {
      return {
        kind: "hours",
        label: "Hours waiting",
        figure: `${hours(s.unapprovedMinutes)}h`,
        reason: `The oldest has been waiting ${days} days for a teacher to approve it.`,
        days,
        action: { label: "See hours waiting", kind: "hours" },
      };
    }
  }

  // Half the students stopped. Only worth saying when there were enough of
  // them for the halving to mean something rather than be two people.
  if (s.activeStudentsLast >= 10 && s.activeStudents * 2 <= s.activeStudentsLast) {
    return {
      kind: "drop",
      label: "Students dropped",
      figure: `${s.activeStudents} of ${s.activeStudentsLast}`,
      reason: `Active students fell from ${s.activeStudentsLast} last month to ${s.activeStudents}.`,
      // Measured against the month, not an event, so it reads as "this month".
      days: 30,
      action: { label: "Open school", kind: "school" },
    };
  }

  // Nothing at all for a fortnight, at a school that is supposed to be running.
  if (s.status === "ACTIVE") {
    const days = s.lastActivityAt ? daysSince(s.lastActivityAt, now) : null;
    if (days === null || days >= 14) {
      return {
        kind: "quiet",
        label: "Gone quiet",
        figure: days === null ? "never" : `${days}d`,
        reason:
          days === null
            ? "Nobody at this school has ever logged anything."
            : `Nothing logged for ${days} days.`,
        days: days ?? 999,
        action: { label: "Open school", kind: "school" },
      };
    }
  }

  return null;
}

/**
 * The order the rows sit in: flagged first, worst kind first, then whichever
 * has been wrong longest, then by name so the list is stable between loads.
 */
export function compareRows(
  a: { flag: Flag | null; name: string },
  b: { flag: Flag | null; name: string },
): number {
  if (a.flag && !b.flag) return -1;
  if (!a.flag && b.flag) return 1;
  if (a.flag && b.flag) {
    const byKind = FLAG_PRIORITY[a.flag.kind] - FLAG_PRIORITY[b.flag.kind];
    if (byKind !== 0) return byKind;
    const byAge = b.flag.days - a.flag.days;
    if (byAge !== 0) return byAge;
  }
  return a.name.localeCompare(b.name);
}

/**
 * How old everything on the page is.
 *
 * The sync runs every 15 minutes. Three missed runs is the point at which
 * somebody should stop trusting the numbers, so that is when it says so.
 */
export const SYNC_INTERVAL_MINUTES = 15;
export const SYNC_STALE_MINUTES = 45;

export function syncAge(lastOk: Date | null, now = Date.now()): {
  stale: boolean;
  minutes: number | null;
  text: string;
} {
  if (!lastOk) {
    return { stale: true, minutes: null, text: "The JOC App has never been read." };
  }
  const minutes = Math.floor((now - new Date(lastOk).getTime()) / 60_000);
  if (minutes < SYNC_STALE_MINUTES) {
    return {
      stale: false,
      minutes,
      text: minutes < 1 ? "Read just now" : `Read ${minutes} min ago`,
    };
  }
  const h = Math.floor(minutes / 60);
  const at = new Date(lastOk).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    stale: true,
    minutes,
    text: `Sync stopped at ${at} — everything here is ${h < 1 ? `${minutes} min` : `${h}h`} old`,
  };
}
