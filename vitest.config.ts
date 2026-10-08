import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * The lobby screen's unit tests.
 *
 * They came with the handoff and cover the parts with real logic in them:
 * Jerusalem-time arithmetic, title and location parsing, the screen's view
 * model, and the rules the save endpoint enforces. Pure functions and route
 * handlers — nothing here needs a browser or a database.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
