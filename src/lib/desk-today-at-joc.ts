import { readDoc } from "@/lib/lobby/store";
import { combineEvents } from "@/lib/lobby/events";
import { shapeEvent, visibleEvents } from "@/lib/lobby/model";
import { VENUE_ICONS, VENUE_PALETTE } from "@/lib/lobby/parse";
import { formatTime } from "@/lib/lobby/time";

/**
 * What JOC is running today, for the corner of somebody's desk.
 *
 * The lobby TV already knows this — the same document, the same parsing, the
 * same venue rules — so this reads it rather than inventing a second answer.
 * If the two ever disagreed, the screen in the lobby and the screen on the
 * desk would be telling staff different things about the same afternoon.
 *
 * Returns null when nothing is on, and the card is then not drawn at all.
 */

export type TodayAtJoc = {
  title: string;
  group: string;
  /** "THE SHUK · 2:00–4:00 PM · +2 MORE" */
  meta: string;
  icon: string;
  color: string;
  tint: string;
};

export async function todayAtJoc(now: Date): Promise<TodayAtJoc | null> {
  try {
    const doc = await readDoc();
    const settings = doc.settings;

    const events = visibleEvents(combineEvents(doc, null), settings);
    const shaped = events.map((e) => shapeEvent(e, settings));

    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const tomorrow = new Date(midnight.getTime() + 86400000);

    const todays = shaped
      .filter((e) => e.start >= midnight && e.start < tomorrow)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    if (todays.length === 0) return null;

    // The next one that hasn't finished, or the last of the day if they all
    // have — somebody looking at 5pm still wants to know what happened.
    const next = todays.find((e) => e.end >= now) ?? todays[todays.length - 1];
    const more = todays.length - 1;

    const when = next.allDay
      ? "ALL DAY"
      : `${formatTime(next.start, settings.clock24)}–${formatTime(next.end, settings.clock24)}`;

    // An all-day notice carries no venue, and needs none.
    const venue = next.venue?.type ?? "other";
    return {
      title: next.program,
      group: next.group,
      meta: [next.venue?.chip.toUpperCase(), when.toUpperCase(), more > 0 ? `+${more} MORE` : null]
        .filter(Boolean)
        .join(" · "),
      icon: next.venue ? VENUE_ICONS[venue] : "event",
      color: VENUE_PALETTE[venue].color,
      tint: VENUE_PALETTE[venue].tint,
    };
  } catch {
    // The desk is not the place to report that the lobby screen is unwell.
    return null;
  }
}
