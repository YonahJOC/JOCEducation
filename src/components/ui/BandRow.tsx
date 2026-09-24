import Link from "next/link";
import {
  C, TONE, rowCard, rowInner, rowBand, rowBody, rowAction, rowTitle,
  label, bandFigure, F, primaryButton, textButton, fullWidth, type Tone,
} from "@/lib/joc-tokens";

/**
 * A row: a band, a name, a line, and one thing to do about it.
 *
 * Five screens were each building this by hand, and they had drifted — the
 * band had lost its figure and become a coloured slab with an 11px label in
 * it, every action had stretched into a full-width outlined slab, and nothing
 * on a row was the obvious next step.
 *
 * The anatomy, once:
 *
 *   band    a label above one big figure. The figure is the point — "3",
 *           "14 days", "28.5 h" — and it is what somebody reads first.
 *   body    a title in the interface face, then one line of prose. One.
 *           Anything longer belongs on the page the action opens.
 *   action  one filled button, sized to its text, and at most one text link
 *           under it.
 */

export type BandRowProps = {
  tone: Tone;
  /** Above the figure: "NOT PAID", "STUCK". */
  label: string;
  /** The figure itself: "3", "14 days". Omitted where there is no number. */
  figure?: string;
  /**
   * The figure is a word rather than a number — a stage, a status.
   *
   * "Being set up" at thirty pixels wraps to three lines and stops being a
   * figure. Words get twenty-two and the same weight.
   */
  word?: boolean;
  /** A graphic to the left of the label and figure — the traffic light's own. */
  bandLead?: React.ReactNode;
  /** The thing this row is about: a school, a program, a count of features. */
  title: React.ReactNode;
  /** One line. Around ninety characters; the rest goes where the action leads. */
  line?: string;
  action?: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Where the action is a button rather than a link: the whole column. */
  actionNode?: React.ReactNode;
  /** Facts about the row, after the line. */
  chips?: React.ReactNode;
  /** Replaces the action once somebody has dealt with it. */
  done?: string;
  children?: React.ReactNode;
};

export function BandRow({
  tone, label: bandText, figure, word, bandLead, title, line, action, secondary,
  actionNode, chips, done, children,
}: BandRowProps) {
  const t = TONE[tone];

  return (
    <div style={rowCard}>
      <div style={rowInner}>
        <div style={{
          ...rowBand, backgroundColor: t.bg, color: t.fg,
          ...(bandLead ? { flexDirection: "row", alignItems: "center", gap: "12px" } : null),
        }}>
          {bandLead}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          <span style={{ ...label, color: t.fg }}>{bandText}</span>
          {figure && (
            <span style={{ ...bandFigure, color: t.fg, fontSize: word ? "22px" : bandFigure.fontSize }}>
              {figure}
            </span>
          )}
          </div>
        </div>

        <div style={rowBody}>
          <div style={rowTitle}>{title}</div>
          {line && (
            <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.45, margin: 0 }}>
              {line}
            </p>
          )}
          {chips && <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>{chips}</div>}
        </div>

        {(action || done || actionNode) && (
          <div style={rowAction}>
            {actionNode ? actionNode : done ? (
              <span style={{ fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.greenText, textAlign: "center", lineHeight: 1.45 }}>
                {done}
              </span>
            ) : (
              <>
                <Link href={action!.href} style={{ ...primaryButton, ...fullWidth, textDecoration: "none" }}>
                  {action!.label}
                </Link>
                {secondary && (
                  <Link
                    href={secondary.href}
                    style={{
                      ...textButton, ...fullWidth, minHeight: "36px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {secondary.label}
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
