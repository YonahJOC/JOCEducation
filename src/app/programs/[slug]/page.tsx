import Link from "next/link";
import { C, F, label } from "@/lib/joc-tokens";
import { notFound } from "next/navigation";
import { getPublishedProgram, getPublishedPrograms } from "@/lib/content";
import { heroFg, deepFrom } from "@/lib/hero-color";
import { Stages } from "@/components/programs/Stages";
import { PromoVideo } from "@/components/programs/PromoVideo";
import { NextStep } from "@/components/programs/NextStep";
import { myStepOn } from "@/lib/program-step";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };


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

  // Where this visitor's school has got to, if they are signed in and their
  // school is on it. Null covers a visitor, somebody with no school, and a
  // school this program has not reached — one state, not three.
  const mine = await myStepOn(slug);
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

      {/* ── Hero: what it is on the left, what to do about it on the right ── */}
      <div style={{ backgroundColor: program.heroColor, color: fg, padding: "44px 26px 52px" }}>
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

          <div className="joc-program-hero">
            <div style={{ minWidth: 0 }}>
              <p style={{ ...label, color: fg, opacity: 0.85, margin: "12px 0 14px" }}>
                Program · {program.tag}
                {comingSoon && " · Coming soon"}
              </p>

              <h1 style={{
                fontFamily: F.ui, fontWeight: 700, fontSize: "clamp(40px, 8vw, 84px)", lineHeight: 0.98,
                letterSpacing: "-0.04em", margin: "0 0 16px", textWrap: "balance",
              }}>
                {program.name}
              </h1>

              <p style={{
                fontFamily: F.read, fontStyle: "italic", fontSize: "clamp(20px, 2.6vw, 28px)",
                lineHeight: 1.35, maxWidth: "30ch", margin: "0 0 18px", opacity: 0.92,
              }}>
                {program.tagline}
              </p>

              {/* The description reads here on a wide screen. On a phone it
                  collapses further down, under "What is this?", so the card
                  is reachable without scrolling past three paragraphs. */}
              <p className="joc-program-blurb" style={{
                fontFamily: F.read, fontSize: "19px", lineHeight: 1.6,
                maxWidth: "52ch", margin: "0 0 20px", opacity: 0.9,
              }}>
                {program.description}
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[...program.meta.split("·").map((m) => m.trim()).filter(Boolean), ...program.available.slice(0, 1)].map((fact) => (
                  <span
                    key={fact}
                    style={{
                      ...label, color: fg, border: "1.5px solid currentColor",
                      borderRadius: "9999px", padding: "6px 13px", opacity: 0.9,
                    }}
                  >
                    {fact}
                  </span>
                ))}
              </div>
            </div>

            <div className="joc-program-next" style={{ minWidth: 0 }}>
              <NextStep
                mine={mine}
                formSlug={formSlug}
                comingSoon={comingSoon}
                externalHref={program.externalHref}
                programName={program.name}
                accent={program.heroColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "44px 26px 20px" }}>
        {/* The path, once. */}
        <section id="how" style={{ scrollMarginTop: "20px" }}>
          <p style={{ ...label, color: deep, margin: "0 0 8px" }}>Your path</p>
          <h2 style={{
            fontFamily: F.ui, fontSize: "clamp(26px, 3vw, 34px)", fontWeight: 700,
            letterSpacing: "-0.03em", color: C.ink, margin: "0 0 10px",
          }}>
            How it works
          </h2>
          <p style={{ fontFamily: F.read, fontSize: "18px", color: C.muted, lineHeight: 1.6, margin: "0 0 26px", maxWidth: "56ch" }}>
            The same four stages on every JOC program, so a school that has run one already knows
            how the next one goes.
          </p>
          <Stages
            stages={program.howItWorks}
            formSlug={formSlug}
            comingSoon={comingSoon}
            externalHref={program.externalHref}
            deep={deep}
            currentStep={mine?.step ?? null}
          />
        </section>

        {/* What it is, on a phone. On a wide screen this already read in the
            hero, so it is not repeated there. */}
        <details className="joc-program-what" style={{ marginTop: "34px" }}>
          <summary style={{
            fontFamily: F.ui, fontSize: "18px", fontWeight: 700, color: C.ink,
            cursor: "pointer", minHeight: "44px", display: "flex", alignItems: "center",
          }}>
            What is {program.name}?
          </summary>
          <p style={{ fontFamily: F.read, fontSize: "18px", lineHeight: 1.65, color: C.ink, margin: "10px 0 0" }}>
            {program.description}
          </p>
        </details>

        {/* The video beside what a school actually gets. */}
        <section className="joc-program-box" style={{ marginTop: "44px" }}>
          <div style={{ minWidth: 0 }}>
            <PromoVideo url={program.videoUrl} title={program.name} />
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ ...label, color: deep, margin: "0 0 8px" }}>In the box</p>
            <h2 style={{
              fontFamily: F.ui, fontSize: "clamp(22px, 2.4vw, 28px)", fontWeight: 700,
              letterSpacing: "-0.025em", color: C.ink, margin: "0 0 6px",
            }}>
              What your school gets
            </h2>
            <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: "0 0 18px" }}>
              {comingSoon ? "What it will come with." : "Everything below comes with it."}
            </p>

            {program.whatsIncluded.length === 0 ? (
              <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.6, margin: 0 }}>
                Nobody has written down what comes with this one yet.
              </p>
            ) : (
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "14px" }}>
                {program.whatsIncluded.map((item, i) => (
                  <li key={item} style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: 0 }}>
                    <span style={{ ...label, color: deep, flexShrink: 0, paddingTop: "4px", width: "24px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontFamily: F.read, fontSize: "18px", lineHeight: 1.55, color: C.ink, minWidth: 0 }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <p style={{ marginTop: "20px" }}>
              <Link href="/pricing" style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.blue, textDecoration: "underline", minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
                Which plans include it
              </Link>
            </p>
          </div>
        </section>

        {program.testimonial && (
          <figure style={{ backgroundColor: C.ink, borderRadius: "18px", padding: "clamp(26px, 4vw, 38px)", margin: "48px 0 0" }}>
            <span aria-hidden="true" style={{ display: "block", fontFamily: F.read, fontSize: "54px", lineHeight: 0.6, color: C.orange }}>
              &ldquo;
            </span>
            <blockquote style={{ margin: "14px 0 18px" }}>
              <p style={{
                fontFamily: F.read, fontStyle: "italic",
                fontSize: "clamp(22px, 2.6vw, 30px)", lineHeight: 1.4, color: C.white,
                margin: 0, maxWidth: "34ch",
              }}>
                {program.testimonial.quote}
              </p>
            </blockquote>
            <figcaption style={{ fontSize: "14px", color: "#C6CFF0", lineHeight: 1.5 }}>
              <Attribution value={program.testimonial.attribution} />
            </figcaption>
          </figure>
        )}
      </div>

      {/* ── Other programs ───────────────────────────────────────────── */}
      {others.length > 0 && (
        <div style={{ backgroundColor: C.panel, marginTop: "56px", padding: "48px 26px 56px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(22px, 2.6vw, 27px)", fontWeight: 600, letterSpacing: "-0.03em", color: C.ink, margin: "0 0 5px" }}>
              Other JOC programs
            </h2>
            <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 24px" }}>
              Most schools run three or four a year.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "12px" }}>
              {others.map((p) => (
                <Link
                  key={p.slug}
                  href={`/programs/${p.slug}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", minHeight: "72px",
                    backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "12px",
                    padding: "12px 16px 12px 12px", textDecoration: "none", minWidth: 0,
                  }}
                >
                  <span aria-hidden="true" style={{ width: "14px", height: "40px", borderRadius: "4px", backgroundColor: p.heroColor, flexShrink: 0 }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: "15px", fontWeight: 600, color: C.ink, letterSpacing: "-0.01em" }}>
                      {p.name}
                    </span>
                    <span style={{ display: "block", fontSize: "12.5px", color: C.muted, marginTop: "2px" }}>
                      {p.tag}{p.comingSoon ? " · Coming soon" : ""}
                    </span>
                  </span>
                  <span aria-hidden="true" style={{ color: C.blue, fontWeight: 600, flexShrink: 0 }}>→</span>
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
      <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted }}>
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
