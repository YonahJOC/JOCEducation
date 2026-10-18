import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The demo portal is default-closed, and this is what keeps it that way.
 *
 * A school on the demo sees two pages. Nothing stops somebody adding a ninth
 * page to the school panel next month and forgetting that it must not be one
 * of them — except this, which walks the directory and fails if a page is
 * neither sealed nor named as part of the demo.
 *
 * It reads source rather than calling anything, on purpose: the pages are
 * server components that would need a database, a session and a request to
 * run, and a test that needs all three is a test nobody runs.
 */

const ROOT = path.resolve(__dirname, "../../src/app/school");

/** Both halves of the demo, as the rail and the guards name them. */
const DEMO_PAGES = ["screen", "teachers"];

/** Every page.tsx under /school, as a route path. */
function pages(dir: string, base = ""): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pages(full, `${base}/${entry.name}`));
    else if (entry.name === "page.tsx") out.push({ route: base || "/", file: full });
  }
  return out;
}

const found = pages(ROOT);

describe("the demo portal seal", () => {
  it("finds the school panel's pages", () => {
    // If this ever hits zero the rest of the file passes vacuously.
    expect(found.length).toBeGreaterThanOrEqual(9);
  });

  it.each(found)("$route is either sealed or part of the demo", ({ route, file }) => {
    const src = fs.readFileSync(file, "utf8");

    const optsOut = src.includes('demo: "allow"');
    const guarded =
      src.includes("requireSchoolPanel(") || src.includes("requireAccountHolder(");
    const sealedDirectly = src.includes("sealDemo(");

    const isDemoPage = DEMO_PAGES.some((p) => route === `/${p}`);

    if (isDemoPage) {
      // The two demo pages must say so out loud, so the list is greppable.
      expect(optsOut, `${route} is part of the demo and must pass { demo: "allow" }`).toBe(true);
      return;
    }

    // Everything else must be shut, and must not have opted out.
    expect(optsOut, `${route} is not part of the demo but opts out of the seal`).toBe(false);
    expect(
      guarded || sealedDirectly,
      `${route} calls neither requireSchoolPanel/requireAccountHolder nor sealDemo, ` +
        `so a demo school can open it`,
    ).toBe(true);
  });

  it("the two demo pages exist", () => {
    for (const p of DEMO_PAGES) {
      expect(fs.existsSync(path.join(ROOT, p, "page.tsx")), `/school/${p} is missing`).toBe(true);
    }
  });

  it("the shared guards seal by default", () => {
    const src = fs.readFileSync(path.join(ROOT, "account-only.tsx"), "utf8");
    // Both guards, and the seal runs unless the caller opted out by name.
    const seals = src.match(/if \(opts\.demo !== "allow"\) await sealDemo\(\);/g) ?? [];
    expect(seals.length, "both guards must seal unless told otherwise").toBe(2);
  });

  it("the rail offers nothing but the two pages", async () => {
    const { schoolNav } = await import("@/lib/nav");
    const items = schoolNav(null, { demo: true, asSchoolAdmin: true, unreadMessages: 4 });
    expect(items.map((i) => i.href)).toEqual(["/school/screen", "/school/teachers"]);
  });

  it("a demo school is denied programs and the library", async () => {
    const { canOpenProgram, canOpenLibrary } = await import("@/lib/school-access");
    const access = {
      state: "DEMO" as const,
      // Even with a program recorded against them.
      programs: [{ id: 1, slug: "kindness-booth", name: "Kindness Booth", heroColor: "#000", stage: "RUNNING" as never }],
    };
    expect(canOpenProgram(access, "kindness-booth")).toBe(false);
    expect(canOpenLibrary(access)).toBe(false);
  });
});
