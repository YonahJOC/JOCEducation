import Link from "next/link";
import { safeAuth } from "@/auth";
import { myAmbassadorship } from "@/lib/ambassadors";
import { screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { ScreenEditor } from "@/components/school-screen/ScreenEditor";
import { C, T } from "@/lib/joc-tokens";

/**
 * The school's screen, from an ambassador's side.
 *
 * They add flyers for what they are running and photos of it happening.
 * Nothing they add goes up until a teacher approves it, and they can change
 * or take back their own until then.
 */

export const metadata = { title: "Our school screen" };
export const dynamic = "force-dynamic";

export default async function AmbassadorScreenPage() {
  const session = await safeAuth();
  const amb = await myAmbassadorship();
  const role = amb ? await screenRoleFor(session?.user, amb.schoolId) : null;
  const data = amb && role ? await screenEditorData(amb.schoolId, role, session?.user?.id ?? null) : null;

  if (!data) {
    return (
      <div>
        <h1 style={{ ...T.title, color: C.ink }}>Our school screen</h1>
        <p style={{ ...T.read, color: C.muted }}>
          This is for a school&rsquo;s ambassadors. If your teacher gave you a code, <Link href="/ambassador/join" style={{ color: C.blue }}>join with it here</Link>.
        </p>
      </div>
    );
  }

  return <ScreenEditor data={data} />;
}
