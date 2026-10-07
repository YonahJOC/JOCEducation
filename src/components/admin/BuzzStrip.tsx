import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { canReadBuzz } from "@/lib/buzz-access";
import { UPDATE_TYPES, TAG, ago } from "@/lib/school-update";
import { BandRow } from "@/components/ui/BandRow";
import { C, F } from "@/lib/joc-tokens";

/**
 * The Buzz, on somebody's console home.
 *
 * A short scrolling window rather than the feed itself: the point of the
 * console home is the handful of things that need a person today, and forty
 * school updates underneath that would bury them. This says what is going on
 * and gets out of the way — every row and the heading open the real thing.
 *
 * Shown to whoever can read the Buzz and nobody else, and it renders nothing
 * at all rather than an empty box when there is nothing to show.
 */

const SHOW = 12;

export async function BuzzStrip() {
  const session = await safeAuth();
  const me = session?.user;

  if (!isDatabaseConfigured()) return null;
  if (!(await canReadBuzz(me))) return null;

  const rows = await prisma.schoolActivity.findMany({
    where: { type: { in: [...UPDATE_TYPES] }, removedAt: null },
    orderBy: [{ createdAt: "desc" }],
    take: SHOW,
    select: {
      id: true, type: true, detail: true, createdAt: true,
      author: { select: { name: true, email: true } },
      program: { select: { name: true } },
      school: { select: { id: true, name: true } },
      takenById: true,
      takenBy: { select: { name: true, email: true } },
      _count: { select: { notes: true } },
    },
  }).catch(() => []);

  if (rows.length === 0) return null;

  const now = new Date();

  return (
    <section style={{ marginTop: "30px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        gap: "12px", flexWrap: "wrap", marginBottom: "12px",
      }}>
        <h2 style={{
          fontFamily: F.ui, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em",
          color: C.ink, margin: 0,
        }}>
          The JOC School Buzz
        </h2>
        <Link href="/buzz" style={{
          fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
          textDecoration: "none",
        }}>
          Open the Buzz →
        </Link>
      </div>

      {/* The feed's own cards, on its own paper, in a window that scrolls.
          A page that grows by forty rows is a page where the things that
          need somebody today are off the screen. */}
      <div style={{
        maxHeight: "340px", overflowY: "auto",
        backgroundColor: C.paper,
        borderRadius: "18px", border: `1px solid ${C.hairline}`,
        padding: "12px", display: "grid", gap: "10px",
      }}>
        {rows.map((r) => (
          <BandRow
            key={r.id}
            tone={r.type === "EVENT_PLANNED" ? "good" : "info"}
            label={TAG[r.type] ?? "UPDATE"}
            figure={ago(r.createdAt, now)}
            word
            title={r.school.name}
            line={[
              // One line means one line. A row's own text wrapping to five
              // of them is what made these cards different heights.
              clip(r.detail?.split("\n")[0], 92),
              r._count.notes > 0
                ? `${r._count.notes} ${r._count.notes === 1 ? "comment" : "comments"}`
                : null,
              r.takenById ? `with ${first(r.takenBy?.name ?? r.takenBy?.email)}` : null,
            ].filter(Boolean).join(" · ")}
            action={{ label: "Open the Buzz", href: "/buzz" }}
          />
        ))}
      </div>
    </section>
  );
}

/** Cut at a word, not mid-syllable. */
function clip(text: string | null | undefined, n: number): string | null {
  if (!text) return null;
  const t = text.trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const space = cut.lastIndexOf(" ");
  return `${(space > n * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** First name only — this is a glance, not a directory. */
function first(who: string | null | undefined): string {
  if (!who) return "somebody";
  return who.includes("@") ? who.split("@")[0] : who.split(/\s+/)[0];
}
