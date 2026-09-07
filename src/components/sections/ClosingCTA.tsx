import Link from "next/link";

export function ClosingCTA() {
  return (
    <section style={{ padding: "66px 26px 40px", maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "26px", padding: "44px", border: "1px solid rgba(16,35,63,.1)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px", alignItems: "center" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>GET STARTED</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.1, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "20px" }}>Not sure where to start?</h2>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.72)", marginBottom: "24px", lineHeight: 1.6 }}>
            Talk to our team. We'll match your school with the right program and get your teachers set up.
          </p>
          <Link href="/pricing" style={{ display: "inline-block", backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none" }}>
            Bring JOC to your school
          </Link>
        </div>
        <div style={{ backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "28px" }}>
          <p style={{ fontFamily: "var(--font-newsreader)", fontStyle: "italic", fontSize: "17px", lineHeight: 1.6, color: "rgba(16,35,63,.82)", marginBottom: "12px" }}>
            "Within three weeks, every teacher in the building had a chesed lesson plan they could actually use. The students started noticing kindness in places they'd never looked before."
          </p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#10233F" }}>— Chesed Coordinator, Brooklyn day school</p>
        </div>
      </div>
    </section>
  );
}
