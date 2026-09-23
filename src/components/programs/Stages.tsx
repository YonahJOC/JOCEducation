import Link from "next/link";
import { C, F, label } from "@/lib/joc-tokens";
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

const BODY2 = "#34445E";
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
  stages, formSlug, comingSoon = false, externalHref, deep, currentStep = null,
}: {
  stages: Stage[];
  formSlug: string | null;
  comingSoon?: boolean;
  externalHref?: string | null;
  /** The hero colour carried down the page. */
  deep: string;
  /**
   * Which station this school is standing at, 1 to 4, where we know. Null for
   * a visitor — the path then reads as a description of how it goes, rather
   * than as a claim about them.
   */
  currentStep?: number | null;
}) {
  if (stages.length === 0) return null;

  return (
    <ol className="joc-stages" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {stages.map((s, i) => {
        const last = i === stages.length - 1;
        const link = stageLink(s, i, { formSlug, comingSoon, externalHref: externalHref ?? null });
        const primary = comingSoon ? i === 0 : isRegisterStage(s);

        // Where this school actually is. Without a step we know nothing about
        // them, so no station is marked and the path is just the path.
        const here = currentStep != null && i + 1 === currentStep;
        const done = currentStep != null && i + 1 < currentStep;

        return (
          <li key={s.step || i} id={`step-${i + 1}`} className="joc-stage">
            {/* The rail: node, then a line down to the next one. */}
            <div className="joc-stage-node-col">
              <span
                className="joc-stage-node"
                style={{
                  fontFamily: F.data, fontWeight: 500,
                  // Locked beats everything: a filled "you are here" node on a
                  // station that cannot be reached says two opposite things.
                  backgroundColor: link.locked ? C.paper : here ? deep : done ? C.greenTint : C.paper,
                  color: link.locked ? C.muted : here ? C.white : done ? C.greenText : C.ink,
                  border: link.locked
                    ? `2px dashed ${LOCKED}`
                    : here
                    ? `3px solid ${C.orange}`
                    : done
                    ? `2px solid ${C.green}`
                    : last
                    ? `2px solid ${C.orange}`
                    : `2px solid ${C.ink}`,
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

            <div className="joc-stage-card" style={here ? { borderTop: `3px solid ${C.orange}` } : undefined}>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...label, color: done ? C.greenText : here ? C.orangeText : C.muted, margin: "0 0 6px" }}>
                  {done
                    ? "Done"
                    : link.locked
                    ? `Opens after ${stageShort(Math.max(0, i - 1))}`
                    : `Step ${s.step} of ${stages.length} · ${stageShort(i)}`}
                </p>
                <h3 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 7px", lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p style={{ fontFamily: F.read, fontSize: "17px", color: C.ink, lineHeight: 1.6, margin: 0, maxWidth: "56ch" }}>
                  {s.description}
                </p>
              </div>

              {s.linkLabel && (
                <div className="joc-stage-action">
                  <StageButton link={link} label={s.linkLabel} primary={primary} />
                  {link.note && (
                    <p style={{ fontSize: "13px", color: C.muted, margin: "8px 0 0", lineHeight: 1.45 }}>
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
          color: C.muted,
          backgroundColor: "transparent",
          cursor: "default",
        }}
      >
        Opens at launch
      </span>
    );
  }

  const style: React.CSSProperties = primary
    ? { ...base, backgroundColor: C.blue, color: "#fff", border: `1.5px solid ${C.blue}` }
    : { ...base, backgroundColor: "transparent", color: C.ink, border: `1.5px solid ${C.ink}` };

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
