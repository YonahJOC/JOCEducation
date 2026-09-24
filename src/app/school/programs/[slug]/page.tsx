import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolPanel } from "../../account-only";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { currentSchoolId } from "@/lib/school-scope";
import { STAGE_LABEL, STAGE_MEANING, type Stage } from "@/lib/program-enrollment";
import { stepFor, STEPS, STEP_TITLE, STEP_NEXT, STEP_ACTION, STEP_SHORT } from "@/lib/program-step";
import { schoolPaymentFor } from "@/lib/money";
import { money } from "@/lib/money";
import { heroFg } from "@/lib/hero-color";
import { BandRow } from "@/components/ui/BandRow";
import { AskCoordinator } from "@/components/school/AskCoordinator";
import { SchoolAppPanel } from "@/components/school/SchoolAppPanel";
import { C, F, R, label, datum, rowCard, sectionHeading, primaryButton } from "@/lib/joc-tokens";

/**
 * One program, as the school running it sees it (5b and 5c).
 *
 * One template for all eight. The difference between a program being set up
 * and a program running is not two pages — it is which half of the overview
 * carries the weight, so it is a branch inside one file rather than two files
 * that drift apart.
 *
 * What is never here: a student's name, a figure presented as measured when a
 * student estimated it, and any number JOC has not actually recorded.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const shortDay = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const SETUP: Stage[] = ["INTRODUCED", "MEETING_BOOKED", "REGISTERED", "MATERIALS_SENT"];

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) return { title: "Your program" };
  const p = await prisma.programPage
    .findUnique({ where: { slug }, select: { name: true } })
    .catch(() => null);
  return { title: p?.name ?? "Your program", robots: { index: false, follow: false } };
}

export default async function SchoolProgramPage({ params, searchParams }: Params) {
  await requireSchoolPanel();

  const { slug } = await params;
  const { tab = "overview" } = await searchParams;

  const schoolId = await currentSchoolId();
  const session = await safeAuth();
  const runsAccount = openForReview || canRunOwnSchool(session?.user);
  const canReadReports = openForReview || canRunSchoolApp(session?.user);

  if (!isDatabaseConfigured() || !schoolId) notFound();

  const program = await prisma.programPage
    .findUnique({
      where: { slug },
      select: {
        id: true, slug: true, name: true, tag: true, heroColor: true, portalHref: true,
        leads: { select: { name: true, email: true } },
      },
    })
    .catch(() => null);

  if (!program) notFound();

  const enrollment = await prisma.programEnrollment
    .findUnique({
      where: { schoolId_programId: { schoolId, programId: program.id } },
      select: { stage: true, stageSince: true, startedAt: true },
    })
    .catch(() => null);

  // A school that does not run this program has not found a locked door; it
  // has found a page about somebody else's program.
  if (!enrollment) notFound();

  const stage = enrollment.stage as Stage;
  const step = stepFor(stage);
  const settingUp = SETUP.includes(stage);
  const fg = heroFg(program.heroColor);

  const coordinator = program.leads[0]?.name ?? program.leads[0]?.email ?? null;
  const firstName = coordinator?.split(/\s+/)[0] ?? null;

  const [events, reports, ambassadors, teachers, payment] = await Promise.all([
    prisma.programEvent.findMany({
      where: { schoolId, programId: program.id, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, startsAt: true, location: true, audience: true, published: true },
    }).catch(() => []),
    canReadReports
      ? prisma.eventReport.findMany({
          where: { ambassador: { schoolId, programId: program.id } },
          orderBy: { occurredOn: "desc" },
          take: 5,
          select: {
            id: true, occurredOn: true, participants: true, whatHappened: true,
            seenBySupervisorAt: true,
          },
        }).catch(() => [])
      : Promise.resolve([]),
    prisma.programAmbassador.count({
      where: { schoolId, programId: program.id, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
    }).catch(() => 0),
    prisma.user.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      take: 20,
      select: { id: true, name: true, email: true },
    }).catch(() => []),
    runsAccount ? schoolPaymentFor(schoolId, program.id) : Promise.resolve(null),
  ]);

  const now = Date.now();
  const upcoming = events.filter((e) => e.startsAt.getTime() >= now);
  const newReports = reports.filter((r) => r.seenBySupervisorAt == null).length;

  // Write-ups only mean something for a program that runs events. A program
  // with no calendar and no ambassadors gets no tab rather than an empty one.
  const eventProgram = events.length > 0 || ambassadors > 0;

  const tabs: { key: string; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "dates", label: `Dates · ${upcoming.length}` },
    ...(eventProgram && canReadReports
      ? [{ key: "write-ups", label: newReports > 0 ? `Write-ups · ${newReports} new` : "Write-ups" }]
      : []),
    { key: "people", label: "People" },
  ];

  const here = tabs.some((t) => t.key === tab) ? tab : "overview";

  return (
    <div>
      {/* The header band, in the program's own colour, so the school always
          knows which of its programs it is looking at. */}
      <section style={{
        backgroundColor: program.heroColor, color: fg, borderRadius: R.hero,
        padding: "clamp(22px, 3.4vw, 34px)", marginBottom: "18px",
      }}>
        <p style={{ ...label, color: fg, opacity: 0.86, margin: "0 0 10px" }}>
          Your program · step 0{step} / 0{STEPS} · {STAGE_LABEL[stage]}
        </p>

        <h1 style={{
          fontFamily: F.ui, fontSize: "clamp(28px, 4.2vw, 40px)", fontWeight: 800,
          letterSpacing: "-0.035em", lineHeight: 1.05, margin: "0 0 16px",
        }}>
          {program.name}
        </h1>

        {program.portalHref ? (
          <a
            href={program.portalHref}
            target="_blank"
            rel="noreferrer"
            style={{ ...primaryButton, backgroundColor: C.white, color: C.ink, border: "none", textDecoration: "none" }}
          >
            Open the {program.name} portal ↗
          </a>
        ) : (
          <p style={{ ...datum, color: fg, opacity: 0.9, margin: 0 }}>
            The {program.name} portal link isn&rsquo;t set yet.
          </p>
        )}
      </section>

      <nav style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
        {tabs.map((t) => {
          const on = t.key === here;
          return (
            <Link
              key={t.key}
              href={`/school/programs/${program.slug}${t.key === "overview" ? "" : `?tab=${t.key}`}`}
              style={{
                fontFamily: F.ui, fontSize: "15px", fontWeight: 600,
                color: on ? C.white : C.ink,
                backgroundColor: on ? C.ink : "transparent",
                borderRadius: R.button, padding: "0 16px", minHeight: "44px",
                display: "inline-flex", alignItems: "center", textDecoration: "none",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {here === "overview" && (
        <div className="joc-two-col">
          <div style={{ minWidth: 0 }}>
            {settingUp ? (
              <NextStep
                stage={stage}
                step={step}
                since={enrollment.stageSince}
                programName={program.name}
                upcoming={upcoming.length}
              />
            ) : (
              <Running
                upcoming={upcoming}
                reports={reports}
                canReadReports={canReadReports}
                programName={program.name}
              />
            )}

            {program.slug === "joc-app" && <SchoolAppPanel schoolId={schoolId} />}
          </div>

          <aside style={{ minWidth: 0, display: "grid", gap: "10px", alignContent: "start" }}>
            <Card title="At your school">
              <p style={{ ...body, margin: 0 }}>
                {teachers.length > 0
                  ? `${teachers.length} ${teachers.length === 1 ? "person has" : "people have"} a login here.`
                  : "Nobody has a login here yet."}
              </p>
              <p style={{ ...body, margin: "6px 0 0", color: ambassadors > 0 ? C.muted : C.orangeText }}>
                {ambassadors > 0
                  ? `${ambassadors} ambassador${ambassadors === 1 ? "" : "s"} running it.`
                  : "No ambassador is down as running it."}
              </p>
            </Card>

            <Card title="At JOC">
              <p style={{ ...body, margin: "0 0 12px", color: coordinator ? C.muted : C.orangeText }}>
                {coordinator
                  ? `${coordinator} looks after ${program.name}.`
                  : "Nobody is down as running this program yet."}
              </p>
              <AskCoordinator programId={program.id} coordinator={firstName} />
            </Card>

            {/* What the school pays is for whoever runs the account. A teacher
                looking after the app has no business seeing it. */}
            {runsAccount && payment && (
              <Card title="This year">
                <PaymentLine payment={payment} />
              </Card>
            )}
          </aside>
        </div>
      )}

      {here === "dates" && <Dates upcoming={upcoming} settingUp={settingUp} />}

      {here === "write-ups" && (
        <WriteUps reports={reports} canReadReports={canReadReports} />
      )}

      {here === "people" && (
        <People teachers={teachers} ambassadors={ambassadors} coordinator={coordinator} />
      )}
    </div>
  );
}

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ ...rowCard, padding: "18px 20px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>{title}</p>
      {children}
    </div>
  );
}

/** 5c: the one thing that happens next, then the whole path. */
function NextStep({
  stage, step, since, programName, upcoming,
}: {
  stage: Stage; step: number; since: Date; programName: string; upcoming: number;
}) {
  const action = STEP_ACTION[step];

  return (
    <>
      <section style={{
        ...rowCard, padding: "22px", borderTop: `4px solid ${C.orange}`, marginBottom: "20px",
      }}>
        <p style={{ ...label, color: C.orangeText, margin: "0 0 8px" }}>Your next step</p>

        <h2 style={{
          fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em",
          color: C.ink, margin: "0 0 10px", lineHeight: 1.25,
        }}>
          {STEP_TITLE[step]}
        </h2>

        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, margin: 0, maxWidth: "56ch" }}>
          {STEP_NEXT[step]}
        </p>

        {action.href && (
          <div style={{ marginTop: "18px" }}>
            <Link href={action.href} style={{ ...primaryButton, textDecoration: "none" }}>
              {action.label}
            </Link>
          </div>
        )}
      </section>

      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Where it has got to</h2>

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "8px" }}>
        {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => {
          const done = n < step;
          const nowHere = n === step;

          return (
            <li
              key={n}
              style={{
                ...rowCard,
                padding: "14px 18px",
                border: nowHere ? `2px solid ${C.orange}` : done ? undefined : `1px dashed ${C.hairline}`,
                boxShadow: done || nowHere ? undefined : "none",
                backgroundColor: done || nowHere ? C.white : "transparent",
                display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap",
              }}
            >
              <span style={{ ...datum, color: done ? C.greenText : nowHere ? C.orangeText : C.muted, minWidth: "68px" }}>
                {done ? `DONE · 0${n}` : nowHere ? "NOW" : `0${n}`}
              </span>

              <span style={{ flex: 1, minWidth: "140px" }}>
                <span style={{
                  display: "block", fontFamily: F.ui, fontSize: "16px",
                  fontWeight: nowHere ? 700 : 500, color: nowHere ? C.ink : C.muted,
                }}>
                  {STEP_TITLE[n]}
                </span>
                <span style={{ ...body, display: "block", fontSize: "14px" }}>
                  {nowHere
                    ? `${STAGE_MEANING[stage]} Since ${shortDay(since)}.`
                    : done
                    ? "Done."
                    : `After ${STEP_TITLE[n - 1].toLowerCase()}.`}
                </span>
              </span>

              <span style={{ ...datum, color: C.muted }}>{STEP_SHORT[n]}</span>
            </li>
          );
        })}
      </ol>

      {/* A locked stage is never a link, so there is nothing to click here. */}
      {upcoming === 0 && (
        <p style={{ ...body, margin: "14px 0 0", maxWidth: "58ch" }}>
          Nothing is on the calendar for {programName} yet. Dates are set once your school is
          trained.
        </p>
      )}
    </>
  );
}

