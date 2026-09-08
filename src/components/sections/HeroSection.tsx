import Link from "next/link";

export function HeroSection() {
  return (
    <section style={{ padding: "36px 26px 8px", maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "32px", alignItems: "start" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Eligibility pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(16,35,63,.15)", borderRadius: "9999px", padding: "8px 16px", width: "fit-content", backgroundColor: "#fff" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#F7941D", flexShrink: 0 }} />
            <span style={{ fontWeight: 500, fontSize: "14px", color: "#10233F" }}>For schools, rebbeim and morahs</span>
          </div>

          {/* H1 */}
          <h1 style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "clamp(23px, 3.1vw, 40px)", lineHeight: 1.12, letterSpacing: "-0.035em", margin: 0 }}>
            <span style={{ display: "block", whiteSpace: "nowrap", color: "#10233F" }}>Educating Towards Chesed</span>
            <span style={{ display: "block", whiteSpace: "nowrap", color: "#1E47B8" }}>Just One Student at a Time</span>
          </h1>

          {/* Body */}
          <p style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1.6, color: "rgba(16,35,63,.75)", maxWidth: "47ch", margin: 0 }}>
            Lesson plans, classroom resources, and chesed programs built for Jewish day schools and yeshivos. Everything a rebbe or morah needs, in one place.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/lesson-plans" style={{ display: "inline-block", backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 24px", textDecoration: "none" }}>
              Browse lesson plans
            </Link>
            <Link href="/#programs" style={{ display: "inline-block", border: "1.5px solid #10233F", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 24px", textDecoration: "none" }}>
              See the four tiers
            </Link>
          </div>
        </div>

        {/* Right — stats cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Stats card */}
          <div style={{ backgroundColor: "#1E47B8", borderRadius: "24px", padding: "20px 24px", color: "#fff" }}>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFC98A", marginBottom: "16px" }}>THIS SCHOOL YEAR</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: "28px", lineHeight: 1, marginBottom: "4px" }}>140,392</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,.7)" }}>chesed hours</p>
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "28px", lineHeight: 1, marginBottom: "4px" }}>312</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,.7)" }}>partner schools</p>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: "8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,.26)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "62%", backgroundColor: "#F7941D", borderRadius: "4px" }} />
            </div>
          </div>

          {/* Elul card */}
          <div style={{ backgroundColor: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid rgba(16,35,63,.1)" }}>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "8px" }}>ELUL PREP KIT</p>
            <p style={{ fontWeight: 700, fontSize: "19px", color: "#10233F", marginBottom: "8px" }}>Chesed Before the Yom Tov Rush</p>
            <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", marginBottom: "16px", lineHeight: 1.55 }}>
              Five ready-to-run lessons on hakaras hatov, achdus, and siyum chesed projects — perfect for Elul.
            </p>
            <span style={{ display: "inline-block", backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "13.5px", borderRadius: "9999px", padding: "10px 20px", cursor: "pointer" }}>
              Open kit
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
