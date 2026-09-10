import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CYCLES, getCurrentCycle, getCycleState, getCurrentWeek } from "@/lib/cycles";
import { isGoogleConfigured, isPasswordConfigured } from "@/auth";
import { siteContent } from "@/lib/site-content";
import { AuthCard } from "@/components/landing/AuthCard";
import { DemoScheduler, type DemoDay } from "@/components/landing/DemoScheduler";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const ORANGE_TEXT = "#C96C00";
const PAPER = "#FBF9F4";
const PANEL = "#F4F7FD";
const RULE = "rgba(16,35,63,.12)";
const WIDTH = "1180px";

/**
 * Fallbacks. Every string below is editable at /admin/site — these are what
 * renders if a field was never edited, or if the database is unreachable.
 */
const CARD_COLORS = [BLUE, ORANGE, "#1B7F4B", "#2C7AC9"];

const FALLBACK_INSIDE = [
  { value: "9", title: "Lesson plans", body: "Objectives, timed steps and discussion questions. Print and teach." },
  { value: "5", title: "Resource library", body: "Source sheets, activities, posters and videos, tagged by grade." },
  { value: "10", title: "Programs for your school", body: "Kindness Booth, Bake for Chesed, Just One Tutor and more — JOC runs the logistics." },
  { value: "∞", title: "Teachers' Board", body: "What rebbeim and morahs at other schools actually ran, and how it went." },
];

const FALLBACK_PROOF = [
  { title: "300+", body: "partner schools" },
  { title: "14,000+", body: "teachers with access" },
  { title: "2.1M", body: "chesed hours logged" },
];

const FALLBACK_BULLETS = [
  { body: "We go through the programs — Kindness Booth, Bake for Chesed, Just One Tutor and the rest — and which ones suit your grades." },
  { body: "You tell us how your year is already structured, and we say honestly which programs fit around it." },
  { body: "We cover what running one costs, including the scholarship route if the budget is tight." },
  { body: "We show you where the teaching platform is up to, so you know what is coming and when." },
];

export const metadata: Metadata = {
  title: "JOC Educators Portal — Educating Towards Chesed",
  description:
    "The front door to JOC Education. Lesson plans, chesed programs and classroom resources for Jewish schools, organised around the Chesed Cycle. Sign in or book a demo.",
  openGraph: {
    title: "JOC Educators Portal",
    description: "Educating Towards Chesed — Just One Student at a Time.",
  },
};

/** Next five school days (Sunday–Thursday), computed server-side to avoid hydration drift. */
function nextSchoolDays(count = 5): DemoDay[] {
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const out: DemoDay[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 5 || d.getDay() === 6) continue; // no Friday or Shabbos
    out.push({
      key: d.toISOString().slice(0, 10),
      weekday: wd[d.getDay()],
      day: String(d.getDate()),
      month: mo[d.getMonth()],
    });
  }
  return out;
}

