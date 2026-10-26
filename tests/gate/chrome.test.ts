import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ownChrome } from "@/lib/chrome";

/**
 * A page that draws its own shell must not also get the site's.
 *
 * This broke the day the ambassador pages moved onto PortalShell: two
 * wordmarks stacked on top of each other, and the public footer — Pricing,
 * Shop, Donate — under a student's approval queue. Nothing failed; it just
 * looked like that until somebody opened it.
 *
 * So the invariant is checked rather than remembered: find every route
 * tree whose layout draws the portal shell, and insist it is on the list.
 */

const APP = path.resolve(__dirname, "../../src/app");

/** Top-level route trees whose layout.tsx draws PortalShell. */
function shellRoutes(): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(APP, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const layout = path.join(APP, entry.name, "layout.tsx");
    if (!fs.existsSync(layout)) continue;
    if (/PortalShell/.test(fs.readFileSync(layout, "utf8"))) out.push(`/${entry.name}`);
  }
  return out;
}

describe("the site's header and footer", () => {
  it("finds the route trees that draw their own shell", () => {
    // If this ever hits zero the next test passes vacuously.
    expect(shellRoutes().length).toBeGreaterThan(0);
  });

  it.each(shellRoutes())("%s brings its own, so the site's must stay away", (route) => {
    expect(ownChrome(route), `${route} draws PortalShell but is not in OWN_CHROME_PREFIXES`).toBe(true);
    expect(ownChrome(`${route}/anything/deeper`)).toBe(true);
  });

  it("leaves the public pages alone", () => {
    for (const page of ["/about", "/pricing", "/programs", "/resources", "/lesson-plans"]) {
      expect(ownChrome(page), page).toBe(false);
    }
  });

  it("does not match a path that merely starts with the same letters", () => {
    // "/schools-we-love" is not the school panel.
    expect(ownChrome("/schools-we-love")).toBe(false);
    expect(ownChrome("/counterpoint")).toBe(false);
  });
});
