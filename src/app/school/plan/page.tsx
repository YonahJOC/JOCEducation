import { mySchool, myPlanRequests } from "@/lib/school-data";
import { SchoolPlanPanel } from "@/components/school/PlanPanel";

export const metadata = { title: "Plan & seats — JOC Education" };

export default async function SchoolPlanPage() {
  const [school, requests] = await Promise.all([mySchool(), myPlanRequests()]);

  if (!school) {
    return (
      <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)", maxWidth: "48ch", lineHeight: 1.6 }}>
        We could not load your school. Email{" "}
        <a href="mailto:education@justonechesed.org">education@justonechesed.org</a> if this continues.
      </p>
    );
  }

  return (
    <SchoolPlanPanel
      schoolName={school.name}
      plan={school.plan}
      planStatus={school.planStatus}
      interval={school.interval}
      seats={school.seats}
      seatsUsed={school.seatsUsed}
      renewsOn={school.renewsOn}
      grantedManually={school.grantedManually}
      accountManager={school.accountManager}
      requests={requests}
    />
  );
}
