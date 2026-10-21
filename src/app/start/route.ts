import { NextResponse } from "next/server";
import { safeAuth } from "@/auth";
import { schoolAccess } from "@/lib/school-access";
import { DEMO_HOME } from "@/lib/demo-school";

/**
 * Where somebody goes the moment they are signed in.
 *
 * Sign-in used to land everybody on /home, and /home sent a demo school on
 * to its screen — but /home sits under the site's loading screen, so the
 * browser drew the portal's frame and a grey page first and only then moved
 * on. A school seeing JOC for the first time saw the rest of the site flash
 * past before its own.
 *
 * A route handler answers with the redirect itself: nothing is drawn until
 * the browser is already at the right page. Everybody who is not a demo
 * school goes on to /home exactly as before, and /home still makes all of
 * its own decisions — this only takes the one that has to come first.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);

  const session = await safeAuth();
  const me = session?.user;
  if (!me) return go("/");
  if (me.mustChangePassword) return go("/account/password?forced=1");

  const access = await schoolAccess(me.schoolId).catch(() => null);
  if (access?.state === "DEMO") return go(DEMO_HOME);

  return go("/home");
}
