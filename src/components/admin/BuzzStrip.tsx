import Link from "next/link";
import { safeAuth } from "@/auth";
import { canReadBuzz } from "@/lib/buzz-access";
import { buzzRows, buzzViewer, standing } from "@/lib/buzz-feed";
import { BuzzCard } from "@/components/buzz/BuzzCard";
import { C, F } from "@/lib/joc-tokens";

/**
 * The Buzz, on somebody's console home.
 *
 * The same cards as the feed itself — comment, thumbs up, pick it up, and
 * for a super admin edit and tag — inside a window that scrolls. Anything
 * less and this is a picture of the Buzz rather than the Buzz, and somebody
 * reading a comment here has to open another page to answer it.
 *
 * A window rather than the whole feed because the console home is the
 * handful of things that need a person today; forty updates underneath them
 * would bury the point of the page.
 */

const SHOW = 12;

export async function BuzzStrip() {
  const session = await safeAuth();
  if (!(await canReadBuzz(session?.user))) return null;

  const [rows, viewer] = await Promise.all([buzzRows(60), buzzViewer()]);
  if (rows.length === 0) return null;

  const now = new Date();
  const items = [...rows]
    .sort((a, b) => (standing(b) - standing(a)) || (b.createdAt.getTime() - a.createdAt.getTime()))
    .slice(0, SHOW);

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

      <div style={{
        maxHeight: "460px", overflowY: "auto",
        backgroundColor: C.paper,
        borderRadius: "18px", border: `1px solid ${C.hairline}`,
        padding: "12px", display: "grid", gap: "10px",
      }}>
        {items.map((r) => (
          <BuzzCard key={r.id} row={r} viewer={viewer} now={now} />
        ))}
      </div>
    </section>
  );
}
