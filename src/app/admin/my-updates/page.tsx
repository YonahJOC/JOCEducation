import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { leadsAnyProgram } from "@/lib/program-admin";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { MyUpdateRow } from "./MyUpdateRow";
import { TAG, day, clock, ago } from "@/lib/school-update";
import { C, F, datum, label, rowCard, pageTitle, sectionHeading } from "@/lib/joc-tokens";

/**
 * What one person took off the Buzz.
 *
 * Their own list and nobody else's. A coordinator holds no console
 * capability, so this page is guarded by running a program rather than by a
 * permission — the same bar as picking an item up in the first place.
 */

export const metadata = { title: "My Buzz items — JOC Console" };
export const dynamic = "force-dynamic";

export default async function MyUpdatesPage() {
  const session = await safeAuth();
  const me = session?.user;

  const allowed = openForReview
    || can(me, "schools")
    || (await leadsAnyProgram(me?.id ?? null));
  if (!allowed) redirect("/admin");

  if (!isDatabaseConfigured() || !me?.id) {
    return (
      <div>
        <h1 style={pageTitle}>My Buzz items</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to show.
        </p>
      </div>
    );
  }

  const rows = await prisma.schoolActivity.findMany({
    where: { takenById: me.id },
    orderBy: [{ takenDoneAt: "asc" }, { takenAt: "desc" }],
    select: {
      id: true, type: true, detail: true, occurredAt: true,
      takenAt: true, takenDoneAt: true,
      program: { select: { name: true } },
      author: { select: { name: true, email: true } },
      school: { select: { id: true, name: true } },
    },
  }).catch(() => []);

  const open = rows.filter((r) => !r.takenDoneAt);
  const done = rows.filter((r) => r.takenDoneAt);
  const now = new Date();

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>My Buzz items</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {open.length} TO DEAL WITH ·{" "}
            <Link href="/buzz" style={{ color: C.blue, textDecoration: "none" }}>THE BUZZ</Link>
          </p>
        </div>
        <SectionLinks section="schools" />
      </div>

      {rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: 0, maxWidth: "58ch" }}>
            Nothing here yet. On <Link href="/buzz" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>the Buzz</Link>,
            press <strong style={{ color: C.ink }}>Move to my console</strong> on anything you are
            taking on, and it lands here.
          </p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Waiting on you</h2>
              <div style={{ display: "grid", gap: "10px" }}>
                {open.map((r) => (
                  <article key={r.id} style={{ ...rowCard, padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                      <Link
                        href={`/admin/schools/${r.school.id}`}
                        style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, textDecoration: "none" }}
                      >
                        {r.school.name}
                      </Link>
                      <span style={{ ...datum, color: C.muted }}>
                        {day(r.occurredAt).toUpperCase()}
                        {clock(r.occurredAt, r.type) ? ` · ${clock(r.occurredAt, r.type)}` : ""}
                      </span>
                    </div>

                    <p style={{ ...datum, color: C.muted, margin: "4px 0 8px" }}>
                      <span style={{ color: C.ink }}>{TAG[r.type] ?? "UPDATE"}</span>
                      {" · "}
                      {r.program?.name ?? "No program"}
                      {" · "}
                      {r.author?.name ?? r.author?.email ?? "somebody at JOC"}
                      {r.takenAt ? ` · PICKED UP ${ago(r.takenAt, now).toUpperCase()}` : ""}
                    </p>

                    {r.detail && (
                      <p style={{
                        fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
                        margin: "0 0 10px", maxWidth: "62ch", whiteSpace: "pre-wrap",
                      }}>
                        {r.detail}
                      </p>
                    )}

                    <MyUpdateRow activityId={r.id} done={false} />
                  </article>
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Dealt with</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {done.map((r) => (
                  <article key={r.id} style={{ ...rowCard, padding: "13px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`/admin/schools/${r.school.id}`}
                          style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink, textDecoration: "none" }}
                        >
                          {r.school.name}
                        </Link>
                        <p style={{ ...label, color: C.muted, margin: "2px 0 0" }}>
                          {TAG[r.type] ?? "UPDATE"}
                          {r.takenDoneAt ? ` · DONE ${ago(r.takenDoneAt, now).toUpperCase()}` : ""}
                        </p>
                      </div>
                      <MyUpdateRow activityId={r.id} done />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
