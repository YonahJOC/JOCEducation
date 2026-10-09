import { C, F, R, T, HIT, ROW_SHADOW } from "@/lib/joc-tokens";

/**
 * The furniture every quarter of the desk is built from, to the v5 handoff.
 *
 * A quarter is a white card whose header stays put while its body scrolls on
 * its own. That is the whole trick of the page: four of them in a grid the
 * height of the window, so nothing on somebody's desk is below the fold and
 * the page itself never scrolls.
 *
 * The measurements here are the handoff's, not approximations of it: 18px
 * gutters, a #F0F2F7 hairline between rows rather than the heavier #E3E6EF
 * used elsewhere in the console, and the count in mono at the far right of
 * the header rather than beside the title.
 */

/**
 * The desk's five greys used to be declared right here — SUB, QUIET, FAINT,
 * SOFT and RULE — which meant the desk could drift away from the tokens even
 * while joc-tokens.ts was perfectly correct. It did: two of them failed
 * contrast and one was a second name for a colour the tokens already had.
 *
 * They now live in `C`, and so does every colour on this page.
 */
export const CARD_SHADOW = ROW_SHADOW;

export function Panel({
  title, count, tools, children, flush, rail, note, icon, iconTint, tabs,
}: {
  title: string;
  /** The mono line beside the title — "3 TODAY · 7 OPEN". */
  count?: string;
  /** An action at the far right of the header, such as "+ Add". */
  tools?: React.ReactNode;
  children: React.ReactNode;
  /** The notebook lays itself out; everything else gets a scrolling body. */
  flush?: boolean;
  /** The notebook's page tabs: a scrolling row beside the title, not an
   *  action pinned to the right. */
  rail?: boolean;
  /** A card that isn't white — the scratchpad's paper. */
  note?: React.CSSProperties;
  /** A Material Symbols name for the tile beside the title. Decoration. */
  icon?: string;
  /** [icon colour, tile colour] for that tile. */
  iconTint?: [string, string];
  /** A row of its own under the header — the notebook's pages. */
  tabs?: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: C.white,
        borderRadius: R.hero,
        boxShadow: CARD_SHADOW,
        ...note,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* No rule under the header: the card is one surface, and a line
          across it made every panel look like a table with a caption. */}
      <header
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: rail ? "6px" : "12px",
          padding: rail ? "20px 20px 0" : "26px 26px 0",
          overflowX: rail ? "auto" : undefined,
        }}
      >
        {icon ? (
          <span
            aria-hidden="true"
            className="material-symbols-rounded"
            style={{
              flex: "0 0 40px", width: "40px", height: "40px", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: iconTint?.[1] ?? C.blueTint,
              color: iconTint?.[0] ?? C.blue,
              fontSize: "22px",
              fontVariationSettings: '"FILL" 1, "wght" 600, "GRAD" 0, "opsz" 24',
            }}
          >
            {icon}
          </span>
        ) : null}

        <h2 style={{
          ...T.section, color: C.ink, margin: 0,
          padding: rail ? "0 8px 0 6px" : 0, flex: "0 0 auto",
        }}>
          {title}
        </h2>

        {/* The count sits at the far end, ahead of any action. */}
        {count ? (
          <span style={{ ...T.meta, flex: "0 0 auto", marginLeft: "auto" }}>{count}</span>
        ) : null}
        {tools}
      </header>

      {/* min-height:0 is what lets this scroll instead of stretching the grid. */}
      {tabs ? (
        <div style={{
          flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px",
          padding: "14px 20px 0", overflowX: "auto",
        }}>
          {tabs}
        </div>
      ) : null}

      {flush ? children : (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "18px 26px 22px" }}>
          {children}
        </div>
      )}
    </section>
  );
}

/** A heading inside a panel body — TODAY, LATER, HANDED OFF. */
export function GroupHead({ text, count }: { text: string; count?: number }) {
  return (
    <div style={{ ...T.meta, textTransform: "uppercase", padding: "12px 0 6px" }}>
      {count === undefined ? text : `${text} · ${count}`}
    </div>
  );
}

/**
 * An empty quarter.
 *
 * One quiet sentence in the reading face, where a bolder "nothing here"
 * headline in all four corners made a new person's desk look broken rather
 * than new. Tasks keeps a headline because it is the one a person is meant
 * to act on.
 */
