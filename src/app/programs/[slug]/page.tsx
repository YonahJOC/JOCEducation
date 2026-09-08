import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramBySlug, PROGRAMS } from "@/lib/programs";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) return {};
  return {
    title: { absolute: `${program.name} — JOC Education` },
    description: program.description,
    openGraph: { title: `${program.name} — JOC Education`, description: program.description },
  };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const tagColors: Record<string, { bg: string; text: string }> = {
    Event:    { bg: "#EAF0FD", text: "#1E47B8" },
    Ongoing:  { bg: "#FDEEDA", text: "#9A5405" },
    Platform: { bg: "#F4F7FD", text: "#10233F" },
    "One-time": { bg: "#E8F5EE", text: "#1B7F4B" },
    Trip:     { bg: "#F3ECFD", text: "#6B2FA0" },
  };
  const tc = tagColors[program.tag] ?? { bg: "#F4F7FD", text: "#10233F" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: program.name,
    description: program.description,
    organizer: { "@type": "Organization", name: "JOC Education", url: "https://education.justonechesed.org" },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: program.available ? "https://schema.org/EventScheduled" : "https://schema.org/EventPostponed",
    audience: { "@type": "Audience", audienceType: "Jewish day school students and teachers" },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Hero */}
      <div style={{ backgroundColor: program.heroColor, padding: "60px 26px 52px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
            <Link href="/programs" style={{ fontSize: "14px", color: "rgba(255,255,255,.65)", textDecoration: "none", fontWeight: 500 }}>
              ← All programs
            </Link>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,.35)" }}>·</span>
            <span style={{ backgroundColor: "rgba(255,255,255,.15)", color: "#fff", fontWeight: 700, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 12px" }}>
              {program.tag}
            </span>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(34px, 4.5vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#fff", marginBottom: "14px" }}>
            {program.name}
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,.78)", lineHeight: 1.55, maxWidth: "56ch", fontFamily: "var(--font-newsreader)", fontStyle: "italic" }}>
            {program.tagline}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 26px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "52px", alignItems: "start" }}>

          {/* Main content */}
          <div>
            {/* About */}
            <p style={{ fontSize: "17.5px", color: "rgba(16,35,63,.85)", lineHeight: 1.65, marginBottom: "44px" }}>
              {program.description}
            </p>

            {/* How it works */}
            <h2 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "28px" }}>
              How it works
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "52px" }}>
              {program.howItWorks.map((s) => (
                <div
                  key={s.step}
                  style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "24px 26px", display: "flex", gap: "20px" }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", backgroundColor: "#F4F7FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: "12px", color: "#1E47B8", letterSpacing: "0.05em" }}>{s.step}</span>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "6px" }}>{s.title}</h3>
                    <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, margin: 0 }}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            {program.testimonial && (
              <div style={{ backgroundColor: "#10233F", borderRadius: "22px", padding: "34px", marginBottom: "52px" }}>
                <blockquote style={{ margin: 0 }}>
                  <p style={{ fontSize: "18px", color: "#fff", lineHeight: 1.65, fontFamily: "var(--font-newsreader)", fontStyle: "italic", marginBottom: "18px" }}>
                    "{program.testimonial.quote}"
                  </p>
                  <footer style={{ fontSize: "13px", color: "rgba(255,255,255,.55)", fontWeight: 500 }}>
                    — {program.testimonial.attribution}
                  </footer>
                </blockquote>
              </div>
            )}

            {/* Other programs */}
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#10233F", marginBottom: "16px" }}>
                Other programs
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {PROGRAMS.filter((p) => p.slug !== program.slug).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/programs/${p.slug}`}
                    style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.12)", borderRadius: "12px", padding: "12px 18px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "3px" }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "14.5px", color: "#10233F" }}>{p.name}</span>
                    <span style={{ fontSize: "12px", color: "#C96C00", fontWeight: 600 }}>{p.tag}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ position: "sticky", top: "88px" }}>
            {/* Register card */}
            <div style={{ backgroundColor: "#fff", borderRadius: "22px", border: "1px solid rgba(16,35,63,.12)", padding: "28px", marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ backgroundColor: tc.bg, color: tc.text, fontWeight: 700, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 12px" }}>
                  {program.tag}
                </span>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", marginBottom: "4px" }}>Available with</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {program.available.map((a) => (
                    <li key={a} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "5px 0", fontSize: "13.5px", color: "#10233F" }}>
                      <span style={{ color: "#1B7F4B", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", marginBottom: "16px" }}>{program.meta}</p>
              {program.external ? (
                <a
                  href={program.externalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", textAlign: "center", backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 20px", textDecoration: "none", marginBottom: "10px" }}
                >
                  {program.cta} ↗
                </a>
              ) : (
                <Link
                  href="/pricing"
                  style={{ display: "block", textAlign: "center", backgroundColor: "#1E47B8", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 20px", textDecoration: "none", marginBottom: "10px" }}
                >
                  {program.cta}
                </Link>
              )}
              <Link href="/pricing" style={{ display: "block", textAlign: "center", fontSize: "13.5px", color: "rgba(16,35,63,.55)", textDecoration: "none", fontWeight: 500 }}>
                See all plans →
              </Link>
            </div>

            {/* What's included */}
            <div style={{ backgroundColor: "#F4F7FD", borderRadius: "22px", padding: "24px" }}>
              <p style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#10233F", marginBottom: "14px" }}>WHAT'S INCLUDED</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {program.whatsIncluded.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 0", borderBottom: i < program.whatsIncluded.length - 1 ? "1px solid rgba(16,35,63,.08)" : "none", fontSize: "13.5px", color: "#10233F", lineHeight: 1.5 }}>
                    <span style={{ color: "#F7941D", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