/** 5b: what is coming up, and the last thing anybody wrote. */
function Running({
  upcoming, reports, canReadReports, programName,
}: {
  upcoming: { id: number; title: string; startsAt: Date; location: string | null }[];
  reports: {
    id: string; occurredOn: Date; participants: number | null;
    whatHappened: string; seenBySupervisorAt: Date | null;
  }[];
  canReadReports: boolean;
  programName: string;
}) {
  const next = upcoming[0];
  const latest = reports[0];

  return (
    <>
      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Coming up</h2>

      {next ? (
        <BandRow
          tone="info"
          label="Next run"
          figure={day(next.startsAt)}
          word
          title={next.title}
          line={next.location ? `At ${next.location}.` : "At your school."}
          action={{ label: "See all your dates", href: "?tab=dates" }}
        />
      ) : (
        <p style={{ ...body, margin: "0 0 20px", color: C.orangeText, maxWidth: "58ch" }}>
          Nothing is on the calendar yet. Your coordinator sets the next one with you.
        </p>
      )}

      {canReadReports && (
        <>
          <h2 style={{ ...sectionHeading, margin: "24px 0 12px" }}>Latest write-up</h2>

          {latest ? (
            <article style={{
              ...rowCard, padding: "20px",
              // Unread is a ring rather than a badge: it goes away by being
              // read, and nothing has to be dismissed.
              border: latest.seenBySupervisorAt == null ? `2px solid ${C.blue}` : undefined,
            }}>
              <p style={{ ...datum, margin: "0 0 8px" }}>
                {shortDay(latest.occurredOn).toUpperCase()}
                {latest.participants != null
                  ? ` · ABOUT ${latest.participants} STUDENTS, THEIR ESTIMATE`
                  : " · NOBODY PUT A NUMBER ON IT"}
              </p>

              <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.ink, margin: 0, maxWidth: "58ch" }}>
                {latest.whatHappened.length > 280
                  ? `${latest.whatHappened.slice(0, 280).trimEnd()}…`
                  : latest.whatHappened}
              </p>

              <p style={{ marginTop: "14px" }}>
                <Link href="?tab=write-ups" style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue }}>
                  Read them all
                </Link>
              </p>
            </article>
          ) : (
            <p style={{ ...body, margin: 0, color: C.orangeText, maxWidth: "58ch" }}>
              Nobody has written up a {programName} run yet.
            </p>
          )}
        </>
      )}
    </>
  );
}

