"use client";

import { useEffect, useState } from "react";

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
  title, what, steps, note, children, as: Heading = "h1",
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
  /**
   * "h2" where this introduces a section rather than the page — a page that
   * already has its own h1, such as one school's record. A second h1 on a
   * page tells a screen reader there are two documents here.
   */
  as?: "h1" | "h2";
}) {
  const key = `joc-intro-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  // Closed on the first render, always — the server cannot know what is in
  // this browser's storage, and reading it while hydrating made the server
  // render "How do I change this?" while the browser rendered "Hide the
  // steps". That is a hydration mismatch on every page of the console, and it
  // threw away and rebuilt the whole tree each time.
  //
  // So the answer arrives a moment later instead, in an effect, which is the
  // only honest place for a question only the browser can answer.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Open the first time somebody sees this page, closed after that.
      if (window.localStorage.getItem(key) !== "seen") setOpen(true);
    } catch {
      // A private window, or storage blocked. Staying closed is fine.
    }
  }, [key]);

  function toggle() {
    setOpen((v) => {
      try { window.localStorage.setItem(key, "seen"); } catch { /* private window */ }
      return !v;
    });
  }

  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <Heading style={{ fontWeight: 800, fontSize: Heading === "h1" ? "26px" : "19px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
          {title}
        </Heading>
        {children}
      </div>

      <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: "0 0 10px", maxWidth: "74ch" }}>
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
                <p style={{ fontSize: "13.5px", color: "#C96C00", backgroundColor: "rgba(250,145,45,.12)", borderRadius: "10px", padding: "11px 14px", margin: "14px 0 0", lineHeight: 1.55 }}>
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
