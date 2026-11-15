import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { readDoc } from "@/lib/lobby/store";
import { sanitizeDoc } from "@/lib/lobby/config";
import { liveTotals, liveTag } from "@/lib/lobby/live";

/**
 * The whole lobby document, for the lobby panel's preview.
 *
 * It used to be public, when it was what the TV read. The wall reads
 * /api/lobby/screen now, and this is the raw document: the team's private
 * notes on each program, the Google key and the counter's password. So it
 * goes only to somebody who may edit the lobby.
 *
 * ETag on the version number and a 304 when it has not moved.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!openForReview) {
    const session = await safeAuth();
    if (!session?.user) return Response.json({ error: "Sign in required." }, { status: 401 });
    if (!can(session.user, "lobby")) return Response.json({ error: "Not yours." }, { status: 403 });
  }

  const [doc, live] = await Promise.all([readDoc(), liveTotals()]);

  // The ETag covers the live figures as well as the document's version.
  // On the version alone, a night's sync would land new numbers that every
  // screen then sat behind a 304 until somebody happened to edit a program.
  const etag = `"v${doc.version}.${liveTag(live)}"`;

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  // `live` rides alongside the document rather than inside it: the document
  // is what the panel edits and what sanitizeDoc guarantees the shape of,
  // and these are read from the app and belong to nobody's keyboard.
  return new Response(JSON.stringify({ ...sanitizeDoc(doc), live }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      etag,
    },
  });
}
