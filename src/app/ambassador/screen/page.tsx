import Link from "next/link";
import { safeAuth } from "@/auth";
import { myAmbassadorship, myReports } from "@/lib/ambassadors";
import { screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { myUploads } from "@/lib/school-screen/queue";
import { dayKey, shortName } from "@/lib/school-screen/rules";
import { slideState } from "@/lib/school-screen/slideshow";
import { ambassadorUpdates } from "@/lib/school-screen/updates";
import { UploadsBoard } from "@/components/school-screen/UploadsBoard";
import { LivePanel } from "@/components/school-screen/LivePanel";
import { UpdatesFeed } from "@/components/ambassador/UpdatesFeed";
import { PageHeader } from "@/components/ui/PageHeader";
import { C, F, R, T, HIT, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * The whole of an ambassador's job, on the page about the thing itself.
 *
 * It used to be three rail items — the screen, the queue, the updates —
 * which read as three jobs. There is one: the wall. What is waiting for
 * you, what is on it, and what happened to the things you sent are all
 * about the same television, so they are all on the page about it.
 *
 * First look leads, because it is the only part with somebody on the
 * other end waiting.
 */

export const metadata = { title: "Live Screen" };
export const dynamic = "force-dynamic";

export default async function AmbassadorScreenPage() {
  const session = await safeAuth();
  const amb = await myAmbassadorship();
  const role = amb ? await screenRoleFor(session?.user, amb.schoolId) : null;
  const data = amb && role ? await screenEditorData(amb.schoolId, role, session?.user?.id ?? null) : null;

  if (!amb || !data) {
    return (
      <div style={{ maxWidth: CONTENT_MAX }}>
        <PageHeader title="Live Screen" sub="For a school's ambassadors." />
        <p style={{ ...T.read, color: C.muted, margin: 0 }}>
          If your teacher gave you a code,{" "}
          <Link href="/ambassador/join" style={{ color: C.blue }}>join with it here</Link>.
        </p>
      </div>
    );
  }

  const short = shortName(data.school.name, data.school.shortName);
  const today = dayKey(new Date());
  const showing = data.flyers.filter((f) => slideState({
    status: f.status, template: f.template, showFrom: f.showFrom, showUntil: f.showUntil,
    startsOn: f.startsAt ? dayKey(new Date(f.startsAt)) : null,
  }, today) === "showing");
  const theirs = showing.filter((f) => f.endorsedMine || f.mine).length;

  const reports = await myReports(amb.id).catch(() => []);
  const updates = ambassadorUpdates(myUploads(data), reports);

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title="Live Screen"
        sub={`The wall at ${data.school.name}. Nothing goes up on it until you have seen it first.`}
        actions={
          <a
            href={`/school-screen/${data.school.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px", minHeight: HIT,
              padding: "0 16px", borderRadius: R.button, textDecoration: "none",
              background: C.white, color: C.ink, border: `1px solid ${C.outline}`,
              fontFamily: F.ui, fontSize: "14.5px", fontWeight: 700,
            }}
          >
            Open the TV
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "18px" }}>open_in_new</span>
          </a>
        }
      />

      <div style={{ display: "flex", gap: "22px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "999 1 460px", minWidth: 0, display: "grid", gap: "26px" }}>
          <Section
            title="Your first look"
            line="Pass on what should go up. A teacher decides after you."
          >
            <UploadsBoard
              data={data}
              mode={data.canApprove ? "approve" : "endorse"}
              short={short}
              embedded
            />
          </Section>

          <Section
            title="What happened"
            line="Where the things you sent in have got to."
          >
            <UpdatesFeed updates={updates} teacherName={amb.supervisor.name ?? null} />
          </Section>
        </div>

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
      </div>
    </div>
  );
}

/** A heading over one part of the page, so three parts read as three. */
function Section({ title, line, children }: {
  title: string; line: string; children: React.ReactNode;
}) {
  return (
    <section>
      <h2 style={{ fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 3px" }}>
        {title}
      </h2>
      <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "0 0 14px" }}>{line}</p>
      {children}
    </section>
  );
}
