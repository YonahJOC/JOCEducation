import Link from "next/link";
import { stageShort, stageLink, isRegisterStage } from "@/components/programs/Stages";
import type { Stage } from "@/lib/stages";

/**
 * The shortcut bar, overlapping the bottom of the hero.
 *
 * Half of this page's readers are not deciding anything — they were told last
 * week that the school is doing this, and came back to register or to find out
 * when training is. The old page made them scroll past an argument written for
 * somebody else. This puts their step in the first screen.
 *
 * It is the same four destinations as the stages below, not a second set.
 */

const INK = "#10233F";
const BLUE = "#2D46AF";
const PAPER = "#FBF9F4";
const MUTED = "#4A5872";
const HAIRLINE = "rgba(16,35,63,.1)";

export function StepBar({
  stages, formSlug, comingSoon = false, externalHref,
}: {
  stages: Stage[];
  formSlug: string | null;
  comingSoon?: boolean;
  externalHref?: string | null;
}) {
  if (stages.length === 0) return null;
  const first = stages[0];

  return (
    <div className="joc-stepbar">
      {comingSoon ? (
        <div>
          <p style={{ fontSize: "17px", fontWeight: 600, color: INK, margin: "0 0 6px", letterSpacing: "-0.015em" }}>
            Registration isn&rsquo;t open yet.
          </p>
          <p style={{ fontSize: "15px", color: MUTED, margin: "0 0 18px", lineHeight: 1.55, maxWidth: "60ch" }}>
            This program is being built. Book a meeting now and we will come to you first when
            dates open.
          </p>
          {first.linkLabel && (
            <FirstStepButton stage={first} formSlug={formSlug} externalHref={externalHref} />
          )}
        </div>
      ) : (
        <>
          <div className="joc-stepbar-head">
            <p style={{ fontSize: "16.5px", fontWeight: 600, color: INK, margin: 0, letterSpacing: "-0.015em" }}>
              Already started? Go straight to your step.
            </p>
            <a
              href="#how"
              style={{
                fontSize: "14px", fontWeight: 600, color: BLUE, textDecoration: "none",
                minHeight: "44px", display: "inline-flex", alignItems: "center", whiteSpace: "normal",
              }}
            >
              How it works ↓
            </a>
          </div>

          <div className="joc-stepbar-tiles">
            {stages.map((s, i) => {
              const link = stageLink(s, i, { formSlug, comingSoon, externalHref: externalHref ?? null });
              const filled = isRegisterStage(s);
              const content = (
                <>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.06em", opacity: filled ? 0.82 : 0.66 }}>
                    Step {s.step} · {stageShort(i)}
                  </span>
                  <span style={{ fontSize: "14.5px", fontWeight: 600, display: "flex", gap: "7px", alignItems: "baseline" }}>
                    {s.linkLabel ?? s.title}
                    <span aria-hidden="true">{link.external ? "↗" : "→"}</span>
                  </span>
                </>
              );
              const style: React.CSSProperties = {
                display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px",
                minHeight: "68px", padding: "12px 14px", borderRadius: "11px",
                textDecoration: "none", boxSizing: "border-box", minWidth: 0,
                backgroundColor: filled ? BLUE : PAPER,
                color: filled ? "#fff" : INK,
                border: filled ? `1px solid ${BLUE}` : `1px solid ${HAIRLINE}`,
              };

              // Nothing is open before launch, so the tile states that rather
              // than linking somewhere that turns them away.
              if (link.locked || !link.href) {
                return (
                  <span key={s.step || i} aria-disabled="true" style={{ ...style, opacity: 0.6, cursor: "default" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.06em", opacity: 0.66 }}>
                      Step {s.step} · {stageShort(i)}
                    </span>
                    <span style={{ fontSize: "14.5px", fontWeight: 600 }}>Opens at launch</span>
                  </span>
                );
              }

              if (link.external) {
                return (
                  <a key={s.step || i} href={link.href} target="_blank" rel="noopener noreferrer" style={style}>
                    {content}
                  </a>
                );
              }
              return (
                <Link key={s.step || i} href={link.href} style={style}>
                  {content}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FirstStepButton({
  stage, formSlug, externalHref,
}: {
  stage: Stage;
  formSlug: string | null;
  externalHref?: string | null;
}) {
  const link = stageLink(stage, 0, { formSlug, comingSoon: true, externalHref: externalHref ?? null });
  if (!link.href) return null;
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
    minHeight: "48px", padding: "12px 24px", borderRadius: "10px",
    backgroundColor: BLUE, color: "#fff", border: `1.5px solid ${BLUE}`,
    fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "15px", textDecoration: "none",
  };
  const body = (
    <>
      {stage.linkLabel}
      <span aria-hidden="true">{link.external ? "↗" : "→"}</span>
    </>
  );
  if (link.external) {
    return <a href={link.href} target="_blank" rel="noopener noreferrer" style={style}>{body}</a>;
  }
  return <Link href={link.href} style={style}>{body}</Link>;
}
