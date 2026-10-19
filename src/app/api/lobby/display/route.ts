import { readDoc } from "@/lib/lobby/store";
import { sanitizeDoc } from "@/lib/lobby/config";
import { liveTotals, liveTag } from "@/lib/lobby/live";

/**
 * What the screens read. Public, because a TV cannot sign in.
 *
 * It carries nothing a passer-by could not read off the screen itself: the
 * programs running today, what is coming up and the impact counters.
 *
 * ETag on the version number and a 304 when it has not moved — a Fire TV
 * stick polls this every minute, all day, forever.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
