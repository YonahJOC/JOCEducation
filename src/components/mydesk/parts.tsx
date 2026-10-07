import { C, F } from "@/lib/joc-tokens";

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

export const SUB = "#3B4A66";
export const QUIET = "#5A6782";
export const FAINT = "#8A97B3";
/** The inside hairline. Lighter than the console's, because a card that is
 *  mostly rows turns into a table when every row is drawn in full. */
export const RULE = "#F0F2F7";
export const SOFT = "#B4BCCE";
export const CARD_SHADOW = "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)";

export function Panel({
  title, count, tools, children, flush,
}: {
  title: string;
  /** The mono line at the far right — "3 TODAY · 7 OPEN". */
  count?: string;
  /** Replaces the count: the notebook's page tabs live up here. */
  tools?: React.ReactNode;
  children: React.ReactNode;
  /** The notebook lays itself out; everything else gets a scrolling body. */
  flush?: boolean;
}) {
  return (
    <section
      style={{
        background: C.white,
        borderRadius: "18px",
        boxShadow: CARD_SHADOW,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: tools ? "center" : "baseline",
          justifyContent: tools ? "flex-start" : "space-between",
          gap: tools ? "6px" : "10px",
          padding: tools ? "11px 12px 10px" : "15px 18px 10px",
          borderBottom: `1px solid ${RULE}`,
          overflowX: tools ? "auto" : undefined,
        }}
      >
        <h2 style={{
          font: `600 17px/1 ${F.ui}`, color: C.ink, margin: 0,
          padding: tools ? "0 8px 0 6px" : 0, flex: "0 0 auto",
        }}>
          {title}
        </h2>
        {tools}
        {count ? (
          <span style={{ font: `500 10.5px/1 ${F.data}`, letterSpacing: ".08em", color: QUIET }}>
            {count}
          </span>
        ) : null}
      </header>

      {/* min-height:0 is what lets this scroll instead of stretching the grid. */}
      {flush ? children : (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
      )}
    </section>
  );
}

/** A heading inside a panel body — TODAY, LATER, HANDED OFF. */
export function GroupHead({ text, count }: { text: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", padding: "12px 18px 5px" }}>
      <span style={{
        font: `600 10.5px/1 ${F.data}`, letterSpacing: ".1em",
        color: QUIET, textTransform: "uppercase",
      }}>
        {text}
      </span>
      {count !== undefined ? (
        <span style={{ font: `500 10.5px/1 ${F.data}`, color: SOFT }}>{count}</span>
      ) : null}
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
        font: `400 15px/1.5 ${F.read}`, color: SUB,
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
export const row: React.CSSProperties = {
  display: "flex", gap: "11px", alignItems: "flex-start",
  padding: "8px 18px", borderTop: `1px solid ${RULE}`,
};

/** The small blue verb at the end of a row — Today, Nudge, Reply. */
export const linkBtn: React.CSSProperties = {
  background: "transparent", border: 0, color: C.blue,
  font: `600 12.5px/1 ${F.ui}`, cursor: "pointer", padding: "3px 0",
};

export const quietBtn: React.CSSProperties = {
  background: "transparent", border: 0, color: FAINT,
  font: `500 12.5px/1 ${F.ui}`, cursor: "pointer", padding: "3px 0",
};

export const fillBtn: React.CSSProperties = {
  background: C.blue, color: C.white, border: 0, borderRadius: "8px",
  padding: "7px 10px", font: `600 12.5px/1 ${F.ui}`, cursor: "pointer",
};

/** The mono line under a row. */
export function Meta({ text, tone }: { text: string; tone?: string }) {
  return (
    <div style={{
      font: `500 10px/1.3 ${F.data}`, letterSpacing: ".05em",
      color: tone ?? QUIET, marginTop: "3px",
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
  quiet: { background: C.white, color: SUB, border: `1px solid ${C.outline}` } as React.CSSProperties,
  bare: {
    background: "transparent", color: FAINT, border: "none",
    padding: "4px 6px", font: `500 12.5px/1 ${F.ui}`,
  } as React.CSSProperties,
};
