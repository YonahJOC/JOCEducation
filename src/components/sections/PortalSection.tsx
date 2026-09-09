import Link from "next/link";

const PROGRAMS = [
  { key: "kindness-booth", name: "Kindness Booth", description: "A JOC-branded station your school sets up at a community event. Students run it, giving out small acts of kindness. JOC provides the full kit, training, and promotional materials.", meta: "Half-day setup · All grade levels", cta: "Register your school", href: "#" },
  { key: "joc-app", name: "JOC App", description: "The student app for logging chesed hours, completing chesed challenges, and tracking school-wide impact. Integrates directly with the school dashboard.", meta: "iOS + Android · Student + teacher views", cta: "Set up for your school", href: "#" },
  { key: "bake", name: "Bake for Chesed", description: "Students bake and deliver goods to local families, hospitals, or shelters. JOC handles placement partnerships and provides the full program guide.", meta: "Monthly cycles · Any scale", cta: "Register your school", href: "#" },
  { key: "tutor", name: "Just One Tutor", description: "Peer tutoring with a chesed framing. Older students tutor younger ones — JOC provides matching, training, and tracking tools.", meta: "In-school or cross-school", cta: "Register your school", href: "#" },
  { key: "chesed-match", name: "Chesed Match", description: "Connects your students to vetted community chesed opportunities — elderly companions, hospital visits, food distribution, and more.", meta: "Links to chesedmatch.org", cta: "Visit Chesed Match", href: "https://chesedmatch.org", external: true },
];

export function PortalSection() {
  return (
    <section style={{ backgroundColor: "#10233F", padding: "66px 26px 56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#FA912D", marginBottom: "12px" }}>07 — JOC PROGRAM PORTAL</p>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#fff", marginBottom: "32px" }}>
          JOC programs for your school.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))", gap: "18px" }}>
          {PROGRAMS.map((p) => (
            <div key={p.key} style={{ backgroundColor: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.16)", borderRadius: "22px", padding: "26px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontWeight: 700, fontSize: "21.5px", color: "#fff", marginBottom: "10px" }}>{p.name}</h3>
              <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,.7)", lineHeight: 1.6, marginBottom: "12px", flex: 1 }}>{p.description}</p>
              <p style={{ fontSize: "13px", color: "#FFB55E", fontWeight: 500, marginBottom: "20px" }}>{p.meta}</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link
                  href={p.href}
                  target={(p as any).external ? "_blank" : undefined}
                  rel={(p as any).external ? "noopener noreferrer" : undefined}
                  style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "11px 20px", textDecoration: "none" }}
                >
                  {p.cta}
                </Link>
                {!(p as any).external && (
                  <Link href={`/portal#${p.key}`} style={{ color: "rgba(255,255,255,.7)", fontWeight: 500, fontSize: "14px", textDecoration: "none", padding: "11px 4px" }}>
                    More info
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
