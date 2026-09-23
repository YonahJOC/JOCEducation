import Link from "next/link";
import { C, R, label, F } from "@/lib/joc-tokens";

/**
 * The band at the top of every program console, and its tabs.
 *
 * One page for all eight programs. The band is the program's own colour, so a
 * coordinator who runs two of them knows which console they are looking at
 * before reading a word — and a foreground worked out from that colour rather
 * than assumed, because two of the eight are light enough to need ink on them.
 *
 * The tabs are addresses, not state. A coordinator can send somebody a link to
 * the sign-ups, and the console opens on the sign-ups.
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
  name, slug, tag, lead, heroColor, fg, counts, tabs, active, asCoordinator,
}: {
  name: string;
  slug: string;
  tag: string;
  lead: string | null;
  heroColor: string;
  fg: string;
  /** The Plex Mono line under the name: "8 IN · 23 NOT YET · 2 NEED YOU". */
  counts: string;
  tabs: TabKey[];
  active: TabKey;
  asCoordinator: boolean;
}) {
  return (
    <div style={{ margin: "-18px -16px 20px" }}>
      <div style={{ backgroundColor: heroColor, color: fg, padding: "26px 26px 0" }}>
        <p style={{ ...label, color: fg, opacity: 0.85, margin: "0 0 8px" }}>
          Program console · {tag} ·{" "}
          {lead ? `Run by ${lead}` : <span style={{ opacity: 1 }}>Nobody is down as running it</span>}
        </p>

        <h1 style={{
          fontFamily: F.ui, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700,
          letterSpacing: "-0.035em", lineHeight: 1.04, margin: "0 0 10px",
        }}>
          {name}
        </h1>

        <p style={{ ...label, color: fg, opacity: 0.8, margin: "0 0 18px" }}>{counts}</p>

        {/* Tabs. Addresses rather than state, so a link opens the right one. */}
        <nav aria-label="Console sections" style={{ display: "flex", gap: "2px", flexWrap: "wrap", overflowX: "auto" }}>
          {tabs.map((t) => {
            const on = t === active;
            return (
              <Link
                key={t}
                href={`/admin/programs/${slug}?tab=${t}${asCoordinator ? "&as=coordinator" : ""}`}
                style={{
                  ...label,
                  display: "flex", alignItems: "center", whiteSpace: "nowrap",
                  minHeight: "44px", padding: "0 16px",
                  borderRadius: `${R.form} ${R.form} 0 0`,
                  backgroundColor: on ? C.paper : "transparent",
                  color: on ? C.ink : fg,
                  opacity: on ? 1 : 0.8,
                  textDecoration: "none",
                }}
              >
                {TAB_LABEL[t]}
              </Link>
            );
          })}
        </nav>
      </div>

      {asCoordinator && (
        <div style={{ backgroundColor: C.ink, padding: "12px 26px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.read, fontSize: "16px", color: C.white, lineHeight: 1.5, flex: 1, minWidth: "min(100%, 300px)" }}>
            You are seeing this the way whoever runs this program sees it — no editing the form, no
            coordinators panel, no app figures.
          </span>
          <Link
            href={`/admin/programs/${slug}`}
            style={{
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white,
              border: `2px solid ${C.white}`, borderRadius: R.button,
              padding: "10px 18px", minHeight: "44px", textDecoration: "none",
              display: "inline-flex", alignItems: "center", whiteSpace: "nowrap",
            }}
          >
            Back to your own view
          </Link>
        </div>
      )}
    </div>
  );
}
