import { requireAccountHolder } from "../account-only";
import { safeAuth } from "@/auth";
import { mySchool } from "@/lib/school-data";
import { TeachersPanel } from "@/components/school/TeachersPanel";
import { C } from "@/lib/joc-tokens";

export const metadata = { title: "Your teachers" };

export default async function SchoolTeachersPage() {
  await requireAccountHolder();
  const [school, session] = await Promise.all([mySchool(), safeAuth()]);

  if (!school) {
    return (
      <p style={{ fontSize: "15px", color: C.muted, maxWidth: "48ch", lineHeight: 1.6 }}>
        We could not load your school. If this keeps happening, email{" "}
        <a href="mailto:education@justonechesed.org">education@justonechesed.org</a>.
      </p>
    );
  }

  return (
    <TeachersPanel
      schoolName={school.name}
      members={school.members}
      invitations={school.invitations}
      seats={school.seats}
      seatsUsed={school.seatsUsed}
      meId={session?.user?.id ?? ""}
    />
  );
}
