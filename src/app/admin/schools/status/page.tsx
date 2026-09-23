import { SchoolsGuard } from "@/components/admin/Guard";
import { PageIntro } from "@/components/admin/PageIntro";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { getSchoolStatus } from "@/lib/school-status";
import { StatusBoard } from "./StatusBoard";
import { C, R } from "@/lib/joc-tokens";

export const metadata = { title: "School status — JOC Console" };
export const dynamic = "force-dynamic";

export default async function SchoolStatusPage() {
  return <SchoolsGuard>{await Inner()}</SchoolsGuard>;
}

async function Inner() {
  const session = await safeAuth();
  const canEdit = openForReview || can(session?.user, "schools");
  const schools = await getSchoolStatus();

  const missing = {
    list: schools.filter((s) => !s.studentListAt).length,
    screen: schools.filter((s) => !s.liveScreenAt).length,
    coordinator: schools.filter((s) => !s.coordinator).length,
    unchecked: schools.filter((s) => !s.unapproved.checkedAt).length,
  };

  return (
    <div>
      <PageIntro
        title="School status"
        what="Where every school is up to, on one screen — paid, student list, coordinator, live screen, hours waiting, last spoken to, last visited, and the store. These are the things that get asked about a school over and over, and used to mean opening four pages and asking somebody."
        steps={[
          "Tick the student list when the school sends it, the live screen when it goes up, and the store when it opens. Ticking records today's date, so the board can say how long it has been true.",
          "Untick if it turns out not to be — that clears the date rather than writing a false one.",
          "Type the unapproved hours from the JOC App. It records when you read it, and starts warning you once that reading gets old.",
          "Use “Log a visit or call” the moment you notice it is overdue, rather than remembering to do it later somewhere else.",
          "A coordinator comes from the school's own page — add them there as a contact and tick Primary.",
        ]}
        note="Everything orange on this board is something missing, not something wrong. A blank cell would read as “not loaded yet”, so absence is said out loud."
      />

      {schools.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          <Count n={schools.length} label={`school${schools.length === 1 ? "" : "s"}`} />
          {missing.coordinator > 0 && <Count n={missing.coordinator} label="with no coordinator" warn />}
          {missing.list > 0 && <Count n={missing.list} label="with no student list" warn />}
          {missing.screen > 0 && <Count n={missing.screen} label="with no live screen" warn />}
          {missing.unchecked > 0 && <Count n={missing.unchecked} label="never checked for hours" warn />}
        </div>
      )}

      <StatusBoard schools={schools} canEdit={canEdit} />
    </div>
  );
}

function Count({ n, label, warn }: { n: number; label: string; warn?: boolean }) {
  return (
    <span
      style={{
        fontSize: "13px", fontWeight: 600,
        color: warn ? "#C96C00" : "#4A5A74",
        backgroundColor: warn ? "#FFF0E0" : "#fff",
        border: `1px solid ${warn ? "rgba(154,84,5,.25)" : C.hairline}`,
        borderRadius: R.chip, padding: "6px 13px",
      }}
    >
      <strong style={{ fontWeight: 700 }}>{n}</strong> {label}
    </span>
  );
}
