import Link from "next/link";
import { C, R, CONTENT_MAX, label, F, secondaryButton } from "@/lib/joc-tokens";

/**
 * The band at the top of every program console, and its tabs.
 *
 * One page for all eight programs. The band wears the program's own colour, so
 * a coordinator who runs two of them knows which console they are on before
 * reading a word — with a foreground chosen against that colour, because two
 * of the eight are light enough to need ink.
 *
 * It runs the full width of the main area rather than sitting inside the 1080
 * column, where it read as a floating rectangle.
 */

export type TabKey = "today" | "schools" | "not-in-yet" | "calendar" | "sign-ups" | "setup";

export const TAB_LABEL: Record<TabKey, string> = {
  today: "Today",
  schools: "Schools in",
  "not-in-yet": "Not in yet",
  calendar: "Calendar",
  "sign-ups": "Sign-ups",
  setup: "Setup",
};

export function ProgramConsoleHeader({
  name, slug, tag, lead, heroColor, fg, counts, tabs, active, asCoordinator, tabCounts,
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
  asCoordinator: boolean;
  /** Shown after a tab's name, where there is something to count. */
  tabCounts?: Partial<Record<TabKey, number>>;
}) {
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
        <p style={{ ...label, color: fg, opacity: 0.9, margin: "0 0 10px" }}>
          Program console · {tag} · {lead ? `Run by ${lead}` : "Nobody is down as running it"}
        </p>

        <h1 style={{
          fontFamily: F.ui, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700,
          letterSpacing: "-0.035em", lineHeight: 1.04, margin: "0 0 8px",
        }}>
          {name}
        </h1>

        <p style={{ ...label, color: fg, opacity: 0.85, margin: "0 0 20px" }}>{counts}</p>

        {asCoordinator && (
          <div style={{
            display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
            backgroundColor: C.ink, borderRadius: R.form, padding: "10px 14px", margin: "0 0 16px",
          }}>
            <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.white, flex: 1 }}>
              Coordinator&rsquo;s view
            </span>
            <Link
              href={`/admin/programs/${slug}`}
              style={{ ...secondaryButton, backgroundColor: "transparent", color: C.white, border: `2px solid ${C.white}`, textDecoration: "none" }}
            >
              Back to your view
            </Link>
          </div>
        )}

        {/* Tabs are addresses, not state, so a link opens the right one. */}
        <nav aria-label="Console sections" style={{ display: "flex", gap: "2px", flexWrap: "wrap", overflowX: "auto" }}>
          {tabs.map((t) => {
            const on = t === active;
            const n = tabCounts?.[t];
            return (
              <Link
                key={t}
                href={`/admin/programs/${slug}?tab=${t}${asCoordinator ? "&as=coordinator" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "7px", whiteSpace: "nowrap",
                  fontFamily: F.ui, fontSize: "15px", fontWeight: 600,
                  minHeight: "44px", padding: "12px 16px",
                  borderRadius: `${R.form} ${R.form} 0 0`,
                  backgroundColor: on ? C.paper : "transparent",
                  color: on ? C.ink : fg,
                  borderBottom: `2px solid ${on ? C.paper : "transparent"}`,
                  textDecoration: "none",
                }}
              >
                {TAB_LABEL[t]}
                {n != null && n > 0 && (
                  <span style={{ ...label, fontSize: "12px", opacity: on ? 0.6 : 0.85 }}>{n}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
