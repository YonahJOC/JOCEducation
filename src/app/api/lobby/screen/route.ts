import { buildLobbyScreenData } from "@/lib/lobby/screen-data";

/**
 * What the lobby TV reads. Public, because a television cannot sign in.
 *
 * The same shape a school's screen is served, plus the lobby's own diary,
 * counters and cycle theme. It carries nothing a person standing in the
 * lobby could not read off the wall itself.
 *
 * `/api/lobby/display` is still here and unchanged: that is what the admin
 * panel's preview reads, and the document it returns is the one the panel
 * edits. This is the wall's.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const data = await buildLobbyScreenData(origin);

  if (!data) {
    // The lobby's own school record is missing. Say so plainly rather than
    // serving an empty screen that looks like a quiet day.
    return Response.json(
      { error: "The lobby screen is not set up." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  // The version covers the document and the live figures both, so a new
  // number is not held behind a 304 until somebody edits a programme.
  const etag = `"${data.version}.${data.lobby.hours ?? "-"}"`;
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
