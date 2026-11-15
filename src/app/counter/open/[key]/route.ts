import { NextResponse } from "next/server";
import {
  COUNTER_COOKIE, COUNTER_MAX_AGE, counterPassword, sameToken, tokenFor,
} from "@/lib/counter/lock";

/**
 * The counter's own link: open it on the iPad once and the counter is there.
 *
 * Nobody types anything. The key in the address is the counter's password
 * (a long random one, set in the lobby document), so having the link is
 * what lets a device in — it goes to the iPads at the table and nowhere
 * else. Opening it sets the same cookie typing the word would, for the same
 * months, and then shows the counter.
 *
 * A wrong key is a plain 404, so the address can't be used to guess one.
 * Changing the key (a new counterPass) retires every device let in by the
 * old link.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const expected = await counterPassword();

  // A short or missing password is not good enough to be a link.
  if (expected.length < 16 || !sameToken(tokenFor(key ?? ""), tokenFor(expected))) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }

  const res = NextResponse.redirect(new URL("/counter", req.url), 303);
  res.cookies.set(COUNTER_COOKIE, tokenFor(expected), {
    path: "/",
    maxAge: COUNTER_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.headers.set("cache-control", "no-store");
  // Keep the key out of anything the counter page loads afterwards.
  res.headers.set("referrer-policy", "no-referrer");
  return res;
}
