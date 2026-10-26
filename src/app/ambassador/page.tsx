import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { myAmbassadorship, myEndedAmbassadorship, myReports } from "@/lib/ambassadors";
import { screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData, waitingForAmbassador } from "@/lib/school-screen/editor-data";
import { myUploads } from "@/lib/school-screen/queue";
import { dayKey, shortName } from "@/lib/school-screen/rules";
import { slideState } from "@/lib/school-screen/slideshow";
import { AmbassadorHome } from "@/components/ambassador/AmbassadorHome";
import { UploadsPeek } from "@/components/ambassador/UploadsPeek";
import { LivePanel } from "@/components/school-screen/LivePanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { C, F, R, T, HIT, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * An ambassador's home.
 *
 * It opened on a blue banner saying the name of the program they are
 * standing in, under a rail that also says the name of the program they
 * are standing in. What it did not say was that four things were waiting
 * for them, which is the only thing on this page with anybody on the other
 * end of it.
 *
 * So: what needs them, where their own things got to, and what is on the
 * wall right now. Writing up a run is still here — it is the other half of
 * the job — one card further down.
 */

export const metadata = { title: "Your program" };
export const dynamic = "force-dynamic";

/**
 * Dates the calendar says this program ran at their school.
 *
 * So a write-up can be attached to one rather than typed blind. Up to
 * tomorrow, because somebody writing up this afternoon's run at four
 * o'clock should find it in the list.
 */
async function pastRuns(schoolId: string, programId: number) {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.programEvent.findMany({
    where: {
      schoolId,
      programId,
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
            ? `You ran ${ended.programName} until ${ended.endedOn.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}. Everything you wrote is still with your teacher. If you are running it again, they can give you a new code.`
            : "If a teacher has given you a code, enter it and you will be set up for the one program you run."}
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
  const [data, waiting, reports] = await Promise.all([
    role ? screenEditorData(mine.schoolId, role, userId) : Promise.resolve(null),
    waitingForAmbassador(mine.schoolId, userId).catch(() => 0),
    myReports(mine.id).catch(() => []),
  ]);

  const short = data ? shortName(data.school.name, data.school.shortName) : "";
  const today = dayKey(new Date());
  const showing = (data?.flyers ?? []).filter((f) => slideState({
    status: f.status, template: f.template, showFrom: f.showFrom, showUntil: f.showUntil,
    startsOn: f.startsAt ? dayKey(new Date(f.startsAt)) : null,
  }, today) === "showing");
  const theirs = showing.filter((f) => f.endorsedMine || f.mine).length;

  const runs = await pastRuns(mine.schoolId, mine.programId);

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title={first ? `Hi, ${first}` : "Your program"}
        sub={`You run ${mine.programName}, and you get first look at the hallway screen.`}
      />

      <div style={{ display: "flex", gap: "22px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "grid", gap: "18px" }}>
          {/* The only thing on this page with somebody on the other end. */}
          {waiting > 0 ? (
            <section style={{
              display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap",
              background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row, padding: "18px",
            }}>
              <span aria-hidden="true" className="material-symbols-rounded" style={{
                width: "48px", height: "48px", flex: "none", borderRadius: R.sm,
                background: C.orangeTint, color: C.orangeText,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
              }}>
                waving_hand
              </span>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <p style={{ fontFamily: F.ui, fontSize: "18px", fontWeight: 700, color: C.ink, margin: 0 }}>
                  {waiting} waiting for your first look
                </p>
                <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "3px 0 0" }}>
                  Pass on what should go up. A teacher decides after you.
                </p>
              </div>
              <Link href="/ambassador/uploads" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minHeight: HIT, padding: "0 20px", borderRadius: R.button,
                background: C.blue, color: C.white, textDecoration: "none",
                fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
              }}>
                Start first look
              </Link>
            </section>
          ) : null}

          {data ? (
            <UploadsPeek
              items={myUploads(data).slice(0, 4)}
              short={short}
              seeAll="/ambassador/uploads?tab=mine"
            />
          ) : null}

          {/* The other half of the job: writing up what happened. */}
          <AmbassadorHome scope={mine} reports={reports} runs={runs} />
        </div>

        {data ? (
          <LivePanel
            flyers={showing}
            short={short}
            sticky
            note={showing.length === 0
              ? undefined
              : theirs === 0
                ? `${showing.length} ${showing.length === 1 ? "slide is" : "slides are"} up at ${data.school.name}.`
                : `${theirs} of ${showing.length} ${showing.length === 1 ? "slide is" : "slides are"} up because of you.`}
          />
        ) : null}
      </div>
    </div>
  );
}
