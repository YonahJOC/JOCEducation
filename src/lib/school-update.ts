/**
 * What the "Someone new" option in the contacts list is worth.
 *
 * Its own module because a "use server" file may only export async functions
 * — a plain constant exported from one arrives in the browser as something
 * else entirely, which is how a previous list of topics reached a sheet as a
 * non-array and threw.
 */
export const NEW_CONTACT = "__new";

/** The two shapes a school update can take. */
export type UpdateKind = "MEETING" | "EVENT";

/** An event is either in the diary or already behind us. */
export type EventStage = "BOOKED" | "DONE";