export default async function EducatorLanding({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string; next?: string }>;
}) {
  const { signin, next } = await searchParams;
  // Only ever an in-site path — never a URL a visitor supplied.
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  // Everything the Education Team can edit at /admin/site, with the current
  // hardcoded wording as the fallback.
  const c = await siteContent("landing");
  const proof = c.list("hero.proof", FALLBACK_PROOF);
  const insideCards = c.list("inside.cards", FALLBACK_INSIDE);
  const demoBullets = c.list("demo.bullets", FALLBACK_BULLETS);
  const cycle = getCurrentCycle();
  const state = getCycleState(cycle);
  const week = getCurrentWeek(cycle);
  const pct = state === "past" ? 100 : state === "upcoming" ? 0 : Math.round((week / cycle.weeks) * 100);
  const days = nextSchoolDays();

  return (
    <div style={{ backgroundColor: PAPER }}>
      {/* 1 — Wayfinding */}
      <div style={{ backgroundColor: PANEL, borderBottom: `1px solid ${RULE}` }}>
        <p
          style={{
            maxWidth: WIDTH, margin: "0 auto", padding: "9px 26px",
            fontSize: "13px", color: "rgba(16,35,63,.72)", textAlign: "center", lineHeight: 1.5,
          }}
        >
          This is the JOC Educators Portal. Looking for the main site?{" "}
          <a
            href="https://justonechesed.org"
            style={{ color: BLUE, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Go to JustOneChesed.org →
          </a>
        </p>
      </div>

      {/* 2 — Header */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          backgroundColor: "rgba(251,249,244,.94)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${RULE}`,
        }}
      >
        <div
          style={{
            maxWidth: WIDTH, margin: "0 auto", padding: "12px 26px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "11px", textDecoration: "none", flexShrink: 0 }}>
            <Image src="/brand/joc-wordmark.png" alt="JustOneChesed" width={168} height={20} priority className="joc-wordmark" style={{ height: "20px", width: "auto" }} />
            <span aria-hidden="true" className="joc-brand-sub" style={{ width: "1px", height: "20px", backgroundColor: RULE }} />
            <span className="joc-brand-sub" style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT }}>
              Education
            </span>
          </Link>

          {/* Same-page anchors only — every other route is gated */}
          <nav className="joc-landing-nav" style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            {[["What's inside", "#inside"], ["The Chesed Cycle", "#cycle"], ["Book a demo", "#demo"]].map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: "14px", fontWeight: 500, color: INK, textDecoration: "none" }}>
                {label}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "9px", flexShrink: 0 }}>
            <a
              href="#auth"
              className="joc-header-signin"
              style={{
                fontSize: "14px", fontWeight: 600, color: INK, textDecoration: "none",
                border: `1.5px solid ${RULE}`, borderRadius: "9999px", padding: "9px 18px",
                display: "inline-flex", alignItems: "center", minHeight: "44px",
              }}
            >
              Sign in
            </a>
            <a
              href="#demo"
              style={{
                fontSize: "14px", fontWeight: 700, color: INK, backgroundColor: ORANGE,
                borderRadius: "9999px", padding: "10px 18px", textDecoration: "none", whiteSpace: "nowrap",
                display: "inline-flex", alignItems: "center", minHeight: "44px",
              }}
            >
              {/* Full wording on desktop; the phone gets something that fits */}
              <span className="joc-cta-long">Bring JOC to your school</span>
              <span className="joc-cta-short">Book a walkthrough</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3 — Hero */}
      <section style={{ maxWidth: WIDTH, margin: "0 auto", padding: "44px 26px 52px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "48px", alignItems: "start" }}>
          {/* Pitch */}
          <div>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "9999px",
                padding: "7px 15px", marginBottom: "22px",
                fontSize: "13.5px", fontWeight: 500, color: INK,
              }}
            >
              <span className="joc-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: ORANGE, flexShrink: 0 }} />
              Cycle {cycle.num} of {CYCLES.length} is running now · week {week} of {cycle.weeks}
            </span>

            <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
              <span style={{ display: "block", color: INK }}>Educating Towards Chesed</span>
              <span style={{ display: "block", color: BLUE }}>Just One Student at a Time</span>
            </h1>

            <p style={{ fontSize: "17.5px", lineHeight: 1.6, color: "rgba(16,35,63,.75)", maxWidth: "46ch", margin: "0 0 22px" }}>
              Lesson plans, classroom resources and chesed programs for Jewish day schools and yeshivos — organised around the
              Chesed Cycle, so the whole school is working on one middah at a time.
            </p>

            {/* The platform is not open to schools yet — say so plainly. */}
            <div
              style={{
                backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px",
                padding: "16px 18px", marginBottom: "26px", maxWidth: "46ch",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: ORANGE_TEXT, margin: "0 0 7px" }}>
                In development
              </p>
              <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.75)", margin: 0 }}>
                The teaching platform is still being built and accounts are not open to schools yet. In the
                meantime, JOC runs 10 chesed programs your school can start this year —{" "}
                <a href="#demo" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>
                  book a walkthrough
                </a>
                .
              </p>
            </div>
          </div>

          <div>
            {nextPath && (
              <div
                role="status"
                style={{
                  backgroundColor: PANEL, border: `1px solid ${RULE}`,
                  borderRadius: "14px", padding: "13px 16px", marginBottom: "12px",
                }}
              >
                <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: INK, margin: 0 }}>
                  Sign in to continue. We&rsquo;ll take you where you were going.
                </p>
              </div>
            )}
            {signin === "no-access" && (
              <div
                role="status"
                style={{
                  backgroundColor: "#FDEEDA", border: "1px solid rgba(154,84,5,.25)",
                  borderRadius: "14px", padding: "13px 16px", marginBottom: "12px",
                }}
              >
                <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#9A5405", margin: 0 }}>
                  <strong>That account isn&rsquo;t attached to a school yet.</strong> Sign in with your school
                  email address, or <a href="#demo" style={{ color: "#9A5405", fontWeight: 700 }}>book a walkthrough</a>.
                </p>
              </div>
            )}
            <AuthCard
              googleEnabled={isGoogleConfigured}
              passwordEnabled={isPasswordConfigured}
              next={nextPath}
            />
          </div>
        </div>
      </section>

      {/* 4 — Chesed Cycle band */}
      <section id="cycle" style={{ backgroundColor: INK, color: "#fff" }}>
        <div style={{ maxWidth: WIDTH, margin: "0 auto", padding: "56px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "44px", alignItems: "start" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE, margin: "0 0 14px" }}>
                This Chesed Cycle · {cycle.hebrew}
              </p>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 8px" }}>
                {cycle.theme}
              </h2>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,.66)", margin: "0 0 26px" }}>{cycle.gloss}</p>
              <p
                style={{
                  fontFamily: "var(--font-newsreader)", fontStyle: "italic",
                  fontSize: "clamp(18px, 2.1vw, 23px)", lineHeight: 1.5,
                  color: "rgba(255,255,255,.94)", borderLeft: `3px solid ${ORANGE}`,
                  paddingLeft: "20px", margin: 0, maxWidth: "34ch",
                }}
              >
                {cycle.question}
              </p>
            </div>

            <div>
              <p style={{ fontSize: "15.5px", lineHeight: 1.65, color: "rgba(255,255,255,.76)", margin: "0 0 24px" }}>
                The JOC year runs as {CYCLES.length} consecutive Cycles, from the first week of school through Shavuos. Each one takes a single
                middah and one guiding question, and every lesson, program and resource for those weeks points at it. The whole school is
                working on the same thing at the same time.
              </p>

              <div style={{ marginBottom: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "rgba(255,255,255,.6)", marginBottom: "8px" }}>
                  <span>Week {week} of {cycle.weeks}</span>
                  <span>{cycle.range}</span>
                </div>
                <div style={{ height: "6px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,.16)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: "9999px", backgroundColor: ORANGE, transition: "width .4s ease" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {CYCLES.map((c) => {
                  const on = c.num === cycle.num;
                  const done = getCycleState(c) === "past";
                  return (
                    <span
                      key={c.slug}
                      style={{
                        fontSize: "12.5px", fontWeight: on ? 700 : 500,
                        padding: "7px 13px", borderRadius: "9999px",
                        backgroundColor: on ? ORANGE : "rgba(255,255,255,.09)",
                        color: on ? INK : done ? "rgba(255,255,255,.42)" : "rgba(255,255,255,.8)",
                        border: on ? "none" : "1px solid rgba(255,255,255,.14)",
                      }}
                    >
                      {c.theme}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — What's inside */}
      <section id="inside" style={{ maxWidth: WIDTH, margin: "0 auto", padding: "62px 26px 20px" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT, margin: "0 0 12px" }}>
          What&rsquo;s inside
        </p>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(27px, 3.4vw, 40px)", lineHeight: 1.07, letterSpacing: "-0.035em", color: INK, margin: "0 0 34px" }}>
          Everything a rebbe or morah needs, in one place.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {insideCards.map((card, i) => {
            const accent = CARD_COLORS[i % CARD_COLORS.length];
            return (
            <div
              key={`${card.title}-${i}`}
              style={{
                backgroundColor: "#fff", border: `1px solid rgba(16,35,63,.09)`,
                borderRadius: "22px", overflow: "hidden", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: "4px", backgroundColor: accent }} />
              <div style={{ padding: "24px" }}>
                <p style={{ fontWeight: 800, fontSize: "30px", letterSpacing: "-0.035em", color: accent, lineHeight: 1, margin: "0 0 12px" }}>
                  {card.value}
                </p>
                <p style={{ fontWeight: 700, fontSize: "16.5px", color: INK, letterSpacing: "-0.02em", margin: "0 0 7px" }}>{card.title}</p>
                <p style={{ fontSize: "14px", lineHeight: 1.55, color: "rgba(16,35,63,.66)", margin: 0 }}>{card.body}</p>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* 6 — Book a demo */}
      <section id="demo" style={{ maxWidth: WIDTH, margin: "0 auto", padding: "62px 26px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", alignItems: "start" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT, margin: "0 0 12px" }}>
              Book a walkthrough
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(27px, 3.4vw, 40px)", lineHeight: 1.07, letterSpacing: "-0.035em", color: INK, margin: "0 0 18px" }}>
              Start a chesed program this year.
            </h2>
            <p style={{ fontSize: "16px", lineHeight: 1.65, color: "rgba(16,35,63,.72)", margin: "0 0 24px", maxWidth: "44ch" }}>
              Twenty minutes with someone from Just One Chesed — not a sales pitch, and not a slide deck.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                "We go through the programs — Kindness Booth, Bake for Chesed, Just One Tutor and the rest — and which ones suit your grades.",
                "You tell us how your year is already structured, and we say honestly which programs fit around it.",
                "We cover what running one costs, including the scholarship route if the budget is tight.",
                "We show you where the teaching platform is up to, so you know what is coming and when.",
              ].map((t) => (
                <li key={t} style={{ display: "flex", gap: "13px", alignItems: "flex-start" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: ORANGE, flexShrink: 0, marginTop: "8px" }} />
                  <span style={{ fontSize: "15px", lineHeight: 1.6, color: INK }}>{t}</span>
                </li>
              ))}
            </ul>

            {/* TODO: replace with a real educator quote, with permission on file. */}
            <p
              style={{
                fontFamily: "var(--font-newsreader)", fontStyle: "italic",
                fontSize: "17px", lineHeight: 1.6, color: "rgba(16,35,63,.78)",
                borderLeft: `3px solid ${ORANGE}`, paddingLeft: "18px", margin: "0 0 26px", maxWidth: "40ch",
              }}
            >
              Chesed stops being an assembly once the whole school is working on the same middah in the same weeks.
            </p>

            <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: 0 }}>
              Would rather just email?{" "}
              <a href="mailto:education@justonechesed.org" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>
                education@justonechesed.org
              </a>
            </p>
          </div>

          <DemoScheduler days={days} />
        </div>
      </section>

      {/* 7 — Footer */}
      <footer style={{ backgroundColor: INK, color: "rgba(255,255,255,.7)" }}>
        <div
          style={{
            maxWidth: WIDTH, margin: "0 auto", padding: "40px 26px",
            display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
            <Image src="/brand/joc-icon-orange.png" alt="" width={30} height={30} style={{ height: "30px", width: "auto" }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: "14.5px", color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                JustOneChesed <span style={{ color: ORANGE, fontWeight: 700 }}>Education</span>
              </p>
              <p style={{ fontSize: "12.5px", margin: "3px 0 0" }}>
                A 501(c)(3) nonprofit organization
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "22px", flexWrap: "wrap", fontSize: "13.5px" }}>
            <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
            <a href="mailto:education@justonechesed.org" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
