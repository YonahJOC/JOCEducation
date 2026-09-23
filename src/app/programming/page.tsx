import type { Metadata } from "next";
import { C } from "@/lib/joc-tokens";
import Link from "next/link";
import {
  getUpcomingEvents, getPastEvents, formatEventDate, type PublicEvent,
} from "@/lib/events";
import { getRunningCycle } from "@/lib/cycle-data";
import { safeAuth } from "@/auth";
import { isInternal } from "@/lib/access";

const WIDTH = "1180px";

export const metadata: Metadata = {
  // The root layout appends "— JOC Education"; spelling it out here too gave
  // "Calendar — JOC Education — JOC Education".
  title: "Calendar",
  description:
    "What Just One Chesed is running, and when. The calendar of chesed programs across our partner schools.",
};

/** Group by month so a year reads as a year rather than a list. */
function byMonth(events: PublicEvent[]): { label: string; events: PublicEvent[] }[] {
  const out: { label: string; events: PublicEvent[] }[] = [];
  for (const e of events) {
    const label = e.startsAt.toLocaleDateString("en-US", {
      month: "long", year: "numeric", timeZone: "UTC",
    });
    const last = out[out.length - 1];
    if (last && last.label === label) last.events.push(e);
    else out.push({ label, events: [e] });
  }
  return out;
}

function EventRow({ e }: { e: PublicEvent }) {
  const cancelled = e.status === "CANCELLED";
  return (
    <div
      style={{
        display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap",
        padding: "18px 0", borderTop: `1px solid ${C.hairline}`,
        opacity: cancelled ? 0.6 : 1,
      }}
    >
      <div style={{ flex: "0 0 108px", minWidth: "108px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: e.programColor ?? C.blue, margin: 0, letterSpacing: "-0.01em" }}>
          {formatEventDate(e.startsAt, e.endsAt)}
        </p>
        {cancelled && (
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3261A", margin: "3px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Cancelled
          </p>
        )}
      </div>

      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <p style={{ fontSize: "17px", fontWeight: 700, color: C.ink, margin: "0 0 4px", letterSpacing: "-0.02em", textDecoration: cancelled ? "line-through" : "none" }}>
          {e.title}
        </p>
        <p style={{ fontSize: "15px", color: "#4A5A74", margin: "0 0 8px" }}>
          {[e.schoolName ?? (e.kind === "JOC_EVENT" ? "Open to every school" : null), e.audience, e.location]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {e.detail && (
          <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "#4A5A74", margin: 0, maxWidth: "62ch" }}>
            {e.detail}
          </p>
        )}
        {e.programSlug && (
          <Link
            href={`/programs/${e.programSlug}`}
            style={{ display: "inline-block", fontSize: "15px", fontWeight: 600, color: C.blue, textDecoration: "none", marginTop: "8px" }}
          >
            About {e.programName} →
          </Link>
        )}
      </div>
    </div>
  );
}

function Months({ months }: { months: { label: string; events: PublicEvent[] }[] }) {
  return (
    <>
      {months.map((m) => (
        <div key={m.label} style={{ marginBottom: "34px" }}>
          <h3 style={{ fontWeight: 800, fontSize: "13px", letterSpacing: "0.04em", textTransform: "uppercase", color: "#4A5A74", margin: "0 0 4px" }}>
            {m.label}
          </h3>
          {m.events.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </div>
      ))}
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#fff", border: `1px dashed ${C.hairline}`, borderRadius: "18px", padding: "32px 26px" }}>
      <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "#4A5A74", margin: 0, maxWidth: "52ch" }}>
        {children}
      </p>
    </div>
  );
}

