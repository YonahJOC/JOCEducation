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
export type InteractionType = "MEETING" | "CALL" | "EMAIL";

/** An event is either in the diary or already behind us. */
export type EventStage = "BOOKED" | "DONE";

/** What each one is called, on the form and on the board. */
export const INTERACTION_LABEL: Record<InteractionType, string> = {
  MEETING: "Meeting",
  CALL: "Phone call",
  EMAIL: "Email",
};
