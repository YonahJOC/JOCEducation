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
