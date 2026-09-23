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
 */
export function Absent({ children }: { children: React.ReactNode }) {
  return <span style={{ color: C.orangeText, fontWeight: 600 }}>{children}</span>;
}

/** The same thing where only a string will do — a title, a CSV cell, a log line. */
export const absent = (what: string) => what;
