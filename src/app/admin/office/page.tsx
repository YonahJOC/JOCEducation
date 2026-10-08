import Link from "next/link";
import { getToday } from "@/lib/today";
import { getDesk } from "@/lib/desk";
import { getOffice } from "@/lib/office";
import { BuzzStrip } from "@/components/admin/BuzzStrip";
import { TheBoard } from "@/components/desk/TheBoard";
import { Health } from "@/components/mydesk/Health";
import { Panel, Empty, Meta, btn } from "@/components/mydesk/parts";
import { C, F, label } from "@/lib/joc-tokens";

/**
 * The Office — everything that belongs to JOC rather than to one person.
 *
 * The Buzz, what the schools have been saying, what is coming up, the board.
 * It is deliberately one click away from the desk: shared news is worth
 * reading once a morning, not worth sitting between somebody and their list
 * all day.
 */

export const metadata = { title: "The Office — JOC Console" };
export const dynamic = "force-dynamic";

export default async function Office() {
  const [today, desk, office] = await Promise.all([getToday(), getDesk(), getOffice()]);

  return (
    <div className="joc-bleed" style={{ padding: "22px 24px 56px" }}>
      <header style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 700, color: C.ink, margin: 0, letterSpacing: "-.01em" }}>
            The Office
          </h1>
          <Link href="/admin" style={{ ...label, color: C.blue, textDecoration: "none", marginLeft: "auto" }}>
            ← Back to my desk
          </Link>
        </div>
        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.55, color: C.muted, margin: "6px 0 0" }}>
          {office.summary}
        </p>
      </header>

      <div className="joc-office-grid">
        <div style={{ minWidth: 0 }}>
          <BuzzStrip />
        </div>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <Panel title="Messages from schools" count={office.messages.length ? `${office.messages.length} OPEN` : ""}>
            {office.messages.length === 0 ? (
              <Empty head="Nothing waiting." line="A message sent through a school's own page lands here." />
            ) : null}
            {office.messages.map((m) => (
              <div key={m.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${C.hairline}` }}>
                <p style={{ fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.ink, margin: 0 }}>
                  {m.school}
                </p>
                <p
                  style={{
                    fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.ink, margin: "3px 0 0",
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}
                >
                  {m.body}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <Meta text={m.ago} />
                  <Link
                    href={m.href}
                    style={{ ...btn.base, ...btn.quiet, marginLeft: "auto", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                  >
                    Reply
                  </Link>
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Coming up at JOC" count={office.events.length ? `NEXT 2 WEEKS` : ""}>
            {office.events.length === 0 ? (
              <Empty head="Nothing booked." line="Events booked with a school show up here for everybody." />
            ) : null}
            {office.events.map((e) => (
              <div key={e.id} style={{ display: "flex", gap: "12px", padding: "9px 18px" }}>
                <span style={{ ...label, color: e.today ? C.blue : C.faint, flex: "0 0 74px", paddingTop: "2px" }}>
                  {e.day}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: e.today ? C.ink : C.muted, margin: 0 }}>
                    {e.title}
                  </p>
                  {e.meta ? <Meta text={e.meta} /> : null}
                </div>
              </div>
            ))}
          </Panel>

          <TheBoard notices={desk.notices} canPin={desk.superAdmin} />
        </div>
      </div>

      {desk.superAdmin && today.rows.length ? <Health rows={today.rows} /> : null}
    </div>
  );
}
