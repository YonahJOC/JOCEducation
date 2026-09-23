import { notFound } from "next/navigation";
import { getProgramAdmin } from "@/lib/program-admin";
import { listForms } from "@/lib/forms";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { money, isPaymentConfigured } from "@/lib/payments";
import { ProgramAdminClient } from "./ProgramAdminClient";
import { getAppActivity } from "@/lib/app-activity";
import { getProgramTraffic } from "@/lib/program-traffic";
import { enrolledSchools } from "@/lib/program-enrollment";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

export const metadata = { title: "Program — JOC Console" };
export const dynamic = "force-dynamic";

export default async function ProgramAdminPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const [{ slug }, { as }] = await Promise.all([params, searchParams]);

  // ?as=coordinator shows the page as whoever runs this program sees it.
  const asCoordinator = as === "coordinator";
  const view = await getProgramAdmin(slug, { asCoordinator });

  if (view === null) notFound();
  if (view === "denied") {
    return (
      <div style={{ maxWidth: "460px", padding: "40px 0" }}>
        <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>
        <h1 style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "-0.03em", color: "#10233F", margin: "0 0 10px" }}>
          Not one of yours
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: 0 }}>
          You are not down as running this program, and your admin type does not include Programs.
          A super admin can add you as a lead under this program&rsquo;s settings.
        </p>
      </div>
    );
  }

  // The JOC App is the one program with figures of its own, and they are
  // behind their own capability — the console is full of schools' data.
  const session = await safeAuth();
  const appActivity =
    slug === "joc-app" && (openForReview || can(session?.user, "app_activity"))
      ? await getAppActivity()
      : null;

  // The traffic light. On every console, including the coordinator's own
  // preview — it is the one part of this page a coordinator works from, so
  // hiding it in the preview would make the preview a lie.
  const traffic = await getProgramTraffic(view.id, {
    canSetLight: !asCoordinator && (openForReview || can(session?.user, "set_program_light")),
  });

  // Who already runs it, and how far along each one is. A coordinator moves
  // their own program's schools on — it is the work, not an admin job.
  const enrolled = await enrolledSchools(view.id);

  // Only offered to somebody who may actually rewire the program.
  const forms = view.canEditProgram ? await listForms() : [];
  const team = view.canSetCoordinators && isDatabaseConfigured()
    ? await prisma.user.findMany({
        where: { email: { endsWith: "@justonechesed.org" } },
        orderBy: { email: "asc" },
        select: { id: true, name: true, email: true },
      })
    : [];

  return (
    <ProgramAdminClient
      view={view}
      forms={forms.map((f) => ({ id: f.id, title: f.title, responseCount: f.responseCount }))}
      team={team}
      feeLabel={view.form?.feeCents ? money(view.form.feeCents) : null}
      paymentsOn={isPaymentConfigured}
      asCoordinator={asCoordinator}
      appActivity={asCoordinator ? null : appActivity}
      traffic={traffic}
      enrolled={enrolled}
    />
  );
}
