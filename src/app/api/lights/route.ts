import { NextResponse } from "next/server";
import { recomputeProgramLights } from "@/lib/program-lights";

/**
 * The nightly traffic-light run.
 *
 * Works out, for every school and every program, whether a coordinator may
 * approach them — and expires any manual light whose date has passed.
 *
 * Authorised by a shared secret rather than a session, because nobody is
 * signed in at five in the morning. Without CRON_SECRET it refuses: an open
 * endpoint that rewrites who may be contacted is not something to leave
 * lying around.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not for you." }, { status: 401 });
  }

  const result = await recomputeProgramLights();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
