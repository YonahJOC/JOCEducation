/**
 * The chips on "Ask <coordinator> something" (5e).
 *
 * Its own module because a `"use server"` file may only export async
 * functions. Exporting this from the actions file compiled without complaint
 * and then arrived in the browser as something that was not an array, so the
 * sheet threw the moment anybody opened it.
 *
 * ── Why these are per program ─────────────────────────────────────────────
 *
 * "A date" and "The kit" are Kindness Booth questions. A school opening the
 * JOC App has no kit and no date, and would have had to pick "Something else"
 * every time — which tells the coordinator nothing and makes the chips a
 * decoration. Each program names the things its own schools actually ask
 * about, and anything without a list gets the general set.
 */

/** What a school asks about when nothing more specific fits. */
export const DEFAULT_TOPICS = [
  "A date",
  "The kit",
  "A meeting",
  "A demo for our staff",
  "Something else",
] as const;

/**
 * By program slug.
 *
 * Written by whoever runs the program rather than guessed at: these are the
 * four Gilad named for the app.
 */
export const TOPICS_BY_PROGRAM: Record<string, readonly string[]> = {
  "joc-app": [
    "Tech issues",
    "Payment question",
    "Coins and the coin store",
    "Adding admins",
    "A meeting",
    "A demo for our staff",
    "Something else",
  ],
};

/** The chips for one program, or the general set. */
export function topicsFor(slug: string | null | undefined): readonly string[] {
  if (!slug) return DEFAULT_TOPICS;
  return TOPICS_BY_PROGRAM[slug] ?? DEFAULT_TOPICS;
}

/**
 * The chip that turns an ask into a meeting request.
 *
 * Picking it shows a date field. Everything else about the ask is the same —
 * same console row, same answer, same record — so this is one word rather
 * than a second form.
 */
export const MEETING_TOPIC = "A meeting";

/**
 * Showing the program to the rest of the staff room.
 *
 * Its own chip rather than a line inside "a meeting", because the two need
 * different things of a coordinator: one is a conversation, the other is a
 * room, a date and something prepared to show. It takes the same date field.
 */
export const DEMO_TOPIC = "A demo for our staff";

/** Asks that come with a date. */
export const DATED_TOPICS: readonly string[] = [MEETING_TOPIC, DEMO_TOPIC];

/** Every topic any program offers, for validating what comes back. */
export const ALL_TOPICS: readonly string[] = [
  ...DEFAULT_TOPICS,
  ...Object.values(TOPICS_BY_PROGRAM).flat(),
];

/** Kept for callers that have not been given a program yet. */
export const TOPICS = DEFAULT_TOPICS;

export type Topic = string;
