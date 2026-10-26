import Link from "next/link";
import { safeAuth } from "@/auth";
import { myAmbassadorship } from "@/lib/ambassadors";
import { screenRoleFor } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { shortName } from "@/lib/school-screen/rules";
import { UploadsBoard } from "@/components/school-screen/UploadsBoard";
import { C, T } from "@/lib/joc-tokens";

/**
 * An ambassador's first look, and what they have sent in themselves.
 *
 * Their yes passes something on to a teacher; it does not put anything in
 * a hallway. The page never says otherwise, and the server would not let
 * it if it did.
 */

export const metadata = { title: "Uploads" };
export const dynamic = "force-dynamic";

export default async function AmbassadorUploadsPage() {
  const session = await safeAuth();
  const amb = await myAmbassadorship();
  const role = amb ? await screenRoleFor(session?.user, amb.schoolId) : null;
  const data = amb && role ? await screenEditorData(amb.schoolId, role, session?.user?.id ?? null) : null;

  if (!data) {
    return (
      <div>
        <h1 style={{ ...T.title, color: C.ink }}>Uploads</h1>
        <p style={{ ...T.read, color: C.muted }}>
          This is for a school&rsquo;s ambassadors. If your teacher gave you a code,{" "}
          <Link href="/ambassador/join" style={{ color: C.blue }}>join with it here</Link>.
        </p>
      </div>
    );
  }

  return (
    <UploadsBoard
      data={data}
      mode={data.canApprove ? "approve" : "endorse"}
      short={shortName(data.school.name, data.school.shortName)}
    />
  );
}
