/**
 * Which tab a link asked for.
 *
 * These live here, and not beside the components that use them, because
 * the pages that call them are server components. A plain function
 * exported from a "use client" module is not a function on the server —
 * it is a reference to something in the browser bundle, and calling it
 * throws. The dev server forgave it; production did not, and
 * /school/screen went down.
 *
 * So anything both sides need is in a module that belongs to neither.
 */

export type UploadsTab = "waiting" | "aside" | "mine";

export type ScreenTab = "slideshow" | "photos" | "shouts" | "dedication" | "settings";

const SCREEN_TABS: ScreenTab[] = ["slideshow", "photos", "shouts", "dedication", "settings"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The ?tab= on Uploads & approvals, and nothing else. */
export function uploadsTabFromQuery(v: string | string[] | undefined): UploadsTab | undefined {
  const s = one(v);
  return s === "aside" || s === "mine" || s === "waiting" ? s : undefined;
}

/** The ?tab= on Live Screen, and nothing else. */
export function screenTabFromQuery(v: string | string[] | undefined): ScreenTab | undefined {
  const s = one(v);
  return SCREEN_TABS.includes(s as ScreenTab) ? (s as ScreenTab) : undefined;
}
