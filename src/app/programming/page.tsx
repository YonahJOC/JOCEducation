import type { Metadata } from "next";
import Link from "next/link";
import {
  getUpcomingEvents, getPastEvents, formatEventDate, type PublicEvent,
} from "@/lib/events";
import { getRunningCycle } from "@/lib/cycle-data";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE_TEXT = "#C96C00";
const PAPER = "#FBF9F4";
const RULE = "rgba(16,35,63,.12)";
const WIDTH = "1180px";

export const metadata: Metadata = {
  // The root layout appends "— JOC Education"; spelling it out here too gave
  // "Programming — JOC Education — JOC Education".
  title: "Programming",
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
        padding: "18px 0", borderTop: `1px solid ${RULE}`,
        opacity: cancelled ? 0.6 : 1,
      }}
    >
      <div style={{ flex: "0 0 108px", minWidth: "108px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: e.programColor ?? BLUE, margin: 0, letterSpacing: "-0.01em" }}>
          {formatEventDate(e.startsAt, e.endsAt)}
        </p>
        {cancelled && (
          <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#B8321E", margin: "3px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Cancelled
          </p>
        )}
      </div>

      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <p style={{ fontSize: "17px", fontWeight: 700, color: INK, margin: "0 0 4px", letterSpacing: "-0.02em", textDecoration: cancelled ? "line-through" : "none" }}>
          {e.title}
        </p>
        <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)", margin: "0 0 8px" }}>
          {[e.schoolName ?? "Open to every school", e.audience, e.location]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {e.detail && (
          <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.75)", margin: 0, maxWidth: "62ch" }}>
            {e.detail}
          </p>
        )}
        {e.programSlug && (
          <Link
            href={`/programs/${e.programSlug}`}
            style={{ display: "inline-block", fontSize: "13.5px", fontWeight: 600, color: BLUE, textDecoration: "none", marginTop: "8px" }}
          >
            About {e.programName} →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function ProgrammingPage() {
  const [upcoming, past, cycle] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(12),
    getRunningCycle(),
  ]);

  const months = byMonth(upcoming);

  return (
    <div style={{ backgroundColor: PAPER, minHeight: "70vh" }}>
      <section style={{ maxWidth: WIDTH, margin: "0 auto", padding: "52px 26px 20px" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT, margin: "0 0 12px" }}>
          Programming
        </p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4.6vw, 46px)", lineHeight: 1.06, letterSpacing: "-0.04em", color: INK, margin: "0 0 16px", maxWidth: "18ch" }}>
          What we are running, and when.
        </h1>
        <p style={{ fontSize: "17px", lineHeight: 1.65, color: "rgba(16,35,63,.72)", margin: "0 0 10px", maxWidth: "58ch" }}>
          The Chesed Cycles say what every school is learning this month. This is what is actually
          happening — the booths, the bake sales, the trips and the collections, across the whole
          network.
        </p>
        {cycle && (
          <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.6)", margin: 0 }}>
            Running now: <strong style={{ color: INK }}>{cycle.theme}</strong> · {cycle.range}
          </p>
        )}
      </section>

      <section style={{ maxWidth: WIDTH, margin: "0 auto", padding: "22px 26px 60px" }}>
        {months.length === 0 ? (
          <div style={{ backgroundColor: "#fff", border: `1px dashed ${RULE}`, borderRadius: "18px", padding: "44px 26px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: INK, margin: "0 0 6px" }}>
              Nothing on the calendar yet.
            </p>
            <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.6)", margin: 0, maxWidth: "46ch", marginInline: "auto" }}>
              The programming team is putting this year together. In the meantime,{" "}
              <Link href="/programs" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>
                see what JOC runs for schools
              </Link>
              .
            </p>
          </div>
        ) : (
          months.map((m) => (
            <div key={m.label} style={{ marginBottom: "38px" }}>
              <h2 style={{ fontWeight: 800, fontSize: "13px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(16,35,63,.45)", margin: "0 0 4px" }}>
                {m.label}
              </h2>
              {m.events.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </div>
          ))
        )}

        {past.length > 0 && (
          <div style={{ marginTop: "46px", paddingTop: "30px", borderTop: `2px solid ${RULE}` }}>
            <h2 style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
              Already run
            </h2>
            <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.6)", margin: "0 0 10px" }}>
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
