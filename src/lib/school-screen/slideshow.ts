import type { ScreenStatus } from "./rules";

/**
 * Where a flyer is in its life on the wall.
 *
 * The same question `flyerShowing` answers for the television, asked of the
 * strings the editor holds rather than of Date objects. The editor works in
 * day keys — "2026-10-26" in the screen's own timezone — because a teacher
 * picking dates in a form is thinking in days, not instants.
 *
 * Keeping it here rather than inside the component means the three filter
 * chips above the slideshow can be checked without a browser.
 */

export type SlideState = "showing" | "coming" | "down" | "waiting";

export type SlideFacts = {
  status: ScreenStatus;
  template: "EVENT" | "PROGRAM" | "BANNER";
  /** Day keys, as the editor holds them. */
  showFrom: string;
  showUntil: string;
  /** The day an event happens, if it is one. */
  startsOn: string | null;
};

export function slideState(f: SlideFacts, today: string): SlideState {
  // Anything nobody has signed off is not in the slideshow at all; it is on
  // the uploads page, waiting for somebody.
  if (f.status !== "APPROVED") return "waiting";
  if (today < f.showFrom) return "coming";
  if (today > f.showUntil) return "down";
  // An event comes down the day after it happens even if somebody left the
  // window open, because a flyer for last Thursday's bake sale tells
  // everyone walking past that nobody is looking after the screen.
  if (f.template === "EVENT" && f.startsOn && today > f.startsOn) return "down";
  return "showing";
}

/** What the chip over a row says. */
export const SLIDE_LABEL: Record<SlideState, string> = {
  showing: "On the screen",
  coming: "Coming up",
  down: "Came down",
  waiting: "Waiting",
};

/**
 * How long a slide holds the screen, and so how long a round takes.
 *
 * The television's own figure. It is here so the footnote under the
 * slideshow and the preview that cycles beside it cannot drift apart.
 */
export const SLIDE_SECONDS = 8;

/**
 * How long until a television has the change.
 *
 * The screens ask the server for their content on a timer; until the next
 * ask, a flyer approved this second is not in the corridor. Telling a
 * teacher "it's up" and meaning "it will be up shortly" is the kind of
 * small lie that teaches people not to believe the next thing.
 *
 * The real interval is POLL_MS in src/school-screen/main.ts, which this
 * must not reach into — that file is the television's and is built on its
 * own. tests/school-screen/poll.test.ts reads both and fails if they
 * disagree.
 */
export const TV_POLL_MINUTES = 5;
