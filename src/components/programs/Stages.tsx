import Link from "next/link";

/**
 * The four stages of bringing a program to a school.
 *
 * Every program runs the same way — meet, register, train, launch — so this
 * is drawn as one journey rather than four separate boxes. Four boxes said
 * "here are four facts". A rail with the stages strung along it says "this is
 * where you are and this is what happens next", which is the actual question
 * a principal has.
 *
 * Each stage can carry the one thing to do there, so the page is not a
 * description of a process with the process kept somewhere else.
 */

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const ORANGE_TEXT = "#C96C00";

export type Stage = {
  step: string;
  title: string;
  description: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
};

/**
 * `{form}` in a stage's address means this program's own sign-up form, so the
 * four stages are the same four rows for every program and adding one does
 * not mean editing a URL.
 *
 * While that form is still a draft it falls back to pricing, which is where
 * the Register button went before forms existed. A school reading stage two
 * needs somewhere to go; a stage that quietly loses its button while the
 * others keep theirs reads as though the process is broken.
 */
export function resolveStageUrl(url: string | null | undefined, formSlug: string | null): string | null {
  if (!url) return null;
  if (url.trim() === "{form}") return formSlug ? `/forms/${formSlug}` : "/pricing";
  return url.trim() || null;
}

export function Stages({ stages, formSlug }: { stages: Stage[]; formSlug: string | null }) {
  if (stages.length === 0) return null;

  return (
    <div
      className="joc-stages"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`,
        gap: "0",
        marginBottom: "52px",
      }}
    >
      {stages.map((s, i) => {
        const href = resolveStageUrl(s.linkUrl, formSlug);
        const last = i === stages.length - 1;
        return (
          <div key={s.step || i} className="joc-stage" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* The rail: a line through the numbers, broken after the last. */}
            <div className="joc-stage-rail" style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "14px" }}>
              <span
                style={{
                  width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: last ? ORANGE : BLUE,
                  color: last ? INK : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "13.5px", letterSpacing: "0.02em",
                }}
              >
                {s.step}
              </span>
              {!last && (
                <span
                  className="joc-stage-line"
                  style={{ flex: 1, height: "2px", backgroundColor: "rgba(45,70,175,.22)" }}
                />
              )}
            </div>

            <div className="joc-stage-body" style={{ paddingRight: last ? 0 : "22px", flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontWeight: 700, fontSize: "16.5px", color: INK, margin: "0 0 7px", lineHeight: 1.3 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, margin: 0 }}>
                {s.description}
              </p>
              {href && s.linkLabel && (
                <StageLink href={href} label={s.linkLabel} emphasis={last} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StageLink({ href, label, emphasis }: { href: string; label: string; emphasis: boolean }) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", alignSelf: "flex-start", gap: "6px",
    // Pushed to the bottom so the four buttons line up however long the
    // descriptions above them run.
    marginTop: "auto", paddingTop: "14px", fontWeight: 700, fontSize: "13.5px",
    color: emphasis ? ORANGE_TEXT : BLUE, textDecoration: "none",
    minHeight: "40px",
  };
  const body = (
    <>
      {label}
      <span aria-hidden="true">→</span>
    </>
  );

  // mailto and anything off-site go out as a plain anchor; Link is for routes.
  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    const external = /^https?:/i.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={style}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} style={style}>
      {body}
    </Link>
  );
}
