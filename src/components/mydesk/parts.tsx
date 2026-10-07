import { C, R, F, ROW_SHADOW, label } from "@/lib/joc-tokens";

/**
 * The furniture every quarter of the desk is built from.
 *
 * A quarter is a white card whose header stays put while its body scrolls on
 * its own. That is the whole trick of the page: four of them in a grid the
 * height of the window, so nothing on somebody's desk is below the fold and
 * the page itself never scrolls.
 */

export const SUB = "#3B4A66";
export const QUIET = "#5A6782";

export function Panel({
  title, count, tools, children, pad = true,
}: {
  title: string;
  /** The mono line beside the title — "3 TODAY · 7 OPEN". */
  count?: string;
  tools?: React.ReactNode;
  children: React.ReactNode;
  pad?: boolean;
}) {
  return (
    <section
      style={{
        backgroundColor: C.white,
        borderRadius: "18px",
        boxShadow: ROW_SHADOW,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${C.hairline}`,
          flex: "0 0 auto",
        }}
      >
        <h2 style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 600, color: C.ink, margin: 0 }}>
          {title}
        </h2>
        {count ? <span style={{ ...label, color: C.faint }}>{count}</span> : null}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {tools}
        </div>
      </header>

      {/* min-height:0 is what lets this scroll instead of stretching the grid. */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: pad ? "12px 16px 16px" : 0 }}>
        {children}
      </div>
    </section>
  );
}

/** A heading inside a panel body — TODAY, LATER, HANDED OFF. */
export function GroupHead({ text, count }: { text: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "14px 0 8px" }}>
      <span style={{ ...label, color: C.faint, letterSpacing: ".09em" }}>{text}</span>
      {count !== undefined ? (
        <span style={{ ...label, color: C.outline }}>{count}</span>
      ) : null}
      <span style={{ flex: 1, height: "1px", backgroundColor: C.hairline }} />
    </div>
  );
}

export function Empty({ head, line }: { head: string; line: string }) {
  return (
    <div style={{ padding: "22px 4px" }}>
      <p style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink, margin: "0 0 6px" }}>
        {head}
      </p>
      <p style={{ fontFamily: F.read, fontSize: "15.5px", lineHeight: 1.55, color: QUIET, margin: 0 }}>
        {line}
      </p>
    </div>
  );
}

/** The circle in front of a task. */
export function Initial({ letter, tone = "blue" }: { letter: string; tone?: "blue" | "green" }) {
  return (
    <span
      style={{
        flex: "0 0 auto",
        width: "22px", height: "22px", borderRadius: "9999px",
        backgroundColor: tone === "green" ? C.greenTint : C.blueTint,
        color: tone === "green" ? C.greenText : C.blue,
        fontFamily: F.ui, fontSize: "11.5px", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: "1px",
      }}
    >
      {letter}
    </span>
  );
}

export const btn = {
  base: {
    fontFamily: F.ui, fontSize: "13px", fontWeight: 600,
    borderRadius: R.button, padding: "7px 12px", minHeight: "32px",
    cursor: "pointer", border: "1px solid transparent", lineHeight: 1,
  } as React.CSSProperties,
  primary: { backgroundColor: C.blue, color: C.white } as React.CSSProperties,
  quiet: { backgroundColor: C.white, color: SUB, border: `1px solid ${C.outline}` } as React.CSSProperties,
  bare: {
    backgroundColor: "transparent", color: C.faint, border: "none",
    padding: "4px 6px", minHeight: "26px", fontSize: "12.5px",
  } as React.CSSProperties,
};

/** The mono line under a row: FROM THE BUZZ · BERMAN · BY MONDAY. */
export function Meta({ text, tone }: { text: string; tone?: string }) {
  return (
    <p style={{ ...label, color: tone ?? C.faint, margin: "3px 0 0", letterSpacing: ".06em" }}>
      {text}
    </p>
  );
}
