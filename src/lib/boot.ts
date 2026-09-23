/**
 * Say loudly when a production build cannot authenticate anybody.
 *
 * This is the most load-bearing condition in the codebase, and until now it
 * was written down nowhere. Signing in configures itself from the
 * environment:
 *
 *   isAuthConfigured = DATABASE_URL && AUTH_SECRET
 *
 * When that is false, the console used to open itself and the login gate used
 * to stand aside — both deliberately, so a fresh clone with no .env could be
 * read end to end. Together they meant one missing environment variable in
 * Vercel would not degrade the site; it would publish thirty-seven schools'
 * records, their contacts, their plans and their history to anybody with the
 * address, and nothing anywhere would say so.
 *
 * Two changes close it, and neither is this file:
 *
 *   src/auth.ts      `openForReview` is false in production whatever the
 *                    environment says, so every guard refuses instead of
 *                    waving people through.
 *   src/proxy.ts     the gate stays shut in production rather than opening.
 *
 * This file is the third thing: somebody has to be told. It does not throw.
 * Throwing here failed the *build*, which is a worse outcome than the problem
 * — the deploy that fixes a missing variable is the one that cannot run.
 *
 * Imported for its side effect by the root layout.
 */

/**
 * Every variable that switches a feature off by being absent, and what it
 * costs while it is.
 *
 * A feature switched off this way is invisible: it simply never runs, and
 * nothing anywhere says why. The console's Today page reads this so a super
 * admin finds out from the portal rather than from a school asking why
 * nothing arrived.
 */
export function missingEnv(): { name: string; costs: string }[] {
  const out: { name: string; costs: string }[] = [];

  if (!process.env.CRON_SECRET) {
    out.push({
      name: "CRON_SECRET",
      costs: "nothing scheduled runs — the JOC App is never read and the traffic light is never recomputed overnight",
    });
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    out.push({
      name: "RESEND_API_KEY",
      costs: "no mail is sent at all, so a password reset dead-ends",
    });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    out.push({
      name: "STRIPE_SECRET_KEY",
      costs: "no school can pay, and a paid form refuses to publish",
    });
  }
  if (!process.env.JOC_APP_API_URL || !process.env.JOC_APP_API_KEY) {
    out.push({
      name: "JOC_APP_API_URL",
      costs: "the JOC App is never read, so its console has no figures",
    });
  }
  if (!process.env.AUTH_GOOGLE_ID) {
    out.push({
      name: "AUTH_GOOGLE_ID",
      costs: "Google sign-in is not offered, so everybody needs a password",
    });
  }

  return out;
}

const missing: string[] = [];
if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");

/** True when this is a production server that nobody can sign in to. */
export const misconfigured =
  process.env.NODE_ENV === "production" && missing.length > 0;

if (misconfigured) {
  console.error(
    "\n" +
      "═".repeat(72) + "\n" +
      "  JOC EDUCATION IS RUNNING WITHOUT SIGN-IN\n" +
      `  Missing: ${missing.join(", ")}\n` +
      "  Nobody can sign in, so the site is serving the landing page and\n" +
      "  refusing everything else. The console and the school panel are\n" +
      "  closed, not open. Set the variable in Vercel and redeploy.\n" +
      "═".repeat(72) + "\n",
  );
}
