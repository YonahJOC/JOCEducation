import type { ScreenFlyer } from "./types";

/**
 * The flyer every screen falls back to when a school has nothing up yet.
 *
 * It is a real flyer on a real wall — a mic, a line, and a code to scan —
 * not an absence. The portal used to draw a dashed box saying "JOC's
 * Chesed Minute, until your first flyer goes up", under a heading that
 * said ON THE SCREEN NOW. The heading was true and the box was not: the
 * television was showing this, and the portal was showing a description
 * of it.
 *
 * So it lives here, without the QR, which only the server can draw. Both
 * sides build from the same object and cannot drift.
 */
export const CHESED_MINUTE: Omit<ScreenFlyer, "qrSvg"> = {
  id: "joc-chesed-minute",
  template: "PROGRAM",
  title: "The Chesed Minute",
  line: "1 video. 60 seconds.",
  startsAt: null,
  time: null,
  place: null,
  ambassadors: null,
  icon: "mic",
  imageUrl: null,
  qrLabel: "Scan to upload",
};
