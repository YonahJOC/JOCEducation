import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  /**
   * The lobby screen's admin panel, ported whole from its own project.
   *
   * It loads its document in an effect and seeds three forms from props the
   * same way — patterns React's newer rule flags. Restructuring working,
   * unit-tested data loading to satisfy a lint rule is how a port that
   * arrived finished stops being finished, so the rule is off here and only
   * here. Everything else in the panel is linted normally.
   *
   * The screen itself (src/lobby-screen) is vanilla DOM code that esbuild
   * bundles separately; the React rules have nothing to say about it.
   */
  {
    files: ["src/components/lobby/**/*.{ts,tsx}"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
]);

export default eslintConfig;
