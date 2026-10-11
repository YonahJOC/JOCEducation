"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flyerHTML } from "@/lib/school-screen/markup";
import type { ScreenFlyer } from "@/lib/school-screen/types";

/**
 * A flyer exactly as the TV will draw it: the screen's own markup and its own
 * stylesheet, at its real 745 × 752, scaled down to fit the form.
 *
 * It also measures itself. A name that runs past the edge of the panel is
 * the commonest way a flyer goes wrong, and only the real fonts at the real
 * size can say whether it does — so the preview reports anything cut off to
 * the form, which shows it as a warning.
 */

const W = 745;
const H = 752;

/** A stand-in for the QR, which the server draws when the flyer is saved. */
const QR_PLACEHOLDER =
  '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#E4E9F8"/><text x="5" y="6.2" font-size="2.6" text-anchor="middle" fill="#214ba5" font-family="Montserrat,sans-serif" font-weight="800">QR</text></svg>';

export function FlyerPreview({ flyer, short, width = 372, onOverflow }: {
  flyer: Omit<ScreenFlyer, "qrSvg"> & { hasQr: boolean };
  short: string;
  width?: number;
  onOverflow?: (problems: string[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const scale = width / W;

  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, []);

  const html = flyerHTML({ ...flyer, qrSvg: flyer.hasQr ? QR_PLACEHOLDER : null }, short);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box || !onOverflow) return;
    const panel = box.getBoundingClientRect();
    const problems: string[] = [];
    const check = (sel: string, what: string) => {
      box.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        const cut = el.scrollWidth > el.clientWidth + 1 || r.right > panel.right + 1 || r.left < panel.left - 1;
        if (cut && !problems.includes(what)) problems.push(what);
      });
    };
    check(".ss-ev-title, .ss-pg-big, .ss-pg-small, .ss-bn-big, .ss-bn-small", "The name doesn't fit on one line. Shorten it.");
    check(".ss-kicker", "The line above the name runs off the edge.");
    check(".ss-pill", "The time or place is too long for its pill.");
    check(".ss-amb-n", "The ambassadors' names are cut off.");
    onOverflow(problems);
  }, [html, fontsReady, onOverflow]);

  return (
    <>
      {/* React hoists these into <head> once, however many previews there are. */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap" precedence="default" />
      <link rel="stylesheet" href="/school-screen/screen.css" precedence="default" />
      <div style={{ width, height: H * scale, overflow: "hidden", borderRadius: 28 * scale, flex: "none" }}>
        <div
          ref={ref}
          className="ss-preview-panel"
          style={{ transform: `scale(${scale})` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  );
}
