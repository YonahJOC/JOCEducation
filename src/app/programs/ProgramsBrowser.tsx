import Link from "next/link";
import type { Program } from "@/lib/programs";
import { siteContent } from "@/lib/site-content";
import { sectionHeading, label, C, R } from "@/lib/joc-tokens";


export async function ProgramsBrowser({ programs: PROGRAMS }: { programs: Program[] }) {
  // The wording here is editable at /admin/site -> Programs page.
  const c = await siteContent("programs");

  return (
    <div>
      {/* Hero */}
      <div style={{ backgroundColor: C.ink, padding: "64px 26px 56px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <p style={{ ...label, color: C.orange, marginBottom: "12px" }}>CHESED PROGRAMS</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: C.white, maxWidth: "16ch", marginBottom: "18px" }}>
            {c.text("hero.headline", "Chesed your school can actually run.")}
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,.7)", lineHeight: 1.6, maxWidth: "52ch" }}>
            {c.text(
              "hero.intro",
              "Organized chesed programs your school can register for. JOC handles the logistics; your students do the chesed."
            )}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "52px 26px 0" }}>
        {/* JOC Programs */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ ...label, color: C.orangeText, marginBottom: "10px" }}>JOC-ORGANIZED PROGRAMS</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 38px)", lineHeight: 1.06, letterSpacing: "-0.03em", color: C.ink, marginBottom: "8px" }}>
            Programs JOC runs for your school.
          </h2>
          <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, maxWidth: "60ch", marginBottom: "32px" }}>
            {c.text(
              "list.intro",
              "Each one is run by JOC — we bring the materials, the training and the logistics. Availability depends on your subscription level."
            )}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
            {PROGRAMS.map((p) => (
              <div key={p.slug} style={{ backgroundColor: C.white, borderRadius: "22px", border: `1px solid ${C.hairline}`, padding: "26px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ backgroundColor: C.panel, color: C.blue, ...label, borderRadius: R.chip, padding: "4px 12px" }}>{p.tag}</span>
                  {p.comingSoon && (
                    <span style={{ backgroundColor: "rgba(250,145,45,.16)", color: C.orangeText, ...label, borderRadius: R.chip, padding: "4px 12px" }}>Coming soon</span>
                  )}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "21px", color: C.ink, marginBottom: "10px" }}>{p.name}</h3>
                <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, marginBottom: "12px", flex: 1 }}>{p.description}</p>
                <p style={{ fontSize: "13px", color: C.orangeText, fontWeight: 600, marginBottom: "20px" }}>{p.meta}</p>
                <div style={{ fontSize: "13px", color: C.muted, marginBottom: "20px" }}>
                  <span style={{ fontWeight: 600 }}>Included with: </span>{p.available.join(", ")}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link href={`/programs/${p.slug}`} style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: C.panel, color: C.ink, fontWeight: 600, fontSize: "15px", borderRadius: R.chip, padding: "10px 16px", textDecoration: "none" }}>
                    {p.comingSoon ? "Read more" : "Learn more"}
                  </Link>
                  {/* Same order as the program's own page: its own sign-up
                      form first, then another JOC site, then pricing. A card
                      that said Register while the page said Sign up would be
                      two answers to the same question. */}
                  {p.comingSoon ? null : p.formSlug ? (
                    <Link href={`/forms/${p.formSlug}`} style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "10px 16px", textDecoration: "none" }}>
                      Sign up
                    </Link>
                  ) : p.external ? (
                    <a href={p.externalHref} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: C.orange, color: C.ink, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "10px 16px", textDecoration: "none" }}>
                      Visit ↗
                    </a>
                  ) : (
                    <Link href="/pricing" style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "10px 16px", textDecoration: "none" }}>
                      Register
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA band */}
        <div style={{ backgroundColor: C.blue, borderRadius: "26px", padding: "44px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px", marginBottom: "40px" }}>
          <div>
            <h2 style={{ ...sectionHeading, color: C.white, marginBottom: "8px" }}>Ready to bring JOC to your school?</h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,.72)", maxWidth: "52ch", lineHeight: 1.55 }}>
              Most schools start with JOC App + JOC Education. Choose your plan and you're up and running within a week.
            </p>
          </div>
          <Link href="/pricing" style={{ backgroundColor: C.orange, color: C.ink, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
            See pricing →
          </Link>
        </div>
      </div>
    </div>
  );
}
