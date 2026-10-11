/**
 * What a school's hallway TV is given, and nothing more.
 *
 * This is the whole of /api/school-screen/[slug]. Every field is something a
 * person standing in that school's hallway could read off the wall: no money,
 * nothing waiting for approval, and nothing about another school beyond its
 * name and its hours. If a field is not in this type, the API cannot leak it.
 *
 * Shared by the server (which builds it), the TV script (which draws it) and
 * the editors (which preview flyers with the TV's own markup).
 */

export type FlyerTemplate = "EVENT" | "PROGRAM" | "BANNER";

export type ScreenFlyer = {
  id: string;
  template: FlyerTemplate;
  title: string;
  /** EVENT: the kicker above the title. PROGRAM: the one line under it. */
  line: string | null;
  /** ISO. EVENT flyers draw their date sticker from it. */
  startsAt: string | null;
  time: string | null;
  place: string | null;
  ambassadors: string | null;
  icon: string | null;
  imageUrl: string | null;
  /** The QR as inline SVG, drawn on the server. Never a third-party image. */
  qrSvg: string | null;
  qrLabel: string | null;
};

export type ScreenPhoto = { id: string; imageUrl: string; caption: string | null };

export type ScreenShoutOut = { id: string; text: string; from: string };

export type ScreenGrade = { label: string; hours: number };

export type ScreenData = {
  /** Bumped whenever anything here changes; the TV's ETag. */
  version: string;
  school: { name: string; short: string; logoUrl: string | null };
  /** Absent when the app did not answer. Never shown as 0. */
  stats: { acts: number | null; hours: number | null };
  worldHours: number | null;
  networkSchools: number;
  /** Every other school with a screen. Hours for the year, until the app sends months. */
  network: { name: string; hours: number }[];
  /** Null hides the card: the app does not yet report hours by grade. */
  grades: { goal: number; rows: ScreenGrade[] } | null;
  theme: { en: string; he: string | null; topic: string | null } | null;
  dedication: { hebrewName: string; text: string | null } | null;
  photos: ScreenPhoto[];
  flyers: ScreenFlyer[];
  shoutOuts: ScreenShoutOut[];
  /** The shout-out QR, inline SVG. */
  shoutOutQrSvg: string | null;
};
