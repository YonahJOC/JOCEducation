/**
 * The two approvals, as rules rather than as lookups.
 *
 * A student ambassador reads the queue first and passes things on; the
 * school signs them off, and only that puts anything in a hallway.
 *
 * These live apart from access.ts because that module reaches for the
 * session and the database, and through `@/auth` it drags in next-auth —
 * which a unit test cannot load and the televisions have no use for. What is
 * actually worth testing here is three pure functions, so they are three
 * pure functions in a file that imports nothing.
 */

export type ScreenRole = "staff" | "teacher" | "ambassador";

/**
 * The second approval: the one that puts something on a wall.
 *
 * The school's own people only. An ambassador endorsing something does not
 * put it up, which is the whole point of having two stages.
 */
export function canApprove(role: ScreenRole | null | undefined): boolean {
  return role === "staff" || role === "teacher";
}

/**
 * The first approval: a student ambassador reading the queue.
 *
 * Teachers and JOC are included because they can do anything an ambassador
 * can, and because a school with nobody in the role must not be stuck. An
 * administrator approving a PENDING item outright is an endorsement and a
 * sign-off in one move.
 */
export function canEndorse(role: ScreenRole | null | undefined): boolean {
  return role === "staff" || role === "teacher" || role === "ambassador";
}

/**
 * What a yes or a no means, depending on who said it.
 *
 * An ambassador's yes is ENDORSED and their no is SET_ASIDE; the school's
 * are APPROVED and REJECTED. Nothing else in the app has to know this rule,
 * which is why it is written down once.
 */
export function decisionFor(
  role: ScreenRole,
  yes: boolean,
): "ENDORSED" | "APPROVED" | "SET_ASIDE" | "REJECTED" {
  if (role === "ambassador") return yes ? "ENDORSED" : "SET_ASIDE";
  return yes ? "APPROVED" : "REJECTED";
}
