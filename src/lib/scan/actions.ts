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

export type ScanAction = "answer" | "pay" | "marathon" | "swag";

export type ActionSpec = {
  id: ScanAction;
  /** Two lines on the button, as the design sets it. */
  label: string;
  bg: string;
  fg: string;
};

export const ACTIONS: readonly ActionSpec[] = [
  { id: "answer", label: "Answer the Question\non the Screen", bg: "#FF8A00", fg: "#1E2A8C" },
  { id: "pay", label: "Donation or Payment", bg: "#FFFFFF", fg: "#1E2A8C" },
  { id: "marathon", label: "Sign up for the Marathon", bg: "#2FA3E6", fg: "#0E1652" },
  { id: "swag", label: "Buy Swag", bg: "#FFD23F", fg: "#1E2A8C" },
];

/** The ones a visitor can actually use today. */
export const LIVE: readonly ScanAction[] = ["answer"];

export const isLive = (id: ScanAction) => LIVE.includes(id);

/** The screen name in the header, per the design. */
export const SCREEN_NAME: Record<ScanAction, string> = {
  answer: "The Question",
  pay: "Donation or Payment",
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
