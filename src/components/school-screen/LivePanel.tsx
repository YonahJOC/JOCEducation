"use client";

import { useEffect, useState } from "react";
import { C, F, R, T } from "@/lib/joc-tokens";
import type { EditorFlyer } from "@/lib/school-screen/editor-data";
import { SLIDE_SECONDS } from "@/lib/school-screen/slideshow";
import { CHESED_MINUTE } from "@/lib/school-screen/chesed-minute";
import { FlyerPreview } from "./FlyerPreview";

/**
 * What is in the corridor at this moment, cycling as the television does.
 *
 * Dark navy, like the screen itself and like nothing else in the portal —
 * that is how somebody learns what ink means here without being told.
 *
 * It is the same panel on the teacher's Live Screen page and on a
 * student's home, because they are looking at the same wall. Only the line
 * underneath differs: a student is told how much of it is there because
 * they passed it on.
 */
export function LivePanel({ flyers, short, sticky, note }: {
  flyers: EditorFlyer[];
  short: string;
  sticky?: boolean;
  /** One line under the slide, for whoever is looking. */
  note?: string;
}) {
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (flyers.length < 2) return;
    const t = setInterval(() => setAt((i) => (i + 1) % flyers.length), SLIDE_SECONDS * 1000);
    return () => clearInterval(t);
  }, [flyers.length]);

  const i = flyers.length === 0 ? 0 : at % flyers.length;
  const f = flyers[i];

  // A school with nothing of its own up is not looking at a blank wall.
  // It is looking at the Chesed Minute, so that is what this shows.
  const shown = f
    ? { ...f, hasQr: Boolean(f.qrUrl) }
    : { ...CHESED_MINUTE, hasQr: true };

  return (
    <aside
      style={{
        flex: "0 0 322px", maxWidth: "322px", minWidth: "260px",
        background: C.ink, borderRadius: R.row, padding: "16px",
        position: sticky ? "sticky" : "static", top: "18px",
      }}
    >
      <p style={{ ...T.meta, color: C.onDarkLabel, margin: "0 0 12px" }}>ON THE SCREEN NOW</p>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <FlyerPreview width={288} short={short} flyer={shown} />
      </div>
      <p style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white, margin: "12px 0 2px" }}>
        {shown.title}
      </p>
      <p style={{ ...T.meta, color: C.onDarkBody, margin: 0 }}>
        {f ? `SLIDE ${i + 1} OF ${flyers.length}` : "JOC'S OWN, UNTIL YOUR FIRST FLYER GOES UP"}
      </p>

      {note ? (
        <p style={{ fontFamily: F.ui, fontSize: "14px", color: C.onDarkBody, margin: "12px 0 0", lineHeight: 1.5 }}>
          {note}
        </p>
      ) : null}
    </aside>
  );
}
