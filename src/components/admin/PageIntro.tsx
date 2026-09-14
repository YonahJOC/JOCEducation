"use client";

import { useState } from "react";

const INK = "#10233F";
const BLUE = "#2D46AF";

/**
 * The header every console page wears: what this page is, and — folded away
 * until wanted — exactly how to change something on it.
 *
 * The steps are written for someone who has not used the console before and
 * is not going to guess. They are collapsed by default so they stop being
 * furniture once you know the page, and remembered per page in this browser.
 */
export function PageIntro({
  title, what, steps, note, children,
}: {
  title: string;
  /** One or two sentences: what this page is for. */
  what: string;
  /** Numbered, in order, each one an action. */
  steps?: string[];
  /** Anything worth knowing before touching it. */
  note?: string;
  /** Buttons that belong beside the title. */
  children?: React.ReactNode;
}) {
  const key = `joc-intro-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      // Open the first time someone sees this page, closed after that.
      return window.localStorage.getItem(key) !== "seen";
    } catch {
      return false;
    }
  });

  function toggle() {
    setOpen((v) => {
      try { window.localStorage.setItem(key, "seen"); } catch { /* private window */ }
      return !v;
    });
  }

  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
          {title}
        </h1>
        {children}
      </div>

      <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, margin: "0 0 10px", maxWidth: "74ch" }}>
        {what}
      </p>

      {steps && steps.length > 0 && (
        <>
          <button
            onClick={toggle}
            aria-expanded={open}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600,
              color: BLUE, background: "none", border: "none", padding: "6px 0",
              cursor: "pointer", minHeight: "38px",
            }}
          >
            {open ? "Hide the steps" : "How do I change this?"}
          </button>

          {open && (
            <div
              style={{
                backgroundColor: "#F4F7FD", borderRadius: "14px",
                padding: "18px 22px", marginTop: "4px", maxWidth: "74ch",
              }}
            >
              <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "9px" }}>
                {steps.map((s, i) => (
                  <li key={i} style={{ fontSize: "14.5px", color: INK, lineHeight: 1.6 }}>{s}</li>
                ))}
              </ol>
              {note && (
                <p style={{ fontSize: "13.5px", color: "#9A5405", backgroundColor: "rgba(250,145,45,.12)", borderRadius: "10px", padding: "11px 14px", margin: "14px 0 0", lineHeight: 1.55 }}>
                  {note}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
