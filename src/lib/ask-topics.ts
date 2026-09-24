/**
 * The three chips on "Ask <coordinator> something" (5e).
 *
 * Its own module because a `"use server"` file may only export async
 * functions. Exporting this array from the actions file compiled without
 * complaint and then arrived in the browser as something that was not an
 * array, so the sheet threw the moment anybody opened it.
 */
export const TOPICS = ["A date", "The kit", "Something else"] as const;

export type Topic = (typeof TOPICS)[number];
