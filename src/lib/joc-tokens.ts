/**
 * The console's design tokens, written down once.
 *
 * They were literals scattered through every component, which is how a panel
 * ends up with black outlined buttons and orange chips for everything while
 * the design says blue fills and four different badge colours. A token used
 * from here is a token somebody can change in one place.
 */

export const C = {
  blue: "#2D46AF",
  blueHover: "#223892",
  blueTint: "#E4E9F8",
  /** A fill only. Orange text on paper is `orangeText`. */
  orange: "#FA912D",
  orangeText: "#C96C00",
  orangeTint: "#FFF0E0",
  ink: "#10233F",
  muted: "#4A5A74",
  paper: "#FBF9F4",
  panel: "#F4F7FD",
  hairline: "#E3E6EF",
  white: "#FFFFFF",

  green: "#2FA457",
  greenTint: "#E3F4E8",
  greenText: "#1D6B37",
  red: "#D8412F",
  redTint: "#FBE6E3",
  redText: "#A3261A",
} as const;

export const R = {
  hero: "20px",
  row: "16px",
  form: "12px",
  button: "12px",
  chip: "9999px",
} as const;

/** Rows sit on the paper background, not on a white sheet. */
export const ROW_SHADOW = "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)";

/** The console runs edge to edge; its content does not. */
export const CONTENT_MAX = "1080px";

const font = "var(--font-outfit)";

/** A filled blue button. Everything primary looks like this and nothing else does. */
export const primaryButton: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
  fontFamily: font, fontSize: "15px", fontWeight: 700,
  color: C.white, backgroundColor: C.blue, border: `2px solid ${C.blue}`,
  borderRadius: R.button, padding: "12px 20px", minHeight: "47px",
  textDecoration: "none", cursor: "pointer", width: "100%", boxSizing: "border-box",
};

/** Blue border, blue text, white fill. Never a black outline. */
export const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  color: C.blue, backgroundColor: C.white, border: `2px solid ${C.blue}`,
};

export const chip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  fontFamily: font, fontSize: "12px", fontWeight: 700,
  borderRadius: R.chip, padding: "4px 9px", whiteSpace: "nowrap",
};

export const bandLabel: React.CSSProperties = {
  fontFamily: font, fontSize: "12px", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em",
};

export const bandFigure: React.CSSProperties = {
  fontFamily: font, fontSize: "30px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1,
};
