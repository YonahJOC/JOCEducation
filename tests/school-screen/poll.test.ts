import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { TV_POLL_MINUTES } from "@/lib/school-screen/slideshow";

/**
 * The portal must not tell a teacher something is up before it is.
 *
 * When a yes puts a flyer in a corridor, the portal says how long until
 * the televisions have it. That number is the screens' own poll interval,
 * which lives in the screen bundle — a file the portal must not import,
 * because it is built on its own and runs on a different machine.
 *
 * So it is written down twice, and this fails the day the two disagree.
 */

const MAIN = path.resolve(__dirname, "../../src/school-screen/main.ts");

describe("how long until a television has the change", () => {
  it("matches the screens' own poll interval", () => {
    const src = fs.readFileSync(MAIN, "utf8");
    const line = src.match(/const POLL_MS = ([^;]+);/);
    expect(line, "POLL_MS has moved or been renamed in src/school-screen/main.ts").toBeTruthy();

    // "5 * 60_000" and friends, without running the screen's module.
    const ms = Number(line![1].replace(/_/g, "").split("*").reduce((a, b) => a * Number(b), 1));
    expect(Number.isFinite(ms) && ms > 0, `could not read POLL_MS from "${line![1]}"`).toBe(true);
    expect(TV_POLL_MINUTES).toBe(ms / 60_000);
  });
});
