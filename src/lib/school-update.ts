/**
 * What the "Add someone" option in the contacts list is worth.
 *
 * Its own module because a "use server" file may only export async functions
 * — a plain constant exported from one arrives in the browser as something
 * else entirely, which is how a previous list of topics reached a sheet as a
 * non-array and threw.
 */
export const NEW_CONTACT = "__new";

/** The two shapes a school update can take. */
export type UpdateKind = "INTERACTION" | "EVENT";

/**
 * How the interaction happened. A meeting, a call and an email are the same
 * fact told three ways, so they share one branch of the form and differ only
 * in the record they write — all three already exist in ActivityType.
 */
export type InteractionType = "MEETING" | "CALL" | "WHATSAPP" | "EMAIL";

/** In the order they are offered, and the order they are used. */
export const INTERACTION_TYPES = ["MEETING", "CALL", "WHATSAPP", "EMAIL"] as const;

/** An event is either in the diary or already behind us. */
export type EventStage = "BOOKED" | "DONE";

/** What each one is called, on the form and on the board. */
export const INTERACTION_LABEL: Record<InteractionType, string> = {
  MEETING: "Meeting",
  CALL: "Phone call",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
};

/** Every record the School Update Form writes. */
export const UPDATE_TYPES = [
  "VISIT", "MEETING", "CALL", "WHATSAPP", "EMAIL", "EVENT_PLANNED",
] as const;

/** What each record is called on a row. */
export const TAG: Record<string, string> = {
  MEETING: "MEETING",
  CALL: "PHONE CALL",
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
  VISIT: "EVENT",
  EVENT_PLANNED: "BOOKED",
};

/**
 * Dates are read back in UTC everywhere, because that is how they are
 * written: a booked event keeps the clock on the wall at the school rather
 * than the server's. See actions/school-update.ts.
 */
export const day = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

export const shortDay = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

export const monthOf = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * The time of a booked event, which is the only row where somebody typed one.
 *
 * Every other row carries whatever the clock said when it was written, and
 * showing that is showing a number nobody chose — a call logged at 5:35pm
 * reads as a call held at 5:35pm.
 */
export const clock = (d: Date, type: string) =>
  type !== "EVENT_PLANNED" || (d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
    ? null
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

/** How far off, said the way a person would say it. */
export function away(d: Date, from: Date): string {
  const days = Math.round((d.getTime() - from.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  if (days < 14) return "Next week";
  return `In ${Math.round(days / 7)} weeks`;
}

/** How long ago, for a feed that is read top down. */
export function ago(d: Date, from: Date): string {
  const days = Math.round((from.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return monthOf(d);
}