function Dates({
  upcoming, settingUp,
}: {
  upcoming: { id: number; title: string; startsAt: Date; location: string | null; audience: string | null }[];
  settingUp: boolean;
}) {
  if (upcoming.length === 0) {
    return (
      <p style={{ ...body, color: C.orangeText, margin: 0, maxWidth: "58ch" }}>
        {settingUp
          ? "Nothing is on the calendar yet. Dates are set once your school is trained."
          : "Nothing is on the calendar yet. Your coordinator sets the next one with you."}
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {upcoming.map((e) => (
        <BandRow
          key={e.id}
          tone="info"
          label="Run"
          figure={day(e.startsAt)}
          word
          title={e.title}
          line={[e.location, e.audience].filter(Boolean).join(" · ") || "At your school."}
        />
      ))}
    </div>
  );
}

function WriteUps({
  reports, canReadReports,
}: {
  reports: {
    id: string; occurredOn: Date; participants: number | null;
    whatHappened: string; seenBySupervisorAt: Date | null;
  }[];
  canReadReports: boolean;
}) {
  if (!canReadReports) {
    return (
      <p style={{ ...body, margin: 0, maxWidth: "58ch" }}>
        Write-ups are written by students and read by the teacher who supervises them.
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <p style={{ ...body, color: C.orangeText, margin: 0, maxWidth: "58ch" }}>
        Nobody has written anything up yet.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {reports.map((r) => (
        <article
          key={r.id}
          style={{
            ...rowCard, padding: "20px",
            border: r.seenBySupervisorAt == null ? `2px solid ${C.blue}` : undefined,
          }}
        >
          <p style={{ ...datum, margin: "0 0 8px" }}>
            {shortDay(r.occurredOn).toUpperCase()}
            {r.participants != null
              ? ` · ABOUT ${r.participants} STUDENTS, THEIR ESTIMATE`
              : " · NOBODY PUT A NUMBER ON IT"}
          </p>
          <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.ink, margin: 0, maxWidth: "58ch" }}>
            {r.whatHappened}
          </p>
        </article>
      ))}
    </div>
  );
}

