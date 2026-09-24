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

  /** Label and body on a blue or ink fill — the two tints 2b and 3g use. */
  onDarkLabel: "#FFD8AE",
  onDarkBody: "#C6CFF0",

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

/**
 * Three fonts, one job each. Declared in src/app/layout.tsx.
 *
 *   ui     names, headings, buttons, the interface
 *   read   anything a person reads as prose — a program's description, the
 *          reason on a row, what a student wrote about their event
 *   data   labels, dates, counts, codes, step numbers
 *
 * The distinction is the whole of the type system. A count set in the reading
 * face looks like an opinion; a sentence set in the data face looks like a
 * log line.
 */
export const F = {
  ui: "var(--font-outfit)",
  read: "var(--font-newsreader)",
  data: "var(--font-mono)",
} as const;

const font = F.ui;

/**
 * The one uppercase label.
 *
 * It replaces six near-identical variants that had accumulated — 10.5/.2em,
 * 11/.14em, 11.5/.22em, 12/.1em, 12/.08em and 13/.12em — none of which
 * differed for any reason anybody could name.
 */
export const label: React.CSSProperties = {
  fontFamily: F.data,
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: ".04em",
  textTransform: "uppercase",
};

/** Prose. Set it in the reading face, and give it room. */
export const prose: React.CSSProperties = {
  fontFamily: F.read,
  fontSize: "17px",
  lineHeight: 1.6,
  color: C.ink,
};

/**
 * A figure, a date, a code — anything read as data rather than as language.
 *
 * Twelve, tracked, and never upper-cased by the token: a status line is
 * already written in the case it should be read in. It was set through the
 * label token, which shouted a whole sentence in 11px capitals.
 */
export const datum: React.CSSProperties = {
  fontFamily: F.data,
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: ".04em",
  color: C.muted,
};

/** A filled blue button. Everything primary looks like this and nothing else does. */
export const primaryButton: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
  fontFamily: font, fontSize: "15px", fontWeight: 700,
  color: C.white, backgroundColor: C.blue, border: `2px solid ${C.blue}`,
  borderRadius: R.button, padding: "11px 18px", minHeight: "46px",
  textDecoration: "none", cursor: "pointer", boxSizing: "border-box",
  whiteSpace: "nowrap",
};

/**
 * A button that fills its container.
 *
 * Width used to be baked into the button itself, so every action on every row
 * stretched into a full-width outlined slab and no row had a visible next
 * step. Full width is a decision the caller makes — a form, a phone card —
 * rather than something a button is.
 */
export const fullWidth: React.CSSProperties = { width: "100%" };

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

/**
 * The old band label, now the one label.
 *
 * Kept as a name because it reads well where it is used — the label above a
 * band's figure — but it is the same object, so there is one uppercase style
 * on the whole site rather than six.
 */
export const bandLabel: React.CSSProperties = label;

export const bandFigure: React.CSSProperties = {
  fontFamily: font, fontSize: "30px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1,
};

// ─── The shapes the console is made of ───────────────────────────────────────
//
// Every one of these was copied into five or six components, which is how a
// panel ends up two pixels off every other panel and nobody can say why. They
// live here so a redesign is one file rather than a search.
//
// These are the *decisions*, not the structure. A component still decides what
// goes in a row; this decides what a row looks like.

/**
 * A card or a list row. White, on the paper, carrying the shadow.
 *
 * Named rowCard rather than row because every component that draws one also
 * has a variable called row holding the data for it.
 */
export const rowCard: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, overflow: "hidden",
};

/** The three parts of a row, which wrap on their own content at narrow widths. */
export const rowInner: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", alignItems: "stretch",
};

/** The coloured left-hand block: a label and one big figure. */
export const rowBand: React.CSSProperties = {
  flex: "0 0 188px", boxSizing: "border-box", minWidth: 0, padding: "14px 18px",
  display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px",
};

/** The name, the sentence, the chips. Grows far faster than the other two. */
export const rowBody: React.CSSProperties = {
  flex: "100 1 220px", minWidth: 0, padding: "14px 18px",
  display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px",
};

/**
 * The button and whatever sits under it.
 *
 * A column of its own that grows, with the button filling it — not a button
 * shrink-wrapped to its text and pushed to the right, which is what this was
 * and which left every row ending in a ragged edge.
 */
export const rowAction: React.CSSProperties = {
  flex: "1 1 170px", minWidth: 0, padding: "14px 18px",
  display: "flex", flexDirection: "column", justifyContent: "center",
  alignItems: "stretch", gap: "2px",
};

