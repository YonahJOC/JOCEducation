import Link from "next/link";
import { safeAuth } from "@/auth";
import { canReadBuzz } from "@/lib/buzz-access";
import { buzzRows, buzzViewer, standing } from "@/lib/buzz-feed";
import { BuzzCard } from "@/components/buzz/BuzzCard";
import { BuzzFilter } from "@/components/buzz/BuzzFilter";
import { C, F } from "@/lib/joc-tokens";

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
  const items = [...rows]
    .sort((a, b) => (standing(b) - standing(a)) || (b.createdAt.getTime() - a.createdAt.getTime()))
    .slice(0, 12);

  return (
    <section>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        gap: "12px", flexWrap: "wrap", marginBottom: "12px",
      }}>
        <h2 style={{
          fontFamily: F.ui, fontSize: "19px", fontWeight: 600, letterSpacing: "-0.01em",
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
