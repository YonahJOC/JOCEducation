"use server";

import { cookies } from "next/headers";
import {
  COUNTER_COOKIE, COUNTER_MAX_AGE, counterPassword, sameToken, tokenFor,
} from "@/lib/counter/lock";

/**
 * Typing the word on the iPad.
 *
 * Slow on purpose. There is one word and it is short, so the only attack
 * worth the name is trying words quickly from somewhere else; a pause on
 * every attempt makes that take longer than anybody would bother with,
 * and costs the person at the table a moment they will not notice.
 */
export async function unlockCounter(input: string): Promise<{ ok: boolean; error?: string }> {
  const expected = await counterPassword();
  if (!expected) {
    return { ok: false, error: "No password is set for the counter yet." };
  }

  const given = (input ?? "").trim();
  await new Promise((r) => setTimeout(r, 400));

  // Compared as the same thing the cookie holds, so the comparison is
  // over two fixed-length strings and cannot leak the length of the word.
  if (!sameToken(tokenFor(given), tokenFor(expected))) {
    return { ok: false, error: "That is not the password." };
  }

  const jar = await cookies();
  jar.set(COUNTER_COOKIE, tokenFor(expected), {
    path: "/",
    maxAge: COUNTER_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}

/** For a device that should stop being a counter. */
export async function lockCounter(): Promise<void> {
  const jar = await cookies();
  jar.delete(COUNTER_COOKIE);
}
