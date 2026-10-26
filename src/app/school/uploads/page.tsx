import { requireSchoolPanel } from "../account-only";
import { safeAuth } from "@/auth";
import { currentSchoolId } from "@/lib/school-scope";
import { myScreenSchool, screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { shortName } from "@/lib/school-screen/rules";
import { UploadsBoard, tabFromQuery } from "@/components/school-screen/UploadsBoard";
import { PageHeader } from "@/components/ui/PageHeader";
import { C, T } from "@/lib/joc-tokens";

/**
 * What is waiting for the school to say yes to.
 *
 * It used to sit at the top of the Live Screen editor, above the slideshow
 * and the settings — so the part with a clock on it scrolled away under
 * the part without one. Same decisions, same server actions, its own page
 * and its own count on the rail.
 */

export const metadata = { title: "Uploads & approvals" };
export const dynamic = "force-dynamic";

export default async function SchoolUploadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSchoolPanel({ demo: "allow" });
  const session = await safeAuth();
  // "2 set aside by an ambassador" on the home page lands on that tab.
  const tab = tabFromQuery((await searchParams).tab);

  const schoolId = (await currentSchoolId()) ?? (await myScreenSchool())?.id ?? null;
  const role = schoolId ? await screenRoleFor(session?.user, schoolId) : null;
  const data = schoolId && role ? await screenEditorData(schoolId, role, session?.user?.id ?? null) : null;

  if (!data) {
    return (
      <div style={{ padding: "32px 0" }}>
        <h1 style={{ ...T.title, color: C.ink }}>Uploads &amp; approvals</h1>
        <p style={{ ...T.read, color: C.muted }}>This account isn&rsquo;t attached to a school&rsquo;s screen.</p>
      </div>
    );
  }

  // Somebody who can look but not decide — there is no such role on this
  // page today, and a blank screen would be the wrong way to find out.
  if (!data.canEndorse) {
    return (
      <>
        <PageHeader title="Uploads & approvals" sub="This is for the people who look after your school's screen." />
      </>
    );
  }

  return (
    <UploadsBoard
      data={data}
      mode={data.canApprove ? "approve" : "endorse"}
      short={shortName(data.school.name, data.school.shortName)}
      initialTab={tab}
    />
  );
}
