import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProgram, getPublishedPrograms } from "@/lib/content";
import { heroFg, deepFrom } from "@/lib/hero-color";
import { Stages } from "@/components/programs/Stages";
import { StepBar } from "@/components/programs/StepBar";
import { PromoVideo } from "@/components/programs/PromoVideo";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

const INK = "#10233F";
const BLUE = "#2D46AF";
const PAPER = "#FBF9F4";
const PANEL = "#F4F7FD";
const MUTED = "#4A5872";
const BODY2 = "#34445E";
const HAIRLINE = "rgba(16,35,63,.1)";

// Programs are editable in the console, so the set of addresses is not known
// at build time.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getPublishedProgram(slug);
  if (!program) return {};
  return {
    title: { absolute: `${program.name} — JOC Education` },
    description: program.description,
    openGraph: { title: `${program.name} — JOC Education`, description: program.description },
  };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const all = await getPublishedPrograms();
  const program = all.find((p) => p.slug === slug);
  if (!program) notFound();
  const others = all.filter((p) => p.slug !== slug);

  // The hero colour is chosen per program in the console, so the text on it
  // and the accents drawn from it are both worked out rather than assumed.
  const fg = heroFg(program.heroColor);
  const deep = deepFrom(program.heroColor);
  const comingSoon = Boolean(program.comingSoon);
  const formSlug = program.formSlug ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: program.name,
    description: program.description,
    organizer: { "@type": "Organization", name: "JOC Education", url: "https://education.justonechesed.org" },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: comingSoon ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled",
    audience: { "@type": "Audience", audienceType: "Jewish day school students and teachers" },
  };

  return (
    <div className="joc-program">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: program.heroColor, color: fg, padding: "44px 26px 104px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Link
            href="/programs"
            style={{
              color: fg, fontSize: "14px", fontWeight: 500, textDecoration: "underline",
              textUnderlineOffset: "3px", minHeight: "44px", display: "inline-flex", alignItems: "center",
              opacity: 0.86,
            }}
          >
            ← All programs
          </Link>

          <div style={{ display: "flex", gap: "9px", alignItems: "center", flexWrap: "wrap", margin: "12px 0 16px" }}>
            <span style={{
              border: "1.5px solid currentColor", borderRadius: "9999px", padding: "4px 13px",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              {program.tag}
            </span>
            {comingSoon && (
              <span style={{
                backgroundColor: PAPER, color: INK, borderRadius: "9999px", padding: "5px 14px",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              }}>
                Coming soon
              </span>
            )}
          </div>

          <h1 style={{
            fontWeight: 600, fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1.03,
            letterSpacing: "-0.035em", margin: "0 0 14px", textWrap: "balance",
          }}>
            {program.name}
          </h1>
          <p style={{
            fontFamily: "var(--font-newsreader)", fontStyle: "italic", fontSize: "clamp(18px, 2.4vw, 22px)",
            lineHeight: 1.45, maxWidth: "36ch", margin: 0, opacity: 0.88,
          }}>
            {program.tagline}
          </p>
        </div>
      </div>

      {/* ── Step bar, lifted over the hero ───────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "-72px auto 0", padding: "0 26px", position: "relative" }}>
        <StepBar
          stages={program.howItWorks}
          formSlug={formSlug}
          comingSoon={comingSoon}
          externalHref={program.externalHref}
        />
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "44px 26px 20px" }}>
        <div className="joc-program-grid">

          {/* Intro: video, then the description */}
          <div style={{ gridArea: "intro", minWidth: 0 }}>
            <PromoVideo url={program.videoUrl} title={program.name} />
            <SectionLabel deep={deep}>About the program</SectionLabel>
            <p style={{ fontSize: "clamp(18px, 1.6vw, 20px)", lineHeight: 1.6, color: BODY2, margin: 0, maxWidth: "62ch" }}>
              {program.description}
            </p>
          </div>

          {/* Sidebar */}
          <aside className="joc-program-side" style={{ gridArea: "side", minWidth: 0 }}>
            <div style={{
              backgroundColor: "#fff", border: `1px solid ${HAIRLINE}`, borderTop: `6px solid ${deep}`,
              borderRadius: "14px", padding: "22px", marginBottom: "14px",
            }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "baseline", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap" }}>
                <p style={{ fontSize: "16px", fontWeight: 600, color: INK, margin: 0, letterSpacing: "-0.015em" }}>
                  At a glance
                </p>
                <span style={{
                  border: `1.5px solid ${HAIRLINE}`, color: MUTED, borderRadius: "9999px", padding: "3px 10px",
                  fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  {program.tag}
                </span>
              </div>

              <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: "0 0 10px" }}>
                {comingSoon ? "Will be included in" : "Included in"}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "grid", gap: "9px" }}>
                {program.available.map((a) => (
                  <li key={a} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", color: INK, lineHeight: 1.45, minWidth: 0 }}>
                    {/* A ringed tick, so inclusion is not carried by colour alone. */}
                    <span aria-hidden="true" style={{
                      width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                      border: `1.5px solid ${deep}`, color: deep,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700, marginTop: "1px",
                    }}>
                      ✓
                    </span>
                    <span style={{ minWidth: 0 }}>{a}</span>
                  </li>
                ))}
              </ul>

              <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: "14px" }}>
                <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 10px", lineHeight: 1.5 }}>{program.meta}</p>
                <Link href="/pricing" style={{ fontSize: "14px", fontWeight: 600, color: BLUE, textDecoration: "none", minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
                  See all plans →
                </Link>
              </div>
            </div>

            {program.whatsIncluded.length > 0 && (
              <div style={{ backgroundColor: PANEL, borderRadius: "14px", padding: "22px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: "0 0 12px" }}>
                  What&rsquo;s included
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "10px" }}>
                  {program.whatsIncluded.map((item, i) => (
                    <li key={i} style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "14px", color: BODY2, lineHeight: 1.5, minWidth: 0 }}>
                      <span aria-hidden="true" style={{ width: "8px", height: "2px", backgroundColor: INK, flexShrink: 0, marginTop: "10px", opacity: 0.55 }} />
                      <span style={{ minWidth: 0 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* The rest of the article */}
          <div style={{ gridArea: "rest", minWidth: 0 }}>
            <section id="how" style={{ scrollMarginTop: "20px", paddingTop: "34px" }}>
              <SectionLabel deep={deep}>How it works</SectionLabel>
              <p style={{ fontSize: "15.5px", color: MUTED, lineHeight: 1.6, margin: "0 0 24px", maxWidth: "58ch" }}>
                The same four stages on every JOC program, so a school that has run one already
                knows how the next one goes.
              </p>
              <Stages
                stages={program.howItWorks}
                formSlug={formSlug}
                comingSoon={comingSoon}
                externalHref={program.externalHref}
                deep={deep}
              />
            </section>

            {program.testimonial && (
              <figure style={{ backgroundColor: INK, borderRadius: "18px", padding: "clamp(26px, 4vw, 38px)", margin: "42px 0 0" }}>
                <span aria-hidden="true" style={{ display: "block", fontFamily: "var(--font-newsreader)", fontSize: "54px", lineHeight: 0.6, color: "#FA912D" }}>
                  &ldquo;
                </span>
                <blockquote style={{ margin: "14px 0 18px" }}>
                  <p style={{
                    fontFamily: "var(--font-newsreader)", fontStyle: "italic",
                    fontSize: "clamp(22px, 2.6vw, 30px)", lineHeight: 1.4, color: "#fff",
                    margin: 0, maxWidth: "34ch",
                  }}>
                    {program.testimonial.quote}
                  </p>
                </blockquote>
                <figcaption style={{ fontSize: "14px", color: "#C3CCDD", lineHeight: 1.5 }}>
                  <Attribution value={program.testimonial.attribution} />
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>

      {/* ── Other programs ───────────────────────────────────────────── */}
      {others.length > 0 && (
        <div style={{ backgroundColor: PANEL, marginTop: "56px", padding: "48px 26px 56px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(22px, 2.6vw, 27px)", fontWeight: 600, letterSpacing: "-0.03em", color: INK, margin: "0 0 5px" }}>
              Other JOC programs
            </h2>
            <p style={{ fontSize: "15px", color: MUTED, margin: "0 0 24px" }}>
              Most schools run three or four a year.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "12px" }}>
              {others.map((p) => (
                <Link
                  key={p.slug}
                  href={`/programs/${p.slug}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", minHeight: "72px",
                    backgroundColor: "#fff", border: `1px solid ${HAIRLINE}`, borderRadius: "12px",
                    padding: "12px 16px 12px 12px", textDecoration: "none", minWidth: 0,
                  }}
                >
                  <span aria-hidden="true" style={{ width: "14px", height: "40px", borderRadius: "4px", backgroundColor: p.heroColor, flexShrink: 0 }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: "15px", fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>
                      {p.name}
                    </span>
                    <span style={{ display: "block", fontSize: "12.5px", color: MUTED, marginTop: "2px" }}>
                      {p.tag}{p.comingSoon ? " · Coming soon" : ""}
                    </span>
                  </span>
                  <span aria-hidden="true" style={{ color: BLUE, fontWeight: 600, flexShrink: 0 }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** An uppercase label with a short rule in the hero's colour, carrying it down. */
function SectionLabel({ children, deep }: { children: React.ReactNode; deep: string }) {
  return (
    <p style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0 0 14px" }}>
      <span aria-hidden="true" style={{ width: "24px", height: "3px", backgroundColor: deep, flexShrink: 0, borderRadius: "2px" }} />
      <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>
        {children}
      </span>
    </p>
  );
}

/**
 * The attribution is one free-text line typed by staff — "Rabbi X, Principal
 * at Y" or just a school. Split on the first comma or dash so the name reads
 * as the name, and show it whole when there is nothing to split.
 */
function Attribution({ value }: { value: string }) {
  const m = /^(.+?)\s*[,—–-]\s*(.+)$/.exec(value.trim());
  if (!m) return <span style={{ fontWeight: 600, color: "#fff" }}>{value}</span>;
  return (
    <>
      <span style={{ fontWeight: 600, color: "#fff" }}>{m[1]}</span>
      <span style={{ display: "block", marginTop: "2px" }}>{m[2]}</span>
    </>
  );
}
