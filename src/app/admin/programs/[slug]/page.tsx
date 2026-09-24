import { notFound } from "next/navigation";
import { pageTitle, C, F } from "@/lib/joc-tokens";
import { getProgramAdmin } from "@/lib/program-admin";
import { listForms } from "@/lib/forms";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { money, isPaymentConfigured } from "@/lib/payments";
import { ProgramAdminClient } from "./ProgramAdminClient";
import { getAppActivity } from "@/lib/app-activity";
import { getProgramTraffic } from "@/lib/program-traffic";
import { enrolledSchools } from "@/lib/program-enrollment";
import { programReporting } from "@/lib/ambassadors";
import { getProgramToday } from "@/lib/program-today";
import { slotFor } from "@/lib/program-slot";
import { heroFg } from "@/lib/hero-color";
import { AppActivityPanel } from "@/components/admin/AppActivityPanel";
import { ProgramReports } from "@/components/admin/ProgramReports";
import { ProgramTodayPanel, EmptySlot } from "@/components/admin/ProgramTodayPanel";
import { ProgramConsoleHeader, type TabKey } from "@/components/admin/ProgramConsoleHeader";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * One console, eight programs.
 *
 * The form builder used to be the first thing on this page, above the schools,
 * the traffic light and the sign-ups — so the console opened on the one job a
 * coordinator does least often. It opens on Today now, and every section is a
 * tab with its own address.
 */

export const metadata = { title: "Program — JOC Console" };
export const dynamic = "force-dynamic";

const TABS: TabKey[] = ["today", "schools", "calendar", "sign-ups", "setup"];

/** Schools in the program and schools not in it used to be two tabs. */
const MOVED: Record<string, TabKey> = { "not-in-yet": "schools" };

export default async function ProgramAdminPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ slug }, { tab: wanted }] = await Promise.all([params, searchParams]);

  // One view of a program, whoever opens it. An admin's is a coordinator's
  // with Setup on the end — there was a ?as=coordinator that swapped one for
  // the other, which meant an admin checking a coordinator's console stopped
  // being able to fix what they found.
  const view = await getProgramAdmin(slug);

  if (view === null) notFound();
  if (view === "denied") {
    return (
      <div style={{ maxWidth: "460px", padding: "40px 0" }}>
        <h1 style={{ ...pageTitle, color: C.ink, margin: "0 0 10px" }}>
          Not one of yours
        </h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
          You are not down as running this program, and your admin type does not include Programs.
          A super admin can add you as a lead under this program&rsquo;s settings.
        </p>
      </div>
    );
  }

  const session = await safeAuth();

  // Setup is the one tab that is not for everybody: it edits the questions a
  // school is asked, and says who runs the program.
  const canSetup = view.canEditForm || view.canSetCoordinators;
  const tabs = TABS.filter((t) => t !== "setup" || canSetup);
  const asked = (wanted ? MOVED[wanted] : undefined) ?? (wanted as TabKey | undefined);
  const tab: TabKey = asked && tabs.includes(asked) ? asked : "today";

  // The JOC App is the one program whose figures are behind their own
  // capability — that panel is full of every school's data.
  const appActivity =
    slug === "joc-app" && (openForReview || can(session?.user, "app_activity"))
      ? await getAppActivity()
      : null;

  const [traffic, enrolled, reporting, today] = await Promise.all([
    getProgramTraffic(view.id, {
      canSetLight: openForReview || can(session?.user, "set_program_light"),
    }),
    enrolledSchools(view.id),
    programReporting(view.id),
    getProgramToday(view.id, slug),
  ]);

  // Only offered to somebody who may actually rewire the program.
  const forms = view.canEditProgram ? await listForms() : [];
  const team = view.canSetCoordinators && isDatabaseConfigured()
    ? await prisma.user.findMany({
        where: { email: { endsWith: "@justonechesed.org" } },
        orderBy: { email: "asc" },
        select: { id: true, name: true, email: true },
      })
    : [];

  // ── The one panel that is particular to this program ────────────────────
  // A slot with nothing behind it says what is not recorded, in a sentence.
  // An empty chart would read as "nothing happened".
  const slot = slotFor(slug, view.tag);
  const slotNode =
    slot.kind === "app" && appActivity ? (
      <AppActivityPanel data={appActivity} />
    ) : slot.kind === "reports" && reporting.totals.ambassadors > 0 ? (
      <ProgramReports programName={view.name} data={reporting} />
    ) : slot.kind === "bookings" ? null : (
      <EmptySlot
        title={slot.title}
        missing={
          slot.kind === "app"
            ? "The JOC App's figures are behind their own permission, and yours does not include them."
            : slot.kind === "reports"
            ? "No school has student ambassadors on this yet, so there is nothing being reported from the ground."
            : slot.missing ?? "Nothing is recorded for this program yet."
        }
      />
    );

  const lead = view.leads[0] ? view.leads[0].name ?? view.leads[0].email : null;
  const counts = [
    `${enrolled.length} SCHOOLS IN`,
    `${traffic.counts.all} NOT YET`,
    today.comingUp[0]
      ? `NEXT RUN ${today.comingUp[0].startsAt.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}`
      : "NOTHING BOOKED",
  ].join(" · ");

  return (
    <>
      <div className="joc-bleed">
        <ProgramConsoleHeader
          name={view.name}
          slug={view.slug}
          tag={view.tag}
          lead={lead}
          heroColor={view.heroColor}
          fg={heroFg(view.heroColor)}
          counts={counts}
          tabs={tabs}
          active={tab}
          tabCounts={{
            schools: enrolled.length + traffic.counts.all,
            today: today.rows.length,
          }}
        />
      </div>

      <ProgramAdminClient
        view={view}
        forms={forms.map((f) => ({ id: f.id, title: f.title, responseCount: f.responseCount }))}
        team={team}
        feeLabel={view.form?.feeCents ? money(view.form.feeCents) : null}
        paymentsOn={isPaymentConfigured}
        traffic={traffic}
        enrolled={enrolled}
        tab={tab}
        today={
          tab === "today" ? (
            <ProgramTodayPanel
              data={today}
              programName={view.name}
              slot={slotNode}
            />
          ) : null
        }
      />
    </>
  );
}