export default async function ProgrammingPage() {
  const [jocEvents, allSchoolPrograms, past, cycle, session] = await Promise.all([
    getUpcomingEvents("JOC_EVENT"),
    getUpcomingEvents("SCHOOL_PROGRAM"),
    getPastEvents(undefined, 12),
    getRunningCycle(),
    safeAuth(),
  ]);

  // A teacher wants their own school's programs, not a list of forty schools'.
  // JOC's own people see every school, because that is their job.
  const mySchoolId = session?.user?.schoolId ?? null;
  const seesEverySchool = isInternal(session?.user) || !mySchoolId;
  const schoolPrograms = seesEverySchool
    ? allSchoolPrograms
    : allSchoolPrograms.filter((e) => e.schoolId === mySchoolId);

  const jocMonths = byMonth(jocEvents);
  const schoolMonths = byMonth(schoolPrograms);

  return (
    <div style={{ backgroundColor: C.paper, minHeight: "70vh" }}>
      <section style={{ maxWidth: WIDTH, margin: "0 auto", padding: "52px 26px 20px" }}>
        <p style={{ fontWeight: 700, fontSize: "12px", letterSpacing: "0.22em", textTransform: "uppercase", color: C.orangeText, margin: "0 0 12px" }}>
          Calendar
        </p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4.6vw, 46px)", lineHeight: 1.06, letterSpacing: "-0.04em", color: C.ink, margin: "0 0 16px", maxWidth: "18ch" }}>
          What we are running, and when.
        </h1>
        <p style={{ fontSize: "17px", lineHeight: 1.65, color: "#4A5A74", margin: "0 0 10px", maxWidth: "58ch" }}>
          The Chesed Cycles say what every school is learning this month. This is what is actually
          happening — the booths, the bake sales, the trips and the collections, across the whole
          network.
        </p>
        {cycle && (
          <p style={{ fontSize: "14.5px", color: "#4A5A74", margin: 0 }}>
            Running now: <strong style={{ color: C.ink }}>{cycle.theme}</strong> · {cycle.range}
          </p>
        )}
      </section>

      <section style={{ maxWidth: WIDTH, margin: "0 auto", padding: "22px 26px 60px" }}>
        {/* Two lists, deliberately separate. A JOC program runs across the
            whole network; a school program is one program at one school, and
            there will be far more of those. Mixed together, the second drowns
            the first. */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "-0.03em", color: C.ink, margin: "0 0 4px" }}>
            JOC programs
          </h2>
          <p style={{ fontSize: "14.5px", color: "#4A5A74", margin: "0 0 14px" }}>
            Across the whole network — open to every school.
          </p>
          {jocMonths.length === 0 ? (
            <Empty>
              Nothing on the network calendar yet. In the meantime,{" "}
              <Link href="/programs" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>
                see what JOC runs for schools
              </Link>
              .
            </Empty>
          ) : (
            <Months months={jocMonths} />
          )}
        </div>

        <div style={{ paddingTop: "34px", borderTop: `2px solid ${C.hairline}` }}>
          <h2 style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "-0.03em", color: C.ink, margin: "0 0 4px" }}>
            {seesEverySchool ? "Programs at schools" : "Running at your school"}
          </h2>
          <p style={{ fontSize: "14.5px", color: "#4A5A74", margin: "0 0 14px" }}>
            {seesEverySchool
              ? "Each program, at each school that is running it."
              : "What your school has on this year."}
          </p>
          {schoolMonths.length === 0 ? (
            <Empty>
              {seesEverySchool
                ? "No school programs scheduled yet."
                : "Nothing scheduled at your school yet. Your JOC contact can add it."}
            </Empty>
          ) : (
            <Months months={schoolMonths} />
          )}
        </div>

        {past.length > 0 && (
          <div style={{ marginTop: "46px", paddingTop: "30px", borderTop: `2px solid ${C.hairline}` }}>
            <h2 style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: C.ink, margin: "0 0 4px" }}>
              Already run
            </h2>
            <p style={{ fontSize: "14.5px", color: "#4A5A74", margin: "0 0 10px" }}>
              What the network has done this year.
            </p>
            {past.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