function People({
  teachers, ambassadors, coordinator,
}: {
  teachers: { id: string; name: string | null; email: string }[];
  ambassadors: number;
  coordinator: string | null;
}) {
  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <Card title="At JOC">
        <p style={{ ...body, margin: 0, color: coordinator ? C.muted : C.orangeText }}>
          {coordinator ?? "Nobody is down as running this program yet."}
        </p>
      </Card>

      <Card title="Ambassadors">
        <p style={{ ...body, margin: 0, color: ambassadors > 0 ? C.muted : C.orangeText }}>
          {ambassadors > 0
            ? `${ambassadors} student${ambassadors === 1 ? "" : "s"} run${ambassadors === 1 ? "s" : ""} it. Their names are on your ambassadors page, where their supervising teacher can see them.`
            : "No ambassador is down as running it."}
        </p>
      </Card>

      <Card title="With a login here">
        {teachers.length === 0 ? (
          <p style={{ ...body, margin: 0, color: C.orangeText }}>Nobody has a login here yet.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "6px" }}>
            {teachers.map((t) => (
              <li key={t.id} style={{ ...body, margin: 0, color: C.ink }}>
                {t.name ?? t.email}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PaymentLine({ payment }: { payment: Awaited<ReturnType<typeof schoolPaymentFor>> }) {
  switch (payment.state) {
    case "paid":
      return (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.greenText }}>Paid</strong> · {money(payment.amountCents)} on{" "}
          {shortDay(payment.at)}.
        </p>
      );
    case "granted":
      return (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.greenText }}>Granted</strong> · {payment.kind}, agreed{" "}
          {shortDay(payment.at)}.
        </p>
      );
    case "in-plan":
      return (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.ink }}>In your plan</strong> · your {payment.plan} covers this
          and {payment.programs - 1} other programs.
        </p>
      );
    case "refunded":
      return (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.redText }}>Refunded</strong> · {money(payment.amountCents)} on{" "}
          {shortDay(payment.at)}.
        </p>
      );
    default:
      return (
        <p style={{ ...body, margin: 0, color: C.orangeText }}>
          Nothing is recorded against this program yet.
        </p>
      );
  }
}
