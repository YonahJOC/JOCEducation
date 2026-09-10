import { safeAuth } from "@/auth";
import { mySchool } from "@/lib/school-data";
import { TeachersPanel } from "@/components/school/TeachersPanel";

export const metadata = { title: "Your teachers — JOC Education" };

export default async function SchoolTeachersPage() {
  const [school, session] = await Promise.all([mySchool(), safeAuth()]);

  if (!school) {
    return (
      <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)", maxWidth: "48ch", lineHeight: 1.6 }}>
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
