import Link from "next/link";
import { C, R, F, label, datum, rowCard } from "@/lib/joc-tokens";

/**
 * One console, as a card on /admin/my-programs.
 *
 * Written once rather than twice. The Chesed Cycles card and the eight
 * program cards were the same markup copied, which is how two things that
 * should look identical quietly stop being identical.
 *
 * ── Why it looked unfinished ──────────────────────────────────────────────
 *
 * Every part the brief asked for was there. What was wrong was the space
 * between them. The grid stretches each card to the tallest in its row, and
 * the coordinator line was pushed to the bottom with margin-top:auto — so any
 * card with less to say got a hole through its middle. Nine cards, eight of
 * them holed, reads as a page somebody abandoned halfway.
 *
 * Three changes, and none of them touches the anatomy the brief set out:
 *
 *   **The hole becomes a footer.** Whoever runs it sits on the panel tint
 *   behind a hairline. Leftover height now belongs to a part of the card
 *   rather than appearing as a gap, so the card has a top, a middle and a
 *   bottom instead of three things and a void.
 *
 *   **The need gets weight.** Eight of nine cards said "Nothing needs anyone"
 *   in the same green at the same size, so the one card that did need
 *   somebody was no louder than the eight that did not — on a page whose
 *   whole job is to say which one to open. A card with work on it now carries
 *   a tinted block; the quiet ones stay a plain line.
 *
 *   **The tag becomes a pill.** It was bare mono text floating at the top
 *   right, reading as something left over rather than a label.
 */

export type ProgramCardProps = {
  href: string;
  name: string;
  /** "EVENT", "PLATFORM", "year-round". */
  tag: string;
  /** The strip. Ink is swapped for blue by the caller — it reads as an error. */
  stripColor: string;
  /** How many things need somebody. */
  need: number;
  /**
   * False when the need cannot be computed at all — a program with no sign-up
   * form cannot be asked how many sign-ups are waiting, so its nought is a
   * partial answer rather than a clear one, and saying "nothing needs anyone"
   * would be a claim we cannot make.
   */
  needKnown?: boolean;
  /** What to say instead when the need is unknown. */
  unknownLabel?: string;
  /** The mono line: "1 IN · 1 BOOKED · NEXT WED, OCT 7". */
  status: string;
  statusWarn?: boolean;
  /** The footer: who runs it. */
  footer: string;
  /** A draft program says so beside its tag. */
  draft?: boolean;
};

export function ProgramCard({
  href, name, tag, stripColor, need, needKnown = true, unknownLabel,
  status, statusWarn, footer, draft,
}: ProgramCardProps) {
  return (
    <Link
      href={href}
      className="joc-card"
      style={{ ...rowCard, display: "flex", flexDirection: "column", textDecoration: "none", overflow: "hidden" }}
    >
      <span aria-hidden="true" style={{ display: "block", height: "6px", backgroundColor: stripColor }} />

      <span style={{ padding: "18px 22px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <span style={{
            fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.025em",
            color: C.ink, lineHeight: 1.15, minWidth: 0,
          }}>
            {name}
          </span>
          <span style={{
            ...label, color: C.muted, whiteSpace: "nowrap", flexShrink: 0,
            backgroundColor: C.panel, borderRadius: "999px", padding: "5px 10px",
          }}>
            {tag}
            {draft && " · draft"}
          </span>
        </span>

        {/* The point of the page: which of these needs opening. */}
        {need > 0 ? (
          <span style={{
            display: "flex", alignItems: "baseline", gap: "9px", flexWrap: "wrap",
            backgroundColor: C.orangeTint, borderRadius: R.form, padding: "10px 14px",
          }}>
            <span style={{
              fontFamily: F.ui, fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em",
              lineHeight: 1, color: C.orangeText,
            }}>
              {need}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink }}>
              need you
            </span>
          </span>
        ) : needKnown ? (
          <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.greenText }}>
            Nothing needs anyone
          </span>
        ) : (
          <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.orangeText }}>
            {unknownLabel ?? "Not recorded yet"}
          </span>
        )}

        <span style={{ ...datum, color: statusWarn ? C.orangeText : C.muted }}>{status}</span>
      </span>

      <span style={{
        marginTop: "auto", display: "block",
        borderTop: `1px solid ${C.hairline}`, backgroundColor: C.panel,
        padding: "12px 22px", fontFamily: F.ui, fontSize: "14px", color: C.muted,
      }}>
        {footer}
      </span>
    </Link>
  );
}
