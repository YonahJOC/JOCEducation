"use client";

import Link from "next/link";
import { STRIPE_COLORS } from "@/lib/lessons";
import type { PublicLesson } from "@/lib/content";

const GRADE_LABELS: Record<string, string> = { es: "Elementary school", ms: "Middle school", hs: "High school" };

/**
 * The lesson itself. Everything shown here comes from the server — this
 * component only handles the interactive bits (downloads, copy link).
 */
export function LessonDetail({ lesson, related, canDownload }: { lesson: PublicLesson; related: PublicLesson[]; canDownload: boolean }) {
  const colorIndex = (lesson.id - 1) % STRIPE_COLORS.length;
  const stripeColor = STRIPE_COLORS[colorIndex];
  const prepStyle = lesson.prep === "Minimal"
    ? { bg: "#F4F7FD", text: "#12306F" }
    : lesson.prep === "Moderate"
    ? { bg: "#FDEEDA", text: "#9A5405" }
    : { bg: "#FEE2E2", text: "#991B1B" };


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: lesson.title,
    description: lesson.description,
    provider: { "@type": "Organization", name: "JOC Education", url: "https://education.justonechesed.org" },
    educationalLevel: GRADE_LABELS[lesson.grade],
    timeRequired: `PT${lesson.time}M`,
    teaches: lesson.objectives,
    keywords: ["chesed", "Jewish education", lesson.theme],
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 26px 72px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Color accent bar */}
      <div style={{ height: "5px", backgroundColor: stripeColor, marginBottom: "36px" }} />

      {/* Back nav */}
      <Link
        href="/lesson-plans"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgba(16,35,63,.6)", fontSize: "14px", fontWeight: 600, textDecoration: "none", marginBottom: "28px" }}
      >
        ← Lesson Plans
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "48px" }}>
        {/* Main content */}
        <div>
          {/* Theme pill */}
          <span style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#2D46AF", fontWeight: 700, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: "9999px", padding: "6px 14px", marginBottom: "14px" }}>
            {lesson.theme}
          </span>

          <h1 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "16px" }}>
            {lesson.title}
          </h1>

          {/* Meta */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
            <MetaChip label={GRADE_LABELS[lesson.grade]} style={{ backgroundColor: "#F4F7FD", color: "#12306F" }} />
            <MetaChip label={`${lesson.time} min`} style={{ backgroundColor: "#F4F7FD", color: "#12306F" }} />
            <MetaChip label={`${lesson.prep} prep`} style={{ backgroundColor: prepStyle.bg, color: prepStyle.text }} />
          </div>

          <p style={{ fontSize: "17px", color: "rgba(16,35,63,.72)", lineHeight: 1.65, marginBottom: "40px", maxWidth: "64ch" }}>
            {lesson.description}
          </p>

          {/* Objectives */}
          <Section title="Learning objectives">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {lesson.objectives.map((obj, i) => (
                <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "15.5px", color: "#10233F", lineHeight: 1.55 }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: stripeColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                    <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>{i + 1}</span>
                  </span>
                  {obj}
                </li>
              ))}
            </ul>
          </Section>

          {/* Materials */}
          <Section title="What you'll need">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {lesson.materials.map((m, i) => (
                <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "#10233F", lineHeight: 1.5 }}>
                  <span style={{ color: "#FA912D", flexShrink: 0, fontSize: "16px", marginTop: "1px" }}>•</span>
                  {m}
                </li>
              ))}
            </ul>
          </Section>

          {/* Lesson steps */}
          <Section title="Lesson flow">
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {lesson.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "20px" }}>
                  {/* Timeline */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "24px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: stripeColor, marginTop: "4px", flexShrink: 0 }} />
                    {i < lesson.steps.length - 1 && <div style={{ width: "2px", flex: 1, backgroundColor: "rgba(16,35,63,.1)", minHeight: "24px" }} />}
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: "24px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "16px", color: "#10233F" }}>{step.title}</span>
                      <span style={{ fontWeight: 600, fontSize: "12.5px", color: stripeColor, backgroundColor: `${stripeColor}18`, padding: "3px 10px", borderRadius: "9999px" }}>{step.duration}</span>
                    </div>
                    <p style={{ fontSize: "15px", color: "rgba(16,35,63,.72)", lineHeight: 1.6, margin: 0 }}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Discussion questions */}
          <Section title="Discussion questions">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {lesson.discussion.map((q, i) => (
                <div key={i} style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: 800, fontSize: "14px", color: stripeColor, flexShrink: 0, marginTop: "2px" }}>Q{i + 1}</span>
                  <p style={{ fontSize: "15.5px", color: "#10233F", lineHeight: 1.55, margin: 0 }}>{q}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Extension */}
          {lesson.extension && (
            <Section title="Extension activity">
              <div style={{ borderLeft: "3px solid #FA912D", paddingLeft: "18px" }}>
                <p style={{ fontSize: "15.5px", color: "#10233F", lineHeight: 1.6, margin: 0 }}>{lesson.extension}</p>
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ alignSelf: "start", position: "sticky", top: "80px" }}>
          {/* Downloads */}
          <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "24px", marginBottom: "20px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#10233F", marginBottom: "16px" }}>
              Downloads ({lesson.files.length} file{lesson.files.length !== 1 ? "s" : ""})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {lesson.files.map((file, i) =>
                canDownload && file.url ? (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "12px", border: "1px solid rgba(16,35,63,.15)", backgroundColor: "#F8FAFE", textDecoration: "none", width: "100%", boxSizing: "border-box" }}
                  >
                    <span style={{ fontSize: "18px" }}>📄</span>
                    <span style={{ fontSize: "13.5px", color: "#10233F", fontWeight: 500 }}>{file.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: "12px", color: "#2D46AF", fontWeight: 600 }}>↓</span>
                  </a>
                ) : (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "12px", border: "1px solid rgba(16,35,63,.12)", backgroundColor: "#F8FAFE" }}
                  >
                    <span style={{ fontSize: "18px", opacity: 0.5 }}>📄</span>
                    <span style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", fontWeight: 500 }}>{file.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: "11.5px", color: "rgba(16,35,63,.45)", fontWeight: 600 }}>
                      {file.url ? "sign in" : "not yet uploaded"}
                    </span>
                  </div>
                )
              )}
            </div>
            {!canDownload && (
              <>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.45)", marginTop: "14px" }}>
                  Sign in with a JOC Education account to download.
                </p>
                <Link
                  href="/login"
                  style={{ display: "block", marginTop: "14px", textAlign: "center", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "10px", padding: "12px", textDecoration: "none" }}
                >
                  Sign in to download
                </Link>
              </>
            )}
          </div>

          {/* Save lesson */}
          <div style={{ backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px" }}>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "#10233F", marginBottom: "8px" }}>Save for later</p>
            <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.62)", lineHeight: 1.5, marginBottom: "14px" }}>Sign in to add this lesson to your saved plans.</p>
            <button
              onClick={() => alert("Sign in to save lessons.")}
              style={{ width: "100%", backgroundColor: "#fff", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "10px", padding: "11px", border: "1px solid rgba(16,35,63,.2)", cursor: "pointer" }}
            >
              ☆ Save this lesson
            </button>
          </div>

          {/* Share lesson */}
          <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "20px 24px" }}>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "#10233F", marginBottom: "10px" }}>Share with a colleague</p>
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
              style={{ width: "100%", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "13.5px", borderRadius: "10px", padding: "11px", border: "none", cursor: "pointer" }}
            >
              Copy link
            </button>
          </div>
        </aside>
      </div>

      {/* Related lessons */}
      {related.length > 0 && (
        <div style={{ marginTop: "64px", borderTop: "1px solid rgba(16,35,63,.1)", paddingTop: "48px" }}>
          <h2 style={{ fontWeight: 700, fontSize: "22px", color: "#10233F", marginBottom: "24px" }}>
            More {GRADE_LABELS[lesson.grade].toLowerCase()} lessons
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {related.map((rel, i) => (
              <Link
                key={rel.id}
                href={`/lesson-plans/${rel.id}`}
                style={{ display: "block", textDecoration: "none", backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden", transition: "border-color .15s, box-shadow .15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2D46AF"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(16,35,63,.09)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(16,35,63,.1)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; }}
              >
                <div style={{ height: "6px", backgroundColor: STRIPE_COLORS[(rel.id - 1) % STRIPE_COLORS.length] }} />
                <div style={{ padding: "18px" }}>
                  <span style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#2D46AF", fontWeight: 700, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 10px", marginBottom: "8px" }}>{rel.theme}</span>
                  <h3 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", lineHeight: 1.25, marginBottom: "6px" }}>{rel.title}</h3>
                  <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", margin: 0 }}>{rel.time} min · {rel.prep} prep</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h2 style={{ fontWeight: 700, fontSize: "19px", letterSpacing: "-0.02em", color: "#10233F", marginBottom: "18px", paddingBottom: "10px", borderBottom: "1px solid rgba(16,35,63,.08)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function MetaChip({ label, style: s }: { label: string; style: React.CSSProperties }) {
  return <span style={{ fontWeight: 600, fontSize: "13px", padding: "6px 12px", borderRadius: "9999px", ...s }}>{label}</span>;
}
