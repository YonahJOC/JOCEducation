/**
 * A school's hallway TV.
 *
 * A route handler rather than a page, like the lobby screen: this is the
 * whole document, and none of the site's layout, fonts, CSS or analytics
 * reaches a screen that has to run unattended for months. It loads the two
 * files `npm run build:school-screen` writes into public/school-screen/.
 *
 * Public on purpose — a television cannot sign in — and it shows only what
 * anybody in that hallway can read off the wall. Whether the school exists is
 * the data route's question; this page is the same for every slug.
 *
 * `?demo=1` shows the design's sample school, `?debug=1` the data's age.
 */
export const dynamic = "force-dynamic";

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!--
      Same reason as the lobby's. Chrome on Android re-colours any page
      that declares no scheme under "Auto dark theme for web contents", and
      a hallway screen opened on a teacher's phone came up charcoal with
      the shout-out card red. The television in the hallway never does it,
      which is exactly why nobody would report it.
    -->
    <meta name="color-scheme" content="light" />
    <title>JOC School Screen</title>
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Frank+Ruhl+Libre:wght@700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24..48,600,1,0&display=block" rel="stylesheet" />
    <link rel="stylesheet" href="/school-screen/screen.css" />
    <style>
      html { color-scheme: only light; }
      html, body { margin: 0; height: 100%; background: #222898; overflow: hidden; cursor: none; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="/school-screen/screen.js" defer></script>
  </body>
</html>
`;

export async function GET() {
  return new Response(PAGE, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // A screen left alone for a month must still pick up a new build.
      "cache-control": "no-cache, no-store, must-revalidate",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
