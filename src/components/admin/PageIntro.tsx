"use client";

import { useEffect, useRef, useState } from "react";
import {
  C, R, F, label, pageTitle, sectionHeading, textButton, primaryButton, noteText, note,
} from "@/lib/joc-tokens";

/**
 * The header every console page wears: what this page is, and a link to how
 * to change something on it.
 *
 * The steps used to open in place — a full-width blue slab that pushed the
 * page below the fold, and that opened by itself the first time anybody saw
 * the page. Instructions are a thing you go and read, not a thing the page
 * wears, so they open over the page now and leave it exactly where it was.
 *
 * A <dialog>, so Escape closes it, focus is trapped and returned, and the
 * page behind it is inert — none of which is worth hand-rolling.
 */
export function PageIntro({
  title, what, steps, note: warning, children, as: Heading = "h1",
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
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // showModal() is the only way to get the backdrop and the inert page, and
  // it cannot be set as a prop — the element has to be told.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <Heading style={Heading === "h1" ? { ...pageTitle, margin: "0 0 4px" } : { ...sectionHeading, margin: "0 0 4px" }}>
          {title}
        </Heading>
        {children}
      </div>

      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: 0, maxWidth: "70ch" }}>
        {what}
        {steps && steps.length > 0 && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => setOpen(true)}
              style={{ ...textButton, minHeight: 0, verticalAlign: "baseline" }}
            >
              How this page works
            </button>
          </>
        )}
      </p>

      {steps && steps.length > 0 && (
        <dialog ref={ref} className="joc-steps" onClose={() => setOpen(false)}>
          <div style={{ backgroundColor: C.white, borderRadius: R.row, padding: "22px 24px" }}>
            <p style={{ ...label, color: C.muted, margin: "0 0 4px" }}>How this page works</p>
            <p style={{ ...sectionHeading, margin: "0 0 14px" }}>{title}</p>

            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "12px" }}>
              {steps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                  <span style={{ ...label, color: C.blue, flexShrink: 0, minWidth: "16px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: F.read, fontSize: "15px", color: C.ink, lineHeight: 1.5 }}>{s}</span>
                </li>
              ))}
            </ol>

            {warning && (
              <p style={{ ...note("warn"), ...noteText("warn"), margin: "16px 0 0" }}>{warning}</p>
            )}

            {/* The dialog's own form: this closes it with no JavaScript of ours. */}
            <form method="dialog" style={{ marginTop: "20px" }}>
              <button type="submit" style={primaryButton}>Got it</button>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
