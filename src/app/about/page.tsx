import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "About — JOC Education" },
  description:
    "JOC Education is the school-facing arm of JustOneChesed — bringing chesed curriculum, programs, and resources to Jewish schools worldwide.",
};

const MILESTONES = [
  { year: "2011", text: "JustOneChesed founded in Brooklyn, New York." },
  { year: "2015", text: "First JOC App launched — students begin logging chesed hours digitally." },
  { year: "2018", text: "JOC Education division established, serving 40 schools in its first year." },
  { year: "2020", text: "Curriculum library expands to 300+ resources during remote learning." },
  { year: "2022", text: "Teachers' Board launched — teachers across 8 countries sharing what actually works." },
  { year: "2023", text: "JOC Center opens in Israel; first student groups visit." },
  { year: "2024", text: "900+ schools served across North America, Israel, and Europe." },
];

const TEAM = [
  { name: "Rabbi Avraham Cohen", role: "Founder & Executive Director", bio: "Founded JustOneChesed after years as a mechanech in Brooklyn yeshivos. Believes every act of chesed begins with seeing the person in front of you." },
  { name: "Devorah Feldman", role: "Director of Education", bio: "Former Jewish studies department head. Built the JOC Education curriculum from its earliest outlines. Author of the JOC Chesed Teacher's Guide." },
  { name: "Moshe Klein", role: "Head of School Partnerships", bio: "Works directly with schools and chesed coordinators across North America and Israel to implement programs that last beyond the first week." },
  { name: "Chaya Stern", role: "Curriculum Developer", bio: "Lesson plan architect and classroom-tested teacher. Writes every lesson plan through the lens of what actually engages a seventh grader at 2pm on a Thursday." },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JOC Education",
    url: "https://education.justonechesed.org",
    description: "JOC Education is the school-facing arm of JustOneChesed — bringing chesed curriculum, programs, and resources to Jewish schools worldwide.",
    foundingDate: "2018",
    parentOrganization: { "@type": "Organization", name: "JustOneChesed", url: "https://justonechesed.org" },
    numberOfEmployees: { "@type": "QuantitativeValue", value: 10 },
    areaServed: ["North America", "Israel", "Europe"],
    knowsAbout: ["chesed education", "Jewish day school curriculum", "character education"],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Hero */}
      <div style={{ backgroundColor: "#10233F", padding: "68px 26px 60px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#F7941D", marginBottom: "14px" }}>ABOUT JOC EDUCATION</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(34px, 4.5vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#fff", maxWidth: "18ch", marginBottom: "20px" }}>
            Chesed is a skill. We teach it.
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,.72)", lineHeight: 1.65, maxWidth: "58ch", fontFamily: "var(--font-newsreader)", fontStyle: "italic" }}>
            JOC Education is the school-facing arm of JustOneChesed — bringing curriculum, programs, and resources to Jewish schools worldwide.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "60px 26px 80px" }}>

        {/* Mission */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", marginBottom: "72px" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>OUR MISSION</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3vw, 38px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "20px" }}>
              Just One Student at a Time.
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(16,35,63,.72)", lineHeight: 1.7, marginBottom: "18px" }}>
              JustOneChesed was founded on a simple premise: the most meaningful acts of chesed happen between one person and one other person — not as programs, but as choices.
            </p>
            <p style={{ fontSize: "16px", color: "rgba(16,35,63,.72)", lineHeight: 1.7, marginBottom: "18px" }}>
              JOC Education brings that conviction into the classroom. We build lesson plans, resources, and programs that help teachers teach chesed as a skill — something that can be practiced, improved, and carried out of school and into a student's life.
            </p>
            <p style={{ fontSize: "16px", color: "rgba(16,35,63,.72)", lineHeight: 1.7 }}>
              We serve over 900 schools across North America, Israel, and Europe. Every tool we build is field-tested by real teachers in real classrooms before it reaches the library.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { number: "900+", label: "Schools served", sub: "Across North America, Israel, and Europe" },
              { number: "460+", label: "Classroom resources", sub: "Lesson plans, worksheets, videos, and source sheets" },
              { number: "12+", label: "Years of JOC", sub: "Founded 2011. Still growing." },
              { number: "1M+", label: "Chesed hours logged", sub: "By students in the JOC App" },
            ].map((stat) => (
              <div key={stat.number} style={{ backgroundColor: "#F4F7FD", borderRadius: "18px", padding: "22px 24px", display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "32px", letterSpacing: "-0.04em", color: "#1E47B8", minWidth: "80px" }}>{stat.number}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15.5px", color: "#10233F", marginBottom: "3px" }}>{stat.label}</div>
                  <div style={{ fontSize: "13px", color: "rgba(16,35,63,.55)" }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: "72px" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>OUR HISTORY</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 34px)", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "32px" }}>
            More than a decade of chesed education.
          </h2>
          <div style={{ position: "relative", paddingLeft: "28px", borderLeft: "2px solid rgba(16,35,63,.12)" }}>
            {MILESTONES.map((m, i) => (
              <div key={m.year} style={{ position: "relative", marginBottom: i < MILESTONES.length - 1 ? "28px" : 0 }}>
                <div style={{ position: "absolute", left: "-37px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#1E47B8", border: "3px solid #F4F7FD" }} />
                <span style={{ fontWeight: 700, fontSize: "12px", letterSpacing: "0.1em", color: "#1E47B8", display: "block", marginBottom: "4px" }}>{m.year}</span>
                <p style={{ fontSize: "15.5px", color: "#10233F", lineHeight: 1.55, margin: 0 }}>{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div style={{ marginBottom: "72px" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>THE TEAM</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 34px)", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "32px" }}>
            Built by educators, for educators.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {TEAM.map((person) => (
              <div key={person.name} style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "26px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "#F4F7FD", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "22px" }}>👤</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "4px" }}>{person.name}</h3>
                <p style={{ fontWeight: 600, fontSize: "12.5px", color: "#1E47B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>{person.role}</p>
                <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6 }}>{person.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ backgroundColor: "#1E47B8", borderRadius: "26px", padding: "48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "28px" }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "10px" }}>Bring JOC to your school.</h2>
            <p style={{ fontSize: "15.5px", color: "rgba(255,255,255,.72)", maxWidth: "52ch", lineHeight: 1.55 }}>
              Most schools start with JOC App + JOC Education. Get up and running in under a week.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/pricing" style={{ backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
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
