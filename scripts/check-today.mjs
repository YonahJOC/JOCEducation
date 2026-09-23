import { execSync } from "node:child_process";
import fs from "node:fs";

/**
 * What each role sees on Today, and in the rail.
 *
 *   node --env-file=.env scripts/check-today.mjs
 *
 * The rows a person sees are entirely a function of their capabilities, and
 * that is the part worth checking — it is the difference between a super
 * admin being told the crons are off and a coordinator being shown somebody
 * else's overdue invoices.
 *
 * tsx and esbuild do not run in this sandbox, so this compiles what it needs
 * with tsc first and runs the plain JavaScript.
 */

const OUT = ".verify-today";
fs.rmSync(OUT, { recursive: true, force: true });

console.log("compiling…");
// tsc needs the project's own "@/…" mapping, so it gets a tsconfig of its own
// that extends the real one rather than a pile of flags.
fs.writeFileSync(
  "tsconfig.check.json",
  JSON.stringify(
    {
      extends: "./tsconfig.json",
      compilerOptions: {
        noEmit: false,
        outDir: OUT,
        module: "esnext",
        target: "es2022",
        skipLibCheck: true,
        // src/auth.ts leans on next-auth's module augmentation, which only
        // resolves inside the whole project. Emit anyway: the JavaScript is
        // correct, and the types are checked properly by `tsc --noEmit`.
        noEmitOnError: false,
      },
      include: ["src/lib/today.ts", "src/lib/nav.ts"],
    },
    null,
    2,
  ),
);
try {
  execSync("node ./node_modules/typescript/bin/tsc -p tsconfig.check.json", { stdio: "pipe" });
} catch {
  // Type errors from the augmentation above; the emit still happened.
}
fs.rmSync("tsconfig.check.json", { force: true });

// The compiled files import through "@/…", which node cannot resolve.
for (const file of fs.readdirSync(`${OUT}/lib`)) {
  const at = `${OUT}/lib/${file}`;
  let s = fs.readFileSync(at, "utf8");
  s = s
    .replace(/from "@\/lib\/prisma"/g, 'from "./_prisma.js"')
    .replace(/from "@\/auth"/g, 'from "./_auth.js"')
    .replace(/from "@\/lib\/([a-z-]+)"/g, 'from "./$1.js"');
  fs.writeFileSync(at, s);
}

// Two stubs: a real client, and a session that is never consulted because
// every call below passes its own user.
fs.writeFileSync(
  `${OUT}/lib/_prisma.js`,
  `import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
export const isDatabaseConfigured = () => true;
`,
);
fs.writeFileSync(`${OUT}/lib/_auth.js`, `export const safeAuth = async () => null;\n`);

const { getToday } = await import(`../${OUT}/lib/today.js`);
const { jocNav, roleLabel } = await import(`../${OUT}/lib/nav.js`);

/** The six the brief names, as capability sets rather than role names. */
const PEOPLE = [
  { who: "Super admin", user: { email: "yonah@justonechesed.org", role: "SUPER_ADMIN" } },
  {
    who: "Educational team",
    user: { email: "ed@justonechesed.org", role: "ADMIN",
      capabilities: ["lessons", "resources", "programs", "board", "rooms", "shop", "site", "forms", "cycles"] },
  },
  {
    who: "Programming team",
    user: { email: "dalia@justonechesed.org", role: "PROGRAM_STAFF",
      capabilities: ["programming", "cycles", "coordinators", "schools", "demos", "orders", "pricing",
        "set_program_light", "run_admin_agenda"] },
  },
  { who: "Program coordinator", user: { email: "lead@justonechesed.org", role: "STAFF", capabilities: [] } },
  { who: "JOC staff", user: { email: "staff@justonechesed.org", role: "STAFF", capabilities: [] } },
  { who: "Nobody signed in", user: null },
];

for (const { who, user } of PEOPLE) {
  const today = await getToday(user);
  const nav = jocNav(user, {
    programs: who === "Program coordinator"
      ? [{ name: "Kindness Booth", slug: "kindness-booth", heroColor: "#2D46AF", need: 2 }]
      : [],
  });

  console.log(`\n${"─".repeat(64)}\n${who}`);
  console.log(`  rail (${nav.length}): ${nav.map((i) => i.label).join(" · ")}`);
  console.log(`  rows (${today.rows.length}):`);
  for (const r of today.rows) console.log(`    ${r.band.padEnd(26)} ${r.says.slice(0, 74)}`);
  if (today.figures.length) {
    console.log(`  figures: ${today.figures.map((f) => `${f.label} ${f.value}`).join(" · ")}`);
  }
  if (user) console.log(`  role reads as: ${roleLabel(user, { leadsPrograms: who === "Program coordinator" ? 1 : 0 })}`);
}

console.log(`\n${"─".repeat(64)}`);
fs.rmSync(OUT, { recursive: true, force: true });
process.exit(0);
