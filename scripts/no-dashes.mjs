import fs from "node:fs";

/**
 * Replace every "—" placeholder with words.
 *
 *   node scripts/no-dashes.mjs
 *
 * A dash reads as "loading", "nothing" or "zero" depending on who is looking.
 * Each one below gets the words that actually fit its column, which is why
 * this is a list rather than a regex.
 */

const EDITS = [
  // Date helpers that returned a dash for "no date".
  ["src/app/admin/page.tsx", `  if (!date) return "—";`, `  if (!date) return "Not set";`],
  ["src/app/admin/schools/status/StatusBoard.tsx", `  if (!d) return "—";`, `  if (!d) return "Not yet";`],
  ["src/app/admin/schools/[slug]/page.tsx", `  if (!d) return "—";`, `  if (!d) return "Not recorded";`],
  ["src/components/admin/DemoTable.tsx", `  if (!d) return "—";`, `  if (!d) return "Not set";`],

  // The status board's hand-typed hours field.
  ["src/app/admin/schools/status/StatusBoard.tsx", `          placeholder="—"`, `          placeholder="Not checked"`],

  // A log line, where only a string will do.
  ["src/app/actions/admin.ts", `\${before?.status ?? "—"}`, `\${before?.status ?? "no status"}`],

  // The account page.
  ["src/app/account/page.tsx", `value={u.email ?? "—"}`, `value={u.email ?? "Not recorded"}`],

  // Cycle dates.
  ["src/app/admin/cycles/CyclesClient.tsx",
    `{d.startDate ? formatCycleRange(d.startDate, d.startDate).split(" – ")[0] : "—"}`,
    `{d.startDate ? formatCycleRange(d.startDate, d.startDate).split(" – ")[0] : "No date yet"}`],

  // The overview's school rows.
  ["src/app/admin/page.tsx", `{s.city ?? s.region ?? "—"}`, `{s.city ?? s.region ?? "Place not recorded"}`],
  ["src/app/admin/page.tsx", `{s.plan ? PLAN_LABELS[s.plan] : "—"}`, `{s.plan ? PLAN_LABELS[s.plan] : <Absent>No plan</Absent>}`],
  ["src/app/admin/page.tsx", `{s.seats ?? "—"}`, `{s.seats ?? <Absent>Not set</Absent>}`],

  // Demo table.
  ["src/components/admin/DemoTable.tsx", `{demo.schoolName ?? "—"}`, `{demo.schoolName ?? <Absent>No school given</Absent>}`],
];

/** The sign-up tables all share these three cells, in three files. */
const SIGNUP_CELLS = [
  [`{r.name ?? "—"}`, `{r.name ?? <Absent>No name given</Absent>}`],
  [`{r.email ?? "—"}`, `{r.email ?? <Absent>No email given</Absent>}`],
  [`{r.answers.find((a) => a.label === c)?.value ?? "—"}`, `{r.answers.find((a) => a.label === c)?.value ?? <Absent>Not answered</Absent>}`],
];
const SIGNUP_FILES = [
  "src/app/admin/forms/FormsClient.tsx",
  "src/app/admin/programs/[slug]/ProgramAdminClient.tsx",
  "src/app/school/programs/page.tsx",
];

const touched = new Set();

function apply(path, from, to) {
  let s = fs.readFileSync(path, "utf8");
  const n = s.split(from).length - 1;
  if (n === 0) return 0;
  s = s.split(from).join(to);
  fs.writeFileSync(path, s);
  touched.add(path);
  return n;
}

let count = 0;
for (const [path, from, to] of EDITS) count += apply(path, from, to);
for (const path of SIGNUP_FILES) {
  for (const [from, to] of SIGNUP_CELLS) count += apply(path, from, to);
}

// Anything that now renders <Absent> needs to import it.
for (const path of touched) {
  let s = fs.readFileSync(path, "utf8");
  if (!s.includes("<Absent>") || s.includes('from "@/components/Absent"')) continue;
  const firstImport = s.indexOf("import ");
  const lineEnd = s.indexOf("\n", firstImport);
  s = `${s.slice(0, lineEnd + 1)}import { Absent } from "@/components/Absent";\n${s.slice(lineEnd + 1)}`;
  fs.writeFileSync(path, s);
}

console.log(`${count} dashes replaced across ${touched.size} files`);
