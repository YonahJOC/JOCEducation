/**
 * The lobby TV screen.
 *
 * A route handler rather than a page, so this is the whole document: none of
 * the site's layout, fonts, global CSS, analytics or React reaches a screen
 * that has to run unattended on a Fire TV stick for months. It serves the
 * same markup the standalone project did, pointed at the two files
 * `npm run build:lobby` writes into public/lobby/.
 *
 * Public on purpose — a television cannot sign in, and everything here is
 * what anybody standing in the lobby can already read off the wall.
 *
 * `?demo=1` fills it with sample programs, `?debug=1` shows the data's age,
 * and `?preview=1` is the admin panel's live preview, which takes its data by
 * postMessage instead of from the server.
 */
export const dynamic = "force-dynamic";

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>JOC Lobby Screen</title>
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24..48,600,1,0&display=block" rel="stylesheet" />
    <link rel="stylesheet" href="/lobby/screen.css" />
    <style>
      html, body { margin: 0; height: 100%; background: #0a2a7a; overflow: hidden; cursor: none; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="/lobby/screen.js" defer></script>
  </body>
</html>
`;

export async function GET() {
  return new Response(PAGE, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // A kiosk left alone for a month must still pick up a new build.
      "cache-control": "no-cache, no-store, must-revalidate",
      // It is a screen in a lobby, not a page for a search engine.
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
