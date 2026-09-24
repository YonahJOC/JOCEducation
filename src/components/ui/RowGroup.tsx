import { C, R, F, TONE, label, bandFigure, rowCard, type Tone } from "@/lib/joc-tokens";

/**
 * A category of rows you can open or shut.
 *
 * The console had two lists on two tabs and a row of filter chips on each, so
 * a coordinator could see the schools running their program or the schools
 * that are not in it, never both, and picking a filter hid everything else.
 * The categories are all on the page now, each with its count, and opening
 * one does not close another.
 *
 * It is a <details>, so it works with no JavaScript, the browser handles the
 * keyboard, and find-in-page can open a shut group by itself.
 */

export function RowGroup({
  tone, title, count, line, open, children,
}: {
  tone: Tone;
  /** "Running", "Reach out". The category, in the words used everywhere else. */
  title: string;
  /** How many rows are inside. Shown whether or not the group is open. */
  count: number;
  /** One line on what the category means, and what an empty one means. */
  line: string;
  /** Groups about this program start open; the rest start shut. */
  open?: boolean;
  children?: React.ReactNode;
}) {
  const t = TONE[tone];

  return (
    <details className="joc-group" open={open && count > 0} style={{ ...rowCard, marginBottom: "10px" }}>
      <summary
        style={{
          display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
          padding: "14px 18px", minHeight: "44px",
        }}
      >
        <span
          style={{
            display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px",
            backgroundColor: t.bg, color: t.fg, borderRadius: R.form,
            padding: "8px 14px", minWidth: "104px",
          }}
        >
          <span style={{ ...label, color: t.fg }}>{title}</span>
          <span style={{ ...bandFigure, fontSize: "22px", color: t.fg }}>{count}</span>
        </span>

        <span style={{ flex: 1, minWidth: "180px", fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.45 }}>
          {line}
        </span>

        {count > 0 && (
          <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue, textDecoration: "underline" }}>
            <span className="joc-group-shut">Show {count}</span>
            <span className="joc-group-open">Hide</span>
          </span>
        )}
      </summary>

      {count > 0 && (
        <div style={{ display: "grid", gap: "10px", padding: "0 14px 14px" }}>{children}</div>
      )}
    </details>
  );
}
