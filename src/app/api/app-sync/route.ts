import { NextResponse } from "next/server";
import { runAppSync, isAppConnected } from "@/lib/app-sync";

/**
 * The scheduled read of the JOC App. Every 15 minutes, from Vercel Cron.
 *
 * Authorised by a shared secret rather than a session, because nobody is
 * signed in when it runs. Without CRON_SECRET set it refuses — an open
 * endpoint that writes to every school's figures is not something to leave
 * lying around.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not for you." }, { status: 401 });
  }

  if (!isAppConnected) {
    return NextResponse.json(
      { ok: false, error: "The JOC App is not connected yet — set JOC_APP_API_URL and JOC_APP_API_KEY." },
      { status: 503 },
    );
  }

  const result = await runAppSync();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
