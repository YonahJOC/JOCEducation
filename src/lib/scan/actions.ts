/**
 * What the page behind the QR code offers, and which of it is finished.
 *
 * The design has four doors on the home screen. Three of them are not built:
 * donations and swag are money, and the marathon form still has open
 * questions in the handoff itself — whether it needs a distance, a shirt
 * size or a fee. A door that opens onto nothing is worse on a wall in a
 * lobby than a door that is not there, so until one is finished it is not
 * shown at all.
 *
 * Turning one on is adding its id to LIVE. Nothing else gates them, so the
 * day donations are built the button appears with them.
 */

export type ScanAction = "answer" | "donate" | "experience" | "marathon" | "swag";

export type ActionSpec = {
  id: ScanAction;
  /** Two lines on the button, as the design sets it. */
  label: string;
  bg: string;
  fg: string;
  /**
   * Where it goes, when that is somewhere JOC already runs.
   *
   * The design has these flows living on the phone and ending at a payment
   * provider. JOC takes money through its donor platform and registers
   * marathon runners through qgiv, both of which already exist, already
   * work and already reconcile with whatever the office uses. Rebuilding
   * either here would mean a second place for money to go wrong.
   */
  href?: string;
  /** Drawn as an outline rather than a fill: present, but quieter. */
  outline?: boolean;
};

export const ACTIONS: readonly ActionSpec[] = [
  { id: "answer", label: "Answer the Question\non the Screen", bg: "#FF8A00", fg: "#1E2A8C" },
  {
    id: "donate",
    label: "Make a Donation",
    bg: "#FFFFFF",
    fg: "#1E2A8C",
    href: "https://justonechesed.org/donations",
  },
  {
    id: "marathon",
    label: "Sign up for the Marathon",
    bg: "#2FA3E6",
    fg: "#0E1652",
    href: "https://www.chesedcampaigns.org/initiatives/jerusalem-marathon-2027",
  },
  {
    id: "swag",
    label: "Buy Swag",
    bg: "#FFD23F",
    fg: "#1E2A8C",
    // The Kind Store, which is where JOC's swag is actually sold.
    href: "https://thekindstore.org/",
  },
  /**
   * Last, and outlined rather than filled.
   *
   * This is the page somebody is sent a link to when they owe for an
   * experience they have already booked — not something a visitor browses
   * to. Giving it the quiet treatment the design already uses on "Back to
   * Start" keeps the four it does specify looking as they were drawn, and
   * puts the common things first.
   */
  {
    id: "experience",
    label: "Pay for an Experience",
    bg: "transparent",
    fg: "#FFFFFF",
    outline: true,
    href: "https://jocdonors.donorsupport.co/page/FUNMRKTTXLQ?fundraiser=experiences&member=SRHUSHHF",
  },
];

/**
 * All four, as the design has them.
 *
 * The question is answered here, on the phone, because the answer belongs
 * to the screen a few feet away. The other three leave for places JOC
 * already runs — the donor platform, qgiv, the Kind Store — because a
 * second checkout is a second place for money to go wrong.
 */
export const LIVE: readonly ScanAction[] = ["answer", "donate", "marathon", "swag", "experience"];

export const isLive = (id: ScanAction) => LIVE.includes(id);

/** Which ones hand the visitor over to something JOC already runs. */
export const isExternal = (a: ActionSpec) => Boolean(a.href);

/** The screen name in the header, per the design. */
export const SCREEN_NAME: Record<ScanAction, string> = {
  answer: "The Question",
  donate: "Donation",
  experience: "Experience",
  marathon: "Marathon",
  swag: "Swag",
};

/**
 * The design's palette, which is close to the wall's but not the same —
 * navy #1E2A8C against the screen's #222898, orange #FF8A00 against
 * #ff8e00. Kept exactly as handed over, because the handoff asks for that;
 * worth settling one way or the other, since a visitor sees the phone and
 * the wall at the same moment.
 */
export const C = {
  navy: "#1E2A8C",
  deepNavy: "#0E1652",
  orange: "#FF8A00",
  sky: "#2FA3E6",
  yellow: "#FFD23F",
  white: "#FFFFFF",
  muted: "#4A4F6A",
  lightFill: "#EEF0F7",
  veil: "rgba(255,255,255,.14)",
} as const;

/**
 * What a visitor may type into the answer box.
 *
 * The handoff says 140. The form this replaces allowed 220 and the wall
 * sets anything over 95 characters a size smaller to fit it, so 220 is a
 * length the screen is already built to show. Cutting it to 140 would take
 * room away from people for no reason other than a number in a spec, so the
 * design gives way to the thing that already worked.
 */
export const ANSWER_MAX = 220;
