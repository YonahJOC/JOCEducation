import Link from "next/link";
import { C, R, CONTENT_MAX, label, datum, F } from "@/lib/joc-tokens";

/**
 * The band at the top of a console, and its tabs.
 *
 * One page for all eight programs. The band wears the program's own colour, so
 * a coordinator who runs two of them knows which console they are on before
 * reading a word — with a foreground chosen against that colour, because two
 * of the eight are light enough to need ink.
 *
 * It runs the full width of the main area rather than sitting inside the 1080
 * column, where it read as a floating rectangle.
 *
 * `ConsoleHeader` is the same band for a console that is not one of the eight
 * — the Chesed Cycles, which every school is on and which no ProgramPage row
 * describes. Splitting it was cheaper than giving the Cycles a fake program
 * record so it could borrow this.
 */

export type TabKey = "today" | "schools" | "calendar" | "sign-ups" | "money" | "setup";

export const TAB_LABEL: Record<TabKey, string> = {
  today: "Today",
  schools: "Schools",
  calendar: "Calendar",
  "sign-ups": "Sign-ups",
  money: "Money",
  setup: "Setup",
};

export function ProgramConsoleHeader({
  name, slug, tag, lead, heroColor, fg, counts, tabs, active, tabCounts,
}: {
  name: string;
  slug: string;
  tag: string;
  lead: string | null;
  heroColor: string;
  fg: string;
  /** The line under the name: "8 in · 23 not yet · next Sun 27 Sep". */
  counts: string;
  tabs: TabKey[];
  active: TabKey;
  /** Shown after a tab's name, where there is something to count. */
  tabCounts?: Partial<Record<TabKey, number>>;
}) {
  return (
    <ConsoleHeader
      eyebrow={`Program console · ${tag} · ${lead ? `Run by ${lead}` : "Nobody is down as running it"}`}
      name={name}
      counts={counts}
      heroColor={heroColor}
      fg={fg}
      basePath={`/admin/programs/${slug}`}
      tabs={tabs.map((t) => ({ key: t, label: TAB_LABEL[t], count: tabCounts?.[t] }))}
      active={active}
    />
  );
}

export type ConsoleTab = { key: string; label: string; count?: number };

export function ConsoleHeader({
  eyebrow, name, counts, heroColor, fg, basePath, tabs, active,
}: {
  /** The mono line above the name. */
  eyebrow: string;
  name: string;
  /** The line under the name: "8 in · 23 not yet · next Sun 27 Sep". */
  counts: string;
  heroColor: string;
  fg: string;
  /** Where a tab link points, before "?tab=". */
  basePath: string;
  tabs: ConsoleTab[];
  active: string;
}) {
  // A light hero needs ink for its eyebrow; a dark one takes the warm tint 2b
  // uses, which is the same orange the rest of the site flags things in.
  const dark = fg !== C.ink;

  return (
    <div style={{ position: "relative", overflow: "hidden", backgroundColor: heroColor, color: fg }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute", top: "-120px", right: "-70px",
          width: "240px", height: "240px", borderRadius: "50%",
          backgroundColor: C.orange, opacity: 0.22,
        }}
      />

      <div style={{ position: "relative", maxWidth: CONTENT_MAX, margin: "0 auto", padding: "28px 40px 0" }}>
        <p style={{ ...label, color: dark ? C.onDarkLabel : C.orangeText, margin: "0 0 10px" }}>
          {eyebrow}
        </p>

        <h1 style={{
          fontFamily: F.ui, fontSize: "clamp(28px, 3.4vw, 40px)", fontWeight: 700,
          letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 8px",
        }}>
          {name}
        </h1>

        <p style={{ ...datum, color: fg, opacity: 0.78, margin: 0 }}>{counts}</p>

        {/* Tabs are addresses, not state, so a link opens the right one. */}
        <nav aria-label="Console sections" style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "20px" }}>
          {tabs.map((t) => {
            const on = t.key === active;
            const n = t.count;
            return (
              <Link
                key={t.key}
                href={`${basePath}?tab=${t.key}`}
                style={{
                  display: "flex", alignItems: "center", whiteSpace: "nowrap",
                  fontFamily: F.ui, fontSize: "14px", fontWeight: on ? 700 : 600,
                  minHeight: "44px", padding: "12px 16px",
                  borderRadius: `${R.form} ${R.form} 0 0`,
                  backgroundColor: on ? C.paper : "transparent",
                  color: on ? C.ink : fg,
                  textDecoration: "none",
                }}
              >
                {t.label}
                {n != null && n > 0 && ` · ${n}`}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
