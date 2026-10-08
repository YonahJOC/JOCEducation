import { C } from "@/lib/joc-tokens";

/**
 * Something that is missing, said in words.
 *
 * A dash reads as "loading", or as "nothing to see", or as "zero" — three
 * different things, and the reader picks whichever one suits them. The rule
 * across this portal is that absence is written out and coloured, so nobody
 * has to guess which kind of nothing they are looking at.
 *
 * Use the words that fit: "Not recorded", "Never called", "Nobody named".
 * Never "N/A", which is only a shorter dash.
 *
 * ── Why there are two tones ────────────────────────────────────────────────
 *
 * Orange marks a gap worth doing something about. On the schools table, Plan
 * and Seats are empty for 43 of 50 rows, so two whole columns went orange and
 * the colour stopped meaning anything — worse, it trained people to ignore it
 * on the rows where it mattered.
 *
 * So: `flag` (the default) is a gap that contradicts another field or blocks
 * the next step — a school with seats but no plan. `quiet` is a gap that is
 * simply the normal state here, where the column header carries the count
 * instead ("Plan · 3 of 10"). Same words either way; only the volume changes.
 */
export function Absent({
  children, tone = "flag",
}: {
  children: React.ReactNode;
  tone?: "flag" | "quiet";
}) {
  return tone === "flag" ? (
    <span style={{ color: C.orangeText, fontWeight: 600 }}>{children}</span>
  ) : (
    <span style={{ color: C.faint, fontWeight: 400 }}>{children}</span>
  );
}

/** The same thing where only a string will do — a title, a CSV cell, a log line. */
export const absent = (what: string) => what;
