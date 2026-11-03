import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { myAmbassadorship, myEndedAmbassadorship, myReports } from "@/lib/ambassadors";
import { screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData, waitingForAmbassador } from "@/lib/school-screen/editor-data";
import { myUploads } from "@/lib/school-screen/queue";
import { AmbassadorHome } from "@/components/ambassador/AmbassadorHome";
import { PageHeader } from "@/components/ui/PageHeader";
import { C, F, R, T, HIT, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * How this works.
 *
 * The first page an ambassador sees, and the only one that is not about
 * doing the job. It says what the job is, which nothing used to: a student
 * arrived at a blue banner, an empty report form, and no explanation of
 * why they were there.
 *
 * The work itself lives on the Live Screen page. Writing up a run lives
 * here, because it is the one part of an ambassador's job that is not
 * about the wall.
 */

export const metadata = { title: "How this works" };
export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: "visibility",
    title: "You see it first",
    line: "Flyers, photos and shout-outs from your school land with you. You pass on what should go up and set aside what shouldn't.",
  },
  {
    icon: "add_photo_alternate",
    title: "You send in your own",
    line: "A flyer for something you are running, or a photo of it happening. A teacher approves it before it reaches the wall.",
  },
  {
    icon: "tv",
    title: "You watch it go up",
    line: "Your teacher says yes, and it is in the corridor within five minutes, in front of everybody walking past.",
  },
];

async function pastRuns(schoolId: string, programId: number) {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.programEvent.findMany({
    where: {
      schoolId, programId,
      status: { not: "CANCELLED" },
      startsAt: { lte: new Date(Date.now() + 86_400_000) },
    },
    orderBy: { startsAt: "desc" },
    take: 8,
    select: { id: true, title: true, startsAt: true },
  }).catch(() => []);
  return rows.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt }));
}

export default async function AmbassadorPage() {
  const mine = await myAmbassadorship();

  if (!mine) {
    const ended = await myEndedAmbassadorship();
    return (
      <div style={{
        background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row, padding: "28px 24px",
      }}>
        <p style={{ fontFamily: F.ui, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 8px" }}>
          {ended ? "Your time running it has finished" : "You are not an ambassador yet"}
        </p>
        <p style={{ ...T.read, color: C.muted, margin: "0 0 18px", maxWidth: "52ch" }}>
          {ended
            ? `You ran it until ${ended.endedOn.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}. Everything you wrote is still with your teacher. If you are running it again, they can give you a new code.`
            : "If a teacher has given you a code, enter it and you will be set up."}
        </p>
        <Link href="/ambassador/join" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
          color: C.white, background: C.blue, borderRadius: R.button,
          padding: "0 22px", minHeight: HIT, textDecoration: "none",
        }}>
          Enter a code
        </Link>
      </div>
    );
  }

  const session = await safeAuth();
  const userId = session?.user?.id ?? null;
  const first = (session?.user?.name ?? "").trim().split(/\s+/)[0] || null;

  const role = await screenRoleFor(session?.user, mine.schoolId);
  const [data, waiting, reports, runs] = await Promise.all([
    role ? screenEditorData(mine.schoolId, role, userId) : Promise.resolve(null),
    waitingForAmbassador(mine.schoolId, userId).catch(() => 0),
    myReports(mine.id).catch(() => []),
    pastRuns(mine.schoolId, mine.programId),
  ]);
  const sentIn = data ? myUploads(data).length : 0;

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title={first ? `Hi, ${first}` : "How this works"}
        sub={`You look after the screen at ${mine.schoolName}. Nothing goes up on it until you have seen it first.`}
      />

      <div style={{ display: "grid", gap: "18px", maxWidth: "760px" }}>
        <section style={{
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row, padding: "22px",
        }}>
          <h2 style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 3px" }}>
            What an ambassador does
          </h2>
          <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "0 0 20px" }}>
            Three things, and the first one is the one people are waiting on.
          </p>

          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "16px" }}>
            {STEPS.map((s, i) => (
              <li key={s.title} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <span aria-hidden="true" className="material-symbols-rounded" style={{
                  width: "42px", height: "42px", flex: "none", borderRadius: R.sm,
                  background: [C.orangeTint, C.blueTint, C.greenTint][i],
                  color: [C.orangeText, C.blue, C.greenText][i],
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                }}>
                  {s.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: F.ui, fontSize: "16.5px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {s.title}
                  </p>
                  <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "3px 0 0", lineHeight: 1.5, maxWidth: "58ch" }}>
                    {s.line}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "22px" }}>
            <Link href="/ambassador/screen" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minHeight: HIT, padding: "0 20px", borderRadius: R.button, textDecoration: "none",
              background: C.blue, color: C.white, fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
            }}>
              {waiting > 0 ? `Start your first look · ${waiting}` : "Open the Live Screen"}
            </Link>
            <Link href="/ambassador/messages" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minHeight: HIT, padding: "0 18px", borderRadius: R.button, textDecoration: "none",
              background: C.white, color: C.ink, border: `1px solid ${C.outline}`,
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
            }}>
              Ask {mine.supervisor.name?.split(/\s+/).slice(-1)[0] ?? "your teacher"}
            </Link>
          </div>
        </section>

        {/* Where they are up to, in one line, so this page is not only
            instructions to somebody who has been doing it for a month. */}
        {(waiting > 0 || sentIn > 0 || reports.length > 0) ? (
          <section style={{
            background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row, padding: "18px 22px",
            display: "flex", gap: "32px", flexWrap: "wrap",
          }}>
            {[
              [waiting, "waiting for you"],
              [sentIn, "you have sent in"],
              [reports.length, "runs written up"],
            ].map(([n, label]) => (
              <div key={label as string}>
                <p style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, margin: 0, lineHeight: 1 }}>
                  {n as number}
                </p>
                <p style={{ ...T.meta, margin: "4px 0 0" }}>{(label as string).toUpperCase()}</p>
              </div>
            ))}
          </section>
        ) : null}

        {/* The other half of the job, and the only part that is not the
            wall: telling a teacher how a run actually went. */}
        <AmbassadorHome scope={mine} reports={reports} runs={runs} />
      </div>
    </div>
  );
}
