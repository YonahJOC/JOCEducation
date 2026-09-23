import fs from "node:fs";

/**
 * Teach the path which station the reader's school is standing at.
 *
 * A one-off, kept only so the diff is explicable. Normalises line endings in
 * memory because half this repo is checked out CRLF.
 */

const path = "src/components/programs/Stages.tsx";
const raw = fs.readFileSync(path, "utf8");
const crlf = raw.includes("\r\n");
let s = crlf ? raw.split("\r\n").join("\n") : raw;

function sub(from, to) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`found ${n}: ${from.slice(0, 60)}`);
  s = s.replace(from, to);
}

sub(`import { C } from "@/lib/joc-tokens";`, `import { C, F, label } from "@/lib/joc-tokens";`);

sub(`export function Stages({
  stages, formSlug, comingSoon = false, externalHref, deep,
}: {
  stages: Stage[];
  formSlug: string | null;
  comingSoon?: boolean;
  externalHref?: string | null;
  /** The hero colour carried down the page. */
  deep: string;
}) {`,
`export function Stages({
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
}) {`);

sub(`        const last = i === stages.length - 1;
        const link = stageLink(s, i, { formSlug, comingSoon, externalHref: externalHref ?? null });
        const primary = comingSoon ? i === 0 : isRegisterStage(s);`,
`        const last = i === stages.length - 1;
        const link = stageLink(s, i, { formSlug, comingSoon, externalHref: externalHref ?? null });
        const primary = comingSoon ? i === 0 : isRegisterStage(s);

        // Where this school actually is. Without a step we know nothing about
        // them, so no station is marked and the path is just the path.
        const here = currentStep != null && i + 1 === currentStep;
        const done = currentStep != null && i + 1 < currentStep;`);

sub(`                style={{
                  // Locked beats last: a filled orange "you made it" node on a
                  // stage that cannot be reached yet says two opposite things.
                  backgroundColor: last && !link.locked ? C.orange : C.paper,
                  color: link.locked ? C.muted : C.ink,
                  border: link.locked
                    ? \`2px dashed \${LOCKED}\`
                    : last
                    ? \`2px solid \${C.orange}\`
                    : \`2px solid \${C.ink}\`,
                }}`,
`                style={{
                  fontFamily: F.data, fontWeight: 500,
                  // Locked beats everything: a filled "you are here" node on a
                  // station that cannot be reached says two opposite things.
                  backgroundColor: link.locked ? C.paper : here ? deep : done ? C.greenTint : C.paper,
                  color: link.locked ? C.muted : here ? C.white : done ? C.greenText : C.ink,
                  border: link.locked
                    ? \`2px dashed \${LOCKED}\`
                    : here
                    ? \`3px solid \${C.orange}\`
                    : done
                    ? \`2px solid \${C.green}\`
                    : last
                    ? \`2px solid \${C.orange}\`
                    : \`2px solid \${C.ink}\`,
                }}`);

sub(`            <div className="joc-stage-card">
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 5px", fontWeight: 500 }}>
                  Step {s.step} of {stages.length} · {stageShort(i)}
                </p>
                <h3 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 7px", lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "15.5px", color: BODY2, lineHeight: 1.6, margin: 0, maxWidth: "56ch" }}>
                  {s.description}
                </p>
              </div>`,
`            <div className="joc-stage-card" style={here ? { borderTop: \`3px solid \${C.orange}\` } : undefined}>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...label, color: done ? C.greenText : here ? C.orangeText : C.muted, margin: "0 0 6px" }}>
                  {done
                    ? "Done"
                    : link.locked
                    ? \`Opens after \${stageShort(Math.max(0, i - 1))}\`
                    : \`Step \${s.step} of \${stages.length} · \${stageShort(i)}\`}
                </p>
                <h3 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 7px", lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p style={{ fontFamily: F.read, fontSize: "17px", color: C.ink, lineHeight: 1.6, margin: 0, maxWidth: "56ch" }}>
                  {s.description}
                </p>
              </div>`);

fs.writeFileSync(path, crlf ? s.split("\n").join("\r\n") : s);
console.log("Stages now knows where the school is standing");