export function Empty({ head, line }: { head?: string; line: string }) {
  return (
    <div style={{ padding: head ? "12px 18px 18px" : "14px 18px" }}>
      {head ? (
        <div style={{ font: `600 15px/1.3 ${F.ui}`, color: C.ink }}>{head}</div>
      ) : null}
      <div style={{
        font: `400 15px/1.5 ${F.read}`, color: C.muted,
        marginTop: head ? "4px" : 0, textWrap: "pretty",
      }}>
        {line}
      </div>
    </div>
  );
}

/** The circle in front of a handed-off task, or a person in the tray. */
export function Initial({ letter, size = 20 }: { letter: string; size?: number }) {
  return (
    <span
      style={{
        flex: `0 0 ${size}px`, height: `${size}px`, borderRadius: "50%",
        background: C.blueTint, color: C.blue,
        font: `600 ${size > 24 ? 12.5 : 10}px/1 ${F.ui}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: size > 24 ? 0 : "1px",
      }}
    >
      {letter}
    </span>
  );
}

/** A row in a quarter: 18px gutters, hairline above. */
/**
 * A row in a quarter: 18px gutters, a hairline above.
 *
 * `stretch` rather than `flex-start` so the controls at the end of the row
 * fill its height. That is what makes Today, Nudge, Decline and × tappable:
 * they look like small words and they hit like a 44px target.
 */
export const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr) auto",
  alignItems: "center",
  minHeight: "64px",
  borderTop: `1px solid ${C.rule}`,
  // No side padding: the panel's own 26px is the gutter, so a row's hairline
  // runs the full width of the card rather than stopping short of it.
};

/** The part of a row that holds the text, which sets the row's height. */
export const rowBody: React.CSSProperties = {
  minWidth: 0, display: "flex", flexDirection: "column",
  justifyContent: "center", padding: "10px 0",
};

/**
 * The small blue verb at the end of a row — Today, Nudge, Reply.
 *
 * It was 12.5px with 3px of vertical padding, which is a control 19px tall;
 * on a phone Today, Nudge and × sat within 30px of each other. It reads the
 * same — blue words — and now taps at the full height of its row.
 */
export const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  background: "transparent", border: 0, color: C.blue,
  ...T.small, cursor: "pointer",
  padding: "0 8px", minHeight: HIT, minWidth: HIT, justifyContent: "center",
};

export const quietBtn: React.CSSProperties = {
  ...linkBtn,
  // A control, not meta: `muted` rather than `faint`.
  color: C.muted, fontWeight: 500,
};

export const fillBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  ...T.small,
  background: C.blue, color: C.white, border: 0, borderRadius: R.sm,
  padding: "0 12px", minHeight: HIT, cursor: "pointer",
};

/** The mono line under a row. */
export function Meta({ text, tone }: { text: string; tone?: string }) {
  return (
    <div style={{
      font: `500 10px/1.3 ${F.data}`, letterSpacing: ".05em",
      color: tone ?? C.faint, marginTop: "3px",
    }}>
      {text}
    </div>
  );
}

/**
 * The Office's buttons, which are a size up from the desk's: its rows are
 * read rather than worked through, so its controls can afford the room.
 */
export const btn = {
  base: {
    font: `600 13px/1 ${F.ui}`, borderRadius: "10px", padding: "8px 12px",
    cursor: "pointer", border: "1px solid transparent",
  } as React.CSSProperties,
  primary: { background: C.blue, color: C.white } as React.CSSProperties,
  quiet: { background: C.white, color: C.muted, border: `1px solid ${C.outline}` } as React.CSSProperties,
  bare: {
    background: "transparent", color: C.faint, border: "none",
    padding: "4px 6px", font: `500 12.5px/1 ${F.ui}`,
  } as React.CSSProperties,
};

/**
 * The × that takes a row away.
 *
 * It looks like a small grey glyph and it taps like a 44px square, which is
 * the whole point: on a phone it used to sit 2px from "Nudge". Muted rather
 * than a decoration grey, because removing something is a control, not
 * furniture.
 */
export const removeBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: 0, color: C.muted,
  font: `400 18px/1 ${F.ui}`, cursor: "pointer",
  minWidth: HIT, minHeight: HIT, padding: 0, flex: "0 0 auto",
};
