import fs from "node:fs";

/**
 * Rebuild the body of the program page.
 *
 * The path used to appear twice — once as a step bar lifted over the hero and
 * once as "How it works" — and the description appeared twice as well, in the
 * hero and again under "About the program". The page now says each thing
 * once: the path, then the video beside what is in the box.
 *
 * A one-off. Kept only so the diff is explicable.
 */

const path = "src/app/programs/[slug]/page.tsx";
const raw = fs.readFileSync(path, "utf8");
const crlf = raw.includes("\r\n");
const s = crlf ? raw.split("\r\n").join("\n") : raw;

const start = s.indexOf(`        <div className="joc-program-grid">`);
const endMarker = `      {/* ── Other programs`;
const end = s.indexOf(endMarker);
if (start === -1 || end === -1) throw new Error("could not find the body block");

// Everything between the grid and "Other programs", replaced.
const tail = s.slice(start, end);
const closing = tail.lastIndexOf("</div>\n      </div>\n\n");
if (closing === -1) throw new Error("could not find the end of the body block");

const BODY = `        {/* The path, once. */}
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
`;

const TESTIMONIAL = `
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

`;

const rebuilt = s.slice(0, start) + BODY + TESTIMONIAL + s.slice(end);
fs.writeFileSync(path, crlf ? rebuilt.split("\n").join("\r\n") : rebuilt);
console.log("program body rebuilt");
