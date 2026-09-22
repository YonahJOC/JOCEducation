import { NextResponse } from "next/server";

/**
 * Which commit is actually live.
 *
 * "Did that deploy?" has no answer from outside unless a change happens to
 * touch a public page — most do not, because most of this site is behind the
 * login gate. So the deployed commit says so itself.
 *
 * Deliberately only the commit id, the branch and when it was built. No
 * environment, no configuration, nothing that is a secret: a commit id on a
 * private repository tells an outsider nothing they can act on, and tells
 * whoever is deploying exactly what they need.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return NextResponse.json(
    {
      commit: sha ? sha.slice(0, 7) : "local",
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
      // The deployment, not the moment you asked — a timestamp generated here
      // would be the request time wearing a deploy time's name.
      deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
