import Link from "next/link";
import type { Metadata } from "next";
import { siteContent, type RepeatItem } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: "About — JOC Education" },
  description:
    "JOC Education is the school-facing arm of JustOneChesed — bringing chesed curriculum, programs, and resources to Jewish schools worldwide.",
};

/**
 * Every claim on this page is editable at /admin/site.
 *
 * The figures, the history and the staff list were placeholder text — invented
 * people with invented biographies, and numbers nobody had counted. They are
 * empty until someone enters something true, and each section hides itself
 * while it has nothing to show.
 */
export default async function AboutPage() {
  const c = await siteContent("about");

  const headline = c.text("hero.headline", "Chesed is a skill. We teach it.");
  const standfirst = c.text(
    "hero.standfirst",
    "JOC Education is the school-facing arm of JustOneChesed — bringing curriculum, programs, and resources to Jewish schools worldwide."
  );
  const missionHeading = c.text("mission.heading", "Just One Student at a Time.");
  const missionBody = c
    .text(
      "mission.body",
      "JustOneChesed was founded on a simple premise: the most meaningful acts of chesed happen between one person and one other person — not as programs, but as choices.\nJOC Education brings that conviction into the classroom. We build lesson plans, resources, and programs that help teachers teach chesed as a skill — something that can be practiced, improved, and carried out of school and into a student's life."
    )
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const stats = c.list<RepeatItem>("mission.stats", []);
  const milestones = c.list<RepeatItem>("history.items", []);
  const team = c.list<RepeatItem>("team.members", []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JOC Education",
    url: "https://education.justonechesed.org",
    description:
      "JOC Education is the school-facing arm of JustOneChesed — bringing chesed curriculum, programs, and resources to Jewish schools worldwide.",
    parentOrganization: { "@type": "Organization", name: "JustOneChesed", url: "https://justonechesed.org" },
    knowsAbout: ["chesed education", "Jewish day school curriculum", "character education"],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <div style={{ backgroundColor: "#10233F", padding: "68px 26px 60px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#FA912D", marginBottom: "14px" }}>ABOUT JOC EDUCATION</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(34px, 4.5vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#fff", maxWidth: "18ch", marginBottom: "20px" }}>
            {headline}
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,.72)", lineHeight: 1.65, maxWidth: "58ch", fontFamily: "var(--font-newsreader)", fontStyle: "italic" }}>
            {standfirst}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "60px 26px 80px" }}>

        {/* Mission */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: stats.length > 0 ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr",
            gap: "48px",
            marginBottom: "72px",
          }}
        >
          <div style={{ maxWidth: stats.length > 0 ? undefined : "70ch" }}>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>OUR MISSION</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3vw, 38px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "20px" }}>
              {missionHeading}
            </h2>
            {missionBody.map((p, i) => (
              <p key={i} style={{ fontSize: "16px", color: "rgba(16,35,63,.72)", lineHeight: 1.7, marginBottom: "18px" }}>{p}</p>
            ))}
          </div>

          {stats.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {stats.map((stat, i) => (
                <div key={i} style={{ backgroundColor: "#F4F7FD", borderRadius: "18px", padding: "22px 24px", display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: "32px", letterSpacing: "-0.04em", color: "#2D46AF", minWidth: "80px" }}>{stat.value}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15.5px", color: "#10233F", marginBottom: "3px" }}>{stat.title}</div>
                    <div style={{ fontSize: "13px", color: "rgba(16,35,63,.55)" }}>{stat.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {milestones.length > 0 && (
          <div style={{ marginBottom: "72px" }}>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>OUR HISTORY</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 34px)", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "32px" }}>
              How JOC got here.
            </h2>
            <div style={{ position: "relative", paddingLeft: "28px", borderLeft: "2px solid rgba(16,35,63,.12)" }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ position: "relative", marginBottom: i < milestones.length - 1 ? "28px" : 0 }}>
                  <div style={{ position: "absolute", left: "-37px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#2D46AF", border: "3px solid #F4F7FD" }} />
                  <span style={{ fontWeight: 700, fontSize: "12px", letterSpacing: "0.1em", color: "#2D46AF", display: "block", marginBottom: "4px" }}>{m.value}</span>
                  <p style={{ fontSize: "15.5px", color: "#10233F", lineHeight: 1.55, margin: 0 }}>{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team */}
        {team.length > 0 && (
          <div style={{ marginBottom: "72px" }}>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>THE TEAM</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 34px)", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "32px" }}>
              Built by educators, for educators.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {team.map((person, i) => (
                <div key={i} style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "26px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "#F4F7FD", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "22px" }}>👤</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "4px" }}>{person.title}</h3>
                  <p style={{ fontWeight: 600, fontSize: "12.5px", color: "#2D46AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>{person.value}</p>
                  <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6 }}>{person.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ backgroundColor: "#2D46AF", borderRadius: "26px", padding: "48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "28px" }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "10px" }}>Bring JOC to your school.</h2>
            <p style={{ fontSize: "15.5px", color: "rgba(255,255,255,.72)", maxWidth: "52ch", lineHeight: 1.55 }}>
              Tell us how your year is structured and we will say honestly which programs fit around it.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/pricing" style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
              See pricing →
            </Link>
            <Link href="/contact" style={{ backgroundColor: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 600, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
              Talk to us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
