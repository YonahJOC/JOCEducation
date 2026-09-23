import Link from "next/link";
import { resolveStageUrl, type Stage } from "@/lib/stages";

/**
 * The four stages of bringing a program into a school.
 *
 * A vertical path at every width, not four columns. Four columns read as four
 * facts standing side by side; a path reads as an order, which is what a
 * school actually needs to know — where they are and what happens next.
 *
 * The same four on every program. That sameness is the point: a school that
 * has run one program already knows how the next one goes.
 */

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const PAPER = "#FBF9F4";
const MUTED = "#4A5A74";
const BODY2 = "#34445E";
const HAIRLINE = "rgba(16,35,63,.1)";
const LOCKED = "#8793A6";

/** Fixed by position, not by content — they label the path, not the copy. */
const SHORT = ["Meeting", "Register", "Training", "Launch"];

export const stageShort = (i: number) => SHORT[i] ?? `Step ${i + 1}`;

/** The stage that sends a school to the sign-up form. */
export const isRegisterStage = (s: Stage) => (s.linkUrl ?? "").trim() === "{form}";

export type StageLink = {
  href: string | null;
  external: boolean;
  /** Said under the button when the destination is not what the label implies. */
  note: string | null;
  locked: boolean;
};

/**
 * Where a stage's button goes, and what the school should be told about it.
 *
 * Three cases the label alone cannot carry: the program runs on another JOC
 * site, the sign-up form is not live yet, and the whole program has not opened.
 * Each one gets said in words rather than left for someone to discover.
 */
export function stageLink(
  stage: Stage,
  i: number,
  { formSlug, comingSoon, externalHref }: { formSlug: string | null; comingSoon: boolean; externalHref?: string | null },
): StageLink {
  // Nothing past the meeting is open before the program launches.
  if (comingSoon && i > 0) return { href: null, external: false, note: null, locked: true };

  const register = isRegisterStage(stage);

  if (register && externalHref) {
    let host = "";
    try { host = new URL(externalHref).hostname.replace(/^www\./, ""); } catch { host = "another site"; }
    return { href: externalHref, external: true, note: `Opens ${host} in a new tab`, locked: false };
  }

  if (register && !formSlug) {
    return { href: "/pricing", external: false, note: "Takes you to plans & pricing for now", locked: false };
  }

  const href = resolveStageUrl(stage.linkUrl, formSlug);
  return { href, external: /^https?:/i.test(href ?? ""), note: null, locked: false };
}

export function Stages({
  stages, formSlug, comingSoon = false, externalHref, deep,
}: {
  stages: Stage[];
  formSlug: string | null;
  comingSoon?: boolean;
  externalHref?: string | null;
  /** The hero colour carried down the page. */
  deep: string;
}) {
  if (stages.length === 0) return null;

  return (
    <ol className="joc-stages" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {stages.map((s, i) => {
        const last = i === stages.length - 1;
        const link = stageLink(s, i, { formSlug, comingSoon, externalHref: externalHref ?? null });
        const primary = comingSoon ? i === 0 : isRegisterStage(s);

        return (
          <li key={s.step || i} id={`step-${i + 1}`} className="joc-stage">
            {/* The rail: node, then a line down to the next one. */}
            <div className="joc-stage-node-col">
              <span
                className="joc-stage-node"
                style={{
                  // Locked beats last: a filled orange "you made it" node on a
                  // stage that cannot be reached yet says two opposite things.
                  backgroundColor: last && !link.locked ? ORANGE : PAPER,
                  color: link.locked ? MUTED : INK,
                  border: link.locked
                    ? `2px dashed ${LOCKED}`
                    : last
                    ? `2px solid ${ORANGE}`
                    : `2px solid ${INK}`,
                }}
              >
                {s.step}
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className="joc-stage-rail"
                  style={{ backgroundColor: deep }}
                />
              )}
            </div>

            <div className="joc-stage-card">
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 5px", fontWeight: 500 }}>
                  Step {s.step} of {stages.length} · {stageShort(i)}
                </p>
                <h3 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.015em", color: INK, margin: "0 0 7px", lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "15.5px", color: BODY2, lineHeight: 1.6, margin: 0, maxWidth: "56ch" }}>
                  {s.description}
                </p>
              </div>

              {s.linkLabel && (
                <div className="joc-stage-action">
                  <StageButton link={link} label={s.linkLabel} primary={primary} />
                  {link.note && (
                    <p style={{ fontSize: "12.5px", color: MUTED, margin: "8px 0 0", lineHeight: 1.45 }}>
                      {link.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StageButton({ link, label, primary }: { link: StageLink; label: string; primary: boolean }) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
    minHeight: "48px", padding: "12px 20px", borderRadius: "10px",
    fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "15px",
    textDecoration: "none", boxSizing: "border-box", width: "100%",
  };

  // Announced but not open. A dead link would be worse than a plain statement.
  if (link.locked || !link.href) {
    return (
      <span
        aria-disabled="true"
        style={{
          ...base,
          border: `1.5px dashed ${LOCKED}`,
          color: MUTED,
          backgroundColor: "transparent",
          cursor: "default",
        }}
      >
        Opens at launch
      </span>
    );
  }

  const style: React.CSSProperties = primary
    ? { ...base, backgroundColor: BLUE, color: "#fff", border: `1.5px solid ${BLUE}` }
    : { ...base, backgroundColor: "transparent", color: INK, border: `1.5px solid ${INK}` };

  const body = (
    <>
      {label}
      <span aria-hidden="true">{link.external ? "↗" : "→"}</span>
    </>
  );

  if (link.external || /^(mailto:|tel:)/i.test(link.href)) {
    const away = /^https?:/i.test(link.href);
    return (
      <a href={link.href} {...(away ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={style}>
        {body}
      </a>
    );
  }
  return (
    <Link href={link.href} style={style}>
      {body}
    </Link>
  );
}