/** What opens underneath a row. */
export const rowDetail: React.CSSProperties = {
  borderTop: `1px solid ${C.hairline}`, backgroundColor: C.paper, padding: "18px",
};

/** The name at the top of a row. The body's gap does the spacing. */
export const rowTitle: React.CSSProperties = {
  fontFamily: font, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em",
  color: C.ink, margin: 0,
};

/** A section's heading, and the paragraph under it that says what it is for. */
export const sectionHeading: React.CSSProperties = {
  fontFamily: font, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em",
  color: C.ink, margin: "24px 0 2px",
};

export const sectionIntro: React.CSSProperties = {
  fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 14px", maxWidth: "64ch",
};

/** A page's own title. */
export const pageTitle: React.CSSProperties = {
  fontFamily: font, fontSize: "30px", fontWeight: 600, letterSpacing: "-0.03em",
  color: C.ink, margin: "0 0 6px",
};

/** A text input, a select, a textarea. */
export const field: React.CSSProperties = {
  fontFamily: font, fontSize: "15px", color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "11px 13px",
  minHeight: "44px", width: "100%", boxSizing: "border-box",
};

/** The small uppercase label above one. */
export const fieldLabel: React.CSSProperties = {
  ...bandLabel, fontSize: "11px", color: C.muted, display: "block", marginBottom: "5px",
};

/** Under a field: what it is for, or what happens if you leave it. */
export const fieldHint: React.CSSProperties = {
  display: "block", fontSize: "13px", color: C.muted, marginTop: "5px", lineHeight: 1.5,
};

/**
 * A blue underlined link that is really a button.
 *
 * The secondary action everywhere. It is a link rather than a second button
 * because two buttons of equal weight beside each other is two decisions, and
 * there is only ever one.
 */
export const textButton: React.CSSProperties = {
  fontFamily: font, fontSize: "14px", fontWeight: 700, color: C.blue,
  background: "none", border: "none", textDecoration: "underline",
  cursor: "pointer", minHeight: "44px", padding: 0,
};

/** Cancel, dismiss, never mind. Quieter than textButton, and not blue. */
export const quietButton: React.CSSProperties = {
  fontFamily: font, fontSize: "15px", color: C.muted,
  background: "none", border: "none", cursor: "pointer", minHeight: "44px",
};

/** A filter chip. Ink-filled when it is the one selected. */
export function filterChip(on: boolean, tint?: { bg: string; fg: string }): React.CSSProperties {
  return {
    ...chip,
    fontSize: "14px", padding: "10px 15px", minHeight: "44px", cursor: "pointer", border: "none",
    backgroundColor: on ? C.ink : tint ? tint.bg : C.panel,
    color: on ? C.white : tint ? tint.fg : C.ink,
  };
}

/**
 * How loud a row is.
 *
 * Everything used to be `warn`, and `warn` was solid orange, so a page of
 * rows read as a wall of orange and nothing stood out. Solid orange is now
 * `urgent` and belongs to at most one row on a screen — the top-weighted one.
 * Everything else sits on a tint.
 */
export type Tone = "urgent" | "warn" | "info" | "good" | "system" | "quiet";

export const TONE: Record<Tone, { bg: string; fg: string }> = {
  urgent: { bg: C.orange, fg: C.ink },
  warn: { bg: C.orangeTint, fg: C.orangeText },
  info: { bg: C.blueTint, fg: C.blue },
  good: { bg: C.greenTint, fg: C.greenText },
  system: { bg: C.redTint, fg: C.redText },
  // Nothing is happening here, and that is not a problem to fix.
  quiet: { bg: C.panel, fg: C.muted },
};

/** The ordinary chip: a fact about a row, on the panel fill. */
export const plainChip: React.CSSProperties = { ...chip, backgroundColor: C.panel, color: C.ink };

/**
 * Something the reader needs to know before they act.
 *
 * Orange is "this is not right yet"; panel is "here is how this works". There
 * is no red one, because nothing on these screens is an error the reader
 * caused.
 */
export function note(tone: "warn" | "info"): React.CSSProperties {
  return {
    backgroundColor: tone === "warn" ? C.orangeTint : C.panel,
    borderRadius: R.form, padding: "13px 16px", margin: "0 0 14px",
  };
}

export function noteText(tone: "warn" | "info"): React.CSSProperties {
  return {
    fontSize: "15px", color: tone === "warn" ? C.orangeText : C.muted,
    margin: 0, lineHeight: 1.55, maxWidth: "70ch",
  };
}
