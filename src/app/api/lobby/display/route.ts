import { readDoc } from "@/lib/lobby/store";
import { sanitizeDoc } from "@/lib/lobby/config";

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
  const doc = await readDoc();
  const etag = `"v${doc.version}"`;

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  return new Response(JSON.stringify(sanitizeDoc(doc)), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      etag,
    },
  });
}
