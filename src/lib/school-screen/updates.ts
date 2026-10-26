import type { QueueItem } from "./queue";

/**
 * What happened to the things a student sent in.
 *
 * Deliberately not a message centre. JOC never writes to a student and
 * neither does their school through this page — every line here is
 * something the student's own work did, worked out from the state it is
 * in. Nothing is sent, so there is nothing to reply to, and the page says
 * that out loud rather than leaving somebody waiting for an answer.
 *
 * Pure: it takes the rows and gives back lines. The page does the asking.
 */

export type UpdateTone = "good" | "info" | "quiet";

export type Update = {
  /** Unique across the kinds, so two tables cannot collide on an id. */
  key: string;
  /** ISO, newest first. */
  at: string;
  icon: string;
  tone: UpdateTone;
  headline: string;
  line: string;
};

/** A report of a run, as the student's own page holds it. */
export type ReportSeen = {
  id: string;
  eventTitle: string | null;
  occurredOn: Date | string;
  seenAt: Date | string | null;
};

const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString());

export function ambassadorUpdates(mine: QueueItem[], reports: ReportSeen[] = []): Update[] {
  const out: Update[] = [];

  for (const item of mine) {
    switch (item.status) {
      case "APPROVED":
        out.push({
          key: `${item.kind}-${item.id}`,
          at: item.at,
          icon: "tv",
          tone: "good",
          headline: "It’s on the screen",
          line: `${item.title} — a teacher put it up.`,
        });
        break;
      case "ENDORSED":
        out.push({
          key: `${item.kind}-${item.id}`,
          at: item.at,
          icon: "arrow_forward",
          tone: "info",
          headline: "Passed on to a teacher",
          // Named, because "an ambassador" is a stranger and this is
          // somebody they sit next to.
          line: item.endorsedBy
            ? `${item.title} — ${item.endorsedBy} passed it on. A teacher decides next.`
            : `${item.title} — a teacher decides next.`,
        });
        break;
      case "SET_ASIDE":
        out.push({
          key: `${item.kind}-${item.id}`,
          at: item.at,
          icon: "inbox",
          tone: "quiet",
          headline: "Set aside for now",
          // Not a dead end: a teacher still sees it and can put it up.
          line: `${item.title} — an ambassador set it aside. A teacher can still put it up.`,
        });
        break;
      case "REJECTED":
        out.push({
          key: `${item.kind}-${item.id}`,
          at: item.at,
          icon: "do_not_disturb_on",
          tone: "quiet",
          headline: "Not approved",
          line: `${item.title} — your school decided not to put this one up.`,
        });
        break;
      case "PENDING":
        // Nothing has happened to it yet, and "you sent this in" is not
        // news to the person who sent it in.
        break;
    }
  }

  for (const r of reports) {
    if (!r.seenAt) continue;
    const what = r.eventTitle ?? `your write-up from ${iso(r.occurredOn).slice(0, 10)}`;
    out.push({
      key: `report-${r.id}`,
      at: iso(r.seenAt),
      icon: "drafts",
      tone: "info",
      headline: "Your teacher read your report",
      line: `${what} — they have seen it.`,
    });
  }

  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/**
 * How many of these are new since the student last looked.
 *
 * There is nowhere to record "last looked" yet, so this counts the ones
 * from the last day — enough for the rail to say something happened today
 * without claiming to know what has been read.
 */
export function updatesToday(updates: Update[], now: Date): number {
  const since = new Date(now.getTime() - 86_400_000).toISOString();
  return updates.filter((u) => u.at >= since).length;
}
