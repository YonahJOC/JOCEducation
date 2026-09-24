/**
 * Every page, and whether anything links to it.
 *
 * Cutting the sidebar from twenty-odd links to seven is the right shape, but
 * it is also how a page stops existing without anybody deleting it. It has
 * already happened twice: thirteen console pages lost their way in, and then
 * People & access — the page that grants permissions — fell off the end of a
 * slice(0, 7).
 *
 * So this walks every route and asks one question: does anything in src/
 * point at it. A route with no inbound link is not necessarily broken, but
 * somebody has to be able to say why.
 *
 *   node scripts/check-reachable.mjs
 */

import fs from "node:fs";
import path from "node:path";

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

const files = walk("src");
const source = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));

// Every rendered route, from the app directory's page files.
const routes = files
  .filter((f) => /[\\/]page\.tsx$/.test(f) && f.includes(`src${path.sep}app${path.sep}`))
  .map((f) => {
    const rel = f
      .split(`src${path.sep}app${path.sep}`)[1]
      .split(path.sep)
      .slice(0, -1)                       // drop "page.tsx"
      .filter((seg) => !seg.startsWith("(")) // route groups are not URL segments
      .join("/");
    return { file: f, route: `/${rel}` };
  })
  .filter((r) => !r.route.includes("[")) // dynamic routes are linked by template
  .sort((a, b) => a.route.localeCompare(b.route));

// Routes nothing should link to, with the reason.
const EXPECTED = {
  "/": "the site's front door",
  "/login": "reached by the auth flow, not by a link",
  "/verify": "reached from an email link",
  "/reset-password": "reached from an email link",
  "/forgot-password": "linked from the sign-in form's own markup",
  "/no-access": "where the gate sends somebody",
  "/portal": "a redirect",
};

const unlinked = [];

for (const { route, file } of routes) {
  if (route === "/") continue;

  // Anything that mentions the path, in any of the forms the codebase uses.
  const linked = [...source.entries()].some(([f, text]) => {
    if (f === file) return false;
    return (
      text.includes(`"${route}"`) ||
      text.includes(`'${route}'`) ||
      text.includes(`\`${route}\``) ||
      text.includes(`${route}?`) ||
      text.includes(`${route}#`) ||
      text.includes(`href="${route}`)
    );
  });

  if (!linked) unlinked.push(route);
}

console.log(`${routes.length} routes\n`);

const orphans = unlinked.filter((r) => !EXPECTED[r]);
const known = unlinked.filter((r) => EXPECTED[r]);

if (orphans.length > 0) {
  console.log("Nothing links to these:");
  for (const r of orphans) console.log(`  ✗ ${r}`);
} else {
  console.log("Every route has something pointing at it.");
}

if (known.length > 0) {
  console.log("\nReached another way, on purpose:");
  for (const r of known) console.log(`  · ${r.padEnd(22)} ${EXPECTED[r]}`);
}

process.exit(orphans.length > 0 ? 1 : 0);
