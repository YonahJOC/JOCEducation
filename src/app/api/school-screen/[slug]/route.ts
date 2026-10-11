import { buildScreenData, demoScreenData } from "@/lib/school-screen/data";

/**
 * What a school's TV reads. Public, because a TV cannot sign in.
 *
 * It returns exactly the ScreenData type and nothing else — see
 * src/lib/school-screen/types.ts for why each field is safe on a wall. An
 * unknown school is a 404. ETag on a hash of the content, so a screen
 * polling every five minutes gets a 304 when nothing has moved.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const origin = url.origin;

  const data = url.searchParams.has("demo")
    ? await demoScreenData(origin)
    : await buildScreenData(slug, origin);
  if (!data) {
    return Response.json({ error: "No such school." }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  const etag = `"${data.version}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
      etag,
    },
  });
}
