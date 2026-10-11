import { requireSchoolPanel } from "../account-only";
import { safeAuth } from "@/auth";
import { currentSchoolId } from "@/lib/school-scope";
import { myScreenSchool, screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { ScreenEditor } from "@/components/school-screen/ScreenEditor";
import { C, T } from "@/lib/joc-tokens";

/**
 * The school's own live screen.
 *
 * For the teachers who already look after the school's ambassadors: the
 * same people approve what the ambassadors and students send. The school is
 * the session's, never the address's — or, for somebody from JOC looking in,
 * the school they chose to look at.
 */

export const metadata = { title: "Your live screen" };
export const dynamic = "force-dynamic";

export default async function SchoolScreenPage() {
  await requireSchoolPanel();
  const session = await safeAuth();

  // A teacher's own school. currentSchoolId() only answers for an account
  // holder or somebody viewing as the school, so an app admin is asked
  // separately.
  const schoolId = (await currentSchoolId()) ?? (await myScreenSchool())?.id ?? null;
  const role = schoolId ? await screenRoleFor(session?.user, schoolId) : null;
  const data = schoolId && role ? await screenEditorData(schoolId, role, session?.user?.id ?? null) : null;

  if (!data) {
    return (
      <div style={{ padding: "32px 0" }}>
        <h1 style={{ ...T.title, color: C.ink }}>Your live screen</h1>
        <p style={{ ...T.read, color: C.muted }}>This account isn&rsquo;t attached to a school&rsquo;s screen.</p>
      </div>
    );
  }

  return <ScreenEditor data={data} />;
}
