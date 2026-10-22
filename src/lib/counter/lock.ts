import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { readDoc } from "@/lib/lobby/store";

/**
 * The password on the counter iPad.
 *
 * One shared word, typed once on a device that then stays unlocked. Not an
 * account: nobody is typing an email address at a table with dough on their
 * hands, and the thing being protected is a tally of pizzas on a wall in
 * JOC's own building.
 *
 * Three things follow from that, and they are the whole design:
 *
 * The word itself is **not in this repository**, which is public. It lives
 * in the lobby document beside everything else about that screen, so it can
 * be read, changed and rotated without a deploy and without being published
 * on GitHub.
 *
 * The cookie is not the word. It is an HMAC of the word under the app's own
 * signing secret, so a cookie cannot be written by anybody who does not
 * already know the word, and changing the word silently logs every device
 * out — which is what makes rotating it worth anything.
 *
 * And it protects a counter, nothing else. Somebody who learns the word can
 * add pizzas to a wall. Every submit is written to ImpactSubmit with a time
 * against it, so a silly number is visible and reversible. This must never
 * become the lock on anything that matters.
 */

export const COUNTER_COOKIE = "joc-counter";

/** A year: a device on a table should not be asked again this season. */
export const COUNTER_MAX_AGE = 365 * 24 * 60 * 60;

/** The word, as set in the lobby panel. Empty means no password is set. */
export async function counterPassword(): Promise<string> {
  const doc = await readDoc().catch(() => null);
  return (doc?.settings.counterPass ?? "").trim();
}

/**
 * What the cookie holds: proof of the word, not the word.
 *
 * Keyed on AUTH_SECRET, so a token minted by this deployment is useless
 * anywhere else, and on the word itself, so changing the word invalidates
 * every token already handed out.
 */
export function tokenFor(password: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", `counter:${secret}`).update(password).digest("hex");
}

/** Constant time, so a wrong guess cannot be narrowed down by timing it. */
export function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/** Whether this device has already typed the word. */
export async function counterUnlocked(): Promise<boolean> {
  const password = await counterPassword();
  // No password set is not "everybody in": the page falls back to the
  // staff sign-in, which is a decision made where the password is set.
  if (!password) return false;

  const jar = await cookies();
  const held = jar.get(COUNTER_COOKIE)?.value ?? "";
  if (!held) return false;
  return sameToken(held, tokenFor(password));
}
