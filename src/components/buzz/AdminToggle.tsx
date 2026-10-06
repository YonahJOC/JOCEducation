"use client";

import { useEffect, useState } from "react";
import { C, F } from "@/lib/joc-tokens";

/**
 * One quiet switch in the masthead, for the person who can edit, tag and
 * remove. Off, the feed reads as a feed; on, the controls appear on every
 * row at once rather than being hunted for one item at a time.
 *
 * It flips an attribute on <html> and globals.css does the hiding, so a feed
 * of forty items costs one toggle rather than forty pieces of state.
 *
 * Cosmetic only. Every action behind it is refused server-side for anybody
 * who is not a super admin, whatever this is showing.
 */

const KEY = "joc-admin-tools";

export function AdminToggle() {
  const [on, setOn] = useState(false);

  // Read the remembered choice after mounting: the server has no idea what
  // this browser last chose, and guessing would make the markup disagree.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private window */ }
    const next = saved === "on";
    setOn(next);
    document.documentElement.dataset.adminTools = next ? "on" : "off";
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const flip = () => {
    const next = !on;
    setOn(next);
    document.documentElement.dataset.adminTools = next ? "on" : "off";
    try { localStorage.setItem(KEY, next ? "on" : "off"); } catch { /* private window */ }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={flip}
      title={on ? "Hide edit, tag and remove" : "Show edit, tag and remove"}
      style={{
        display: "inline-flex", alignItems: "center", gap: "7px",
        fontFamily: F.data, fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: on ? C.orange : "rgba(255,255,255,.45)",
        background: "none", border: "none", cursor: "pointer",
        padding: "6px 0", minHeight: "32px",
      }}
    >
      <span style={{
        width: "26px", height: "15px", borderRadius: "999px", flex: "0 0 auto",
        backgroundColor: on ? C.orange : "rgba(255,255,255,.22)",
        position: "relative", transition: "background-color .15s",
      }}>
        <span style={{
          position: "absolute", top: "2px", left: on ? "13px" : "2px",
          width: "11px", height: "11px", borderRadius: "50%",
          backgroundColor: C.white, transition: "left .15s",
        }} />
      </span>
      Tools
    </button>
  );
}
