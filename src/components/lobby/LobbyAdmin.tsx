"use client";

import { App } from "./App";
import "./admin.css";
import "./fit.css";

/**
 * The panel, and the stylesheet it came with.
 *
 * Its thousand lines of CSS are all `a-` prefixed and imported here and
 * nowhere else, so they reach this page and no other. Rewriting it in the
 * console's own inline tokens would have meant redrawing a finished, tested
 * interface by hand — which is exactly where this integration would have
 * gone wrong. fit.css settles it into the console; admin.css is untouched.
 *
 * The icon font is the panel's own and is not loaded anywhere else on the
 * site. React hoists this link into the head, and it only ships on this page.
 */
export function LobbyAdmin() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24..48,600,1,0&display=block"
      />
      <div className="joc-bleed joc-lobby-admin">
        <App />
      </div>
    </>
  );
}
