import Link from "next/link";
import { safeAuth } from "@/auth";
import { myAmbassadorship, myReports } from "@/lib/ambassadors";
import { screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { myUploads } from "@/lib/school-screen/queue";
import { ambassadorUpdates, type Update } from "@/lib/school-screen/updates";
import { PageHeader } from "@/components/ui/PageHeader";
import { C, F, R, T, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * What happened to the things a student sent in.
 *
 * "Updates" rather than "Messages" on purpose, and read-only on purpose.
 * JOC does not write to students and this page does not send — calling it
 * Messages would promise a conversation that is deliberately not there,
 * and leave somebody waiting for a reply that is never coming.
 */

export const metadata = { title: "Updates" };
export const dynamic = "force-dynamic";

const TONE: Record<Update["tone"], { bg: string; fg: string }> = {
  good: { bg: C.greenTint, fg: C.greenText },
  info: { bg: C.blueTint, fg: C.blue },
  quiet: { bg: C.panel, fg: C.muted },
};

function when(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AmbassadorUpdatesPage() {
  const session = await safeAuth();
  const amb = await myAmbassadorship();

  if (!amb) {
    return (
      <div>
        <h1 style={{ ...T.title, color: C.ink }}>Updates</h1>
        <p style={{ ...T.read, color: C.muted }}>
          This is for a school&rsquo;s ambassadors. If your teacher gave you a code,{" "}
          <Link href="/ambassador/join" style={{ color: C.blue }}>join with it here</Link>.
        </p>
      </div>
    );
  }

  const role = await screenRoleFor(session?.user, amb.schoolId);
  const data = role ? await screenEditorData(amb.schoolId, role, session?.user?.id ?? null) : null;
  const reports = await myReports(amb.id).catch(() => []);

  const updates = ambassadorUpdates(data ? myUploads(data) : [], reports);

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title="Updates"
        sub="What happened to the things you sent in, newest first."
      />

      {updates.length === 0 ? (
        <div style={{
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row,
          padding: "40px 24px", textAlign: "center",
        }}>
          <span aria-hidden="true" className="material-symbols-rounded" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: R.row,
            background: C.panel, color: C.muted, fontSize: "30px", marginBottom: "12px",
          }}>
            schedule
          </span>
          <h2 style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>
            Nothing has moved yet
          </h2>
          <p style={{ ...T.read, color: C.muted, margin: "0 auto", maxWidth: "46ch" }}>
            When something you sent in is passed on or goes up on the screen, it turns up here.
          </p>
        </div>
      ) : (
        <ul style={{
          listStyle: "none", margin: 0, padding: 0, overflow: "hidden",
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row,
        }}>
          {updates.map((u, i) => {
            const tone = TONE[u.tone];
            return (
              <li key={u.key} style={{
                display: "flex", gap: "14px", alignItems: "flex-start",
                padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.rule}`,
              }}>
                <span aria-hidden="true" className="material-symbols-rounded" style={{
                  width: "38px", height: "38px", flex: "none", borderRadius: R.sm,
                  background: tone.bg, color: tone.fg,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px",
                }}>
                  {u.icon}
                </span>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {u.headline}
                  </p>
                  <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "2px 0 0", lineHeight: 1.45 }}>
                    {u.line}
                  </p>
                </div>
                <span style={{ ...T.meta, flex: "none", paddingTop: "3px" }}>{when(u.at)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ ...T.small, fontWeight: 400, color: C.faint, margin: "14px 2px 0" }}>
        Nothing is sent from this page, and JOC never messages students. If you need to ask
        something, speak to {amb.supervisor.name ?? "your teacher"}.
      </p>
    </div>
  );
}
