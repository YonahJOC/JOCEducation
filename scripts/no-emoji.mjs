import fs from "node:fs";

/**
 * Replace the emoji icons with type.
 *
 *   node scripts/no-emoji.mjs
 *
 * ☎ ✉ ◷ ✎ ⇅ rendered as whatever font the reader's system chose, at whatever
 * size and colour it felt like, and a padlock at 34px was the loudest thing
 * on a page whose message was "this isn't yours". They become Plex Mono type
 * labels in a panel chip, and the lock screens become a heading and a
 * sentence.
 */

const ACTIVITY_ICONS = `  CALL: "☎", EMAIL: "✉", MEETING: "◷", DEMO: "▶", NOTE: "✎",
  PLAN_CHANGE: "⇅", ACCESS_GRANTED: "✓", ACCESS_REVOKED: "×", STATUS_CHANGE: "→",`;

const ACTIVITY_WORDS = `  CALL: "CALL", EMAIL: "EMAIL", MEETING: "MEETING", DEMO: "DEMO", NOTE: "NOTE",
  PLAN_CHANGE: "PLAN", ACCESS_GRANTED: "ACCESS ON", ACCESS_REVOKED: "ACCESS OFF",
  STATUS_CHANGE: "STATUS", VISIT: "VISIT",`;

const EDITS = [
  ["src/app/admin/page.tsx", ACTIVITY_ICONS, ACTIVITY_WORDS],
  ["src/app/admin/schools/[slug]/page.tsx", ACTIVITY_ICONS, ACTIVITY_WORDS],

  // The padlocks. The heading already says it; the emoji only shouted.
  ["src/app/admin/layout.tsx", `          <p style={{ fontSize: "34px", marginBottom: "14px" }}>🔒</p>\n`, ""],
  ["src/app/admin/meetings/page.tsx", `        <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>\n`, ""],
  ["src/app/admin/programs/[slug]/page.tsx", `        <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>\n`, ""],
  ["src/app/school/layout.tsx", `          <p style={{ fontSize: "32px", marginBottom: "14px" }}>🔒</p>\n`, ""],
  ["src/components/admin/Guard.tsx", `      <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>\n`, ""],

  // The eye on "see this as its coordinator does".
  ["src/app/admin/programs/[slug]/ProgramAdminClient.tsx",
    `            <span aria-hidden="true">👁</span>\n`, ""],

  // The envelope over the contact page's thank-you.
  ["src/app/contact/page.tsx",
    `        <div style={{ fontSize: "48px", marginBottom: "20px" }}>✉</div>`,
    `        <p style={{ ...label, color: C.orangeText, marginBottom: "12px" }}>Message sent</p>`],
];

let count = 0;
const touched = new Set();

for (const [path, from, to] of EDITS) {
  let s = fs.readFileSync(path, "utf8");
  const n = s.split(from).length - 1;
  if (n === 0) {
    console.log(`MISS ${path}`);
    continue;
  }
  fs.writeFileSync(path, s.split(from).join(to));
  count += n;
  touched.add(path);
}

console.log(`${count} replacements across ${touched.size} files`);
