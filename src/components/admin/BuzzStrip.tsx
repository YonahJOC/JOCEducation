import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { canReadBuzz } from "@/lib/buzz-access";
import { UPDATE_TYPES, TAG, ago } from "@/lib/school-update";
import { C, F, label, datum } from "@/lib/joc-tokens";

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

      {/* Fixed height, scrolls inside. A page that grows by forty rows is a
          page where the seven things that need somebody are off the screen. */}
      <div style={{
        maxHeight: "330px", overflowY: "auto",
        backgroundColor: C.white, borderRadius: "16px",
        border: `1px solid ${C.hairline}`,
        boxShadow: "0 1px 0 #E3E6EF",
      }}>
        {rows.map((r, i) => (
          <Link
            key={r.id}
            href="/buzz"
            style={{
              display: "block", padding: "12px 16px", textDecoration: "none",
              borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", gap: "10px",
              alignItems: "baseline", flexWrap: "wrap",
            }}>
              <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.ink }}>
                {r.school.name}
              </span>
              <span style={{ ...label, color: C.muted }}>
                {ago(r.createdAt, now).toUpperCase()}
              </span>
            </div>

            <p style={{ ...datum, color: C.muted, margin: "2px 0 0" }}>
              {TAG[r.type] ?? "UPDATE"}
              {" · "}
              {first(r.author?.name ?? r.author?.email)}
              {r._count.notes > 0 && ` · ${r._count.notes} ${r._count.notes === 1 ? "COMMENT" : "COMMENTS"}`}
              {r.takenById && ` · WITH ${first(r.takenBy?.name ?? r.takenBy?.email).toUpperCase()}`}
            </p>

            {r.detail && (
              <p style={{
                fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted,
                margin: "4px 0 0", maxWidth: "70ch",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.detail.split("\n")[0]}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** First name only — this is a glance, not a directory. */
function first(who: string | null | undefined): string {
  if (!who) return "somebody";
  return who.includes("@") ? who.split("@")[0] : who.split(/\s+/)[0];
}
