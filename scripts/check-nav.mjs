/**
 * What each role's rail actually contains.
 *
 * Cutting the sidebar to seven items ended in `items.slice(0, 7)`, and
 * "People & access" is pushed last. A super admin holds every capability, so
 * the list built to eight and the slice silently dropped the page that grants
 * permissions — from the rail of the only person who can use it, and its own
 * page is where the link to admin types lives.
 *
 * Nobody noticed because nothing renders a super admin's rail in review mode.
 * So this runs the real function and says what comes out.
 *
 *   node scripts/check-nav.mjs
 *
 * It exits non-zero if a rail is over seven items, or if a super admin cannot
 * see People & access.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const out = fs.mkdtempSync(path.join(os.tmpdir(), "joc-nav-"));

// tsc cannot resolve the two "@/…" specifiers when it is pointed at single
// files rather than the project, so it exits 2 — but it still emits, and the
// rewrite below is what makes the output runnable. The emit is the contract
// here, not the exit code.
try {
  execFileSync(
    process.execPath,
    [
      "./node_modules/typescript/bin/tsc",
      "src/lib/nav.ts", "src/lib/access.ts", "src/lib/joc-tokens.ts",
      "--outDir", out,
      "--module", "esnext", "--target", "es2022",
      "--moduleResolution", "bundler", "--skipLibCheck", "--jsx", "react-jsx",
    ],
    { stdio: "ignore" },
  );
} catch {
  // Expected: see above.
}

if (!fs.existsSync(path.join(out, "nav.js"))) {
  console.error("tsc emitted nothing — run it by hand to see why.");
  process.exit(1);
}

const navPath = path.join(out, "nav.js");
fs.writeFileSync(
  navPath,
  fs.readFileSync(navPath, "utf8")
    .replace("@/lib/access", "./access.js")
    .replace("@/lib/joc-tokens", "./joc-tokens.js"),
);

const { jocNav } = await import(new URL(`file://${navPath.split(path.sep).join("/")}`));

const ROLES = [
  ["Super admin", { role: "SUPER_ADMIN", capabilities: null }, {}],
  ["Programming", { role: "PROGRAM_STAFF", capabilities: ["programming", "programs", "schools", "run_admin_agenda", "cycles"] }, {}],
  ["Educational", { role: "ADMIN", capabilities: ["lessons", "resources", "cycles", "programs", "site", "board"] }, {}],
  ["Coordinator", { role: "TEACHER", capabilities: [] }, {
    programs: [{ name: "Kindness Booth", slug: "kindness-booth", heroColor: "#2D46AF", need: 4 }],
  }],
];

let bad = 0;

for (const [who, user, opts] of ROLES) {
  const items = jocNav(user, opts);
  const labels = items.map((i) => i.label);
  console.log(`${who.padEnd(13)} ${String(labels.length).padStart(2)}  ${labels.join(" · ")}`);

  if (labels.length > 7) {
    console.error(`   ✗ ${who} has more than seven items`);
    bad++;
  }
  if (who === "Super admin" && !labels.includes("People & access")) {
    console.error("   ✗ a super admin cannot reach People & access");
    bad++;
  }
}

fs.rmSync(out, { recursive: true, force: true });

if (bad > 0) process.exit(1);
console.log("\nEvery rail is within seven, and the keys are on the super admin's.");
