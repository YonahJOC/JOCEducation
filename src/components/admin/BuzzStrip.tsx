import Link from "next/link";
import { safeAuth } from "@/auth";
import { canReadBuzz } from "@/lib/buzz-access";
import { buzzRows, buzzViewer, standing, unreadFor } from "@/lib/buzz-feed";
import { AdminToggle } from "@/components/buzz/AdminToggle";
import { BuzzCard } from "@/components/buzz/BuzzCard";
import { BuzzFilter } from "@/components/buzz/BuzzFilter";
import { C } from "@/lib/joc-tokens";

/**
 * The Buzz, on somebody's desk.
 *
 * The same cards as the feed itself — comment, thumbs up, pick it up, and
 * for a super admin edit and tag. Anything less is a picture of the Buzz
 * rather than the Buzz, and somebody reading a comment here would have to
 * open another page to answer it.
 *
 * Three at a time, then "show more", opening in place. It used to be a 460px
 * box that scrolled inside itself: a page where each panel has its own
 * scrollbar is a page where nothing can be read straight through.
 */

const SHOW = 3;

export async function BuzzStrip() {
  const session = await safeAuth();
  if (!(await canReadBuzz(session?.user))) return null;

  const [rows, viewer] = await Promise.all([buzzRows(60), buzzViewer()]);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const week = rows.filter((r) => r.createdAt >= weekAgo).length;
  const unread = rows.filter((r) => unreadFor(r, viewer) > 0).length;

  const items = [...rows]
    .sort((a, b) => (standing(b) - standing(a)) || (b.createdAt.getTime() - a.createdAt.getTime()))
    .slice(0, 12);

  return (
    <section>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px 14px",
        flexWrap: "wrap", marginBottom: "12px",
      }}>
        <h2 style={{ font: "600 19px/1.2 var(--font-outfit)", letterSpacing: "-.01em", color: C.ink, margin: 0 }}>
          School Buzz
        </h2>
        <span style={{
          font: "500 11px/1 var(--font-mono)", letterSpacing: ".08em",
          color: C.faint, textTransform: "uppercase",
        }}>
          {week} this week{unread > 0 ? ` · ${unread} unread` : ""}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>
          {viewer.superAdmin && <AdminToggle />}
          <Link href="/buzz" style={{
            font: "600 14px/1 var(--font-outfit)", color: C.blue, textDecoration: "none",
          }}>
            Open the Buzz →
          </Link>
        </div>
      </div>

      <BuzzFilter
        cap={SHOW}
        startAll={viewer.superAdmin || viewer.mySchools.size === 0}
        items={items.map((r) => ({
          id: r.id,
          schoolId: r.school.id,
          mine: viewer.mySchools.has(r.school.id),
          node: <BuzzCard row={r} viewer={viewer} now={now} />,
        }))}
      />
    </section>
  );
}
