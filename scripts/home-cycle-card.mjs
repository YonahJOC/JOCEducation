import fs from "node:fs";

/**
 * The teacher's home: a blue cycle card, then this week's lesson.
 *
 *   node scripts/home-cycle-card.mjs
 *
 * The card was ink, which is the console's colour — this is the educator's
 * side. It is blue now, with the cycle number and week in Plex Mono, the
 * theme in Outfit and the guiding question in Newsreader italic, and it is
 * followed by a band row for the lesson published for these weeks, which is
 * the thing a teacher actually came for.
 *
 * A one-off, kept only so the diff is explicable.
 */

const path = "src/components/sections/PersonalHome.tsx";
const raw = fs.readFileSync(path, "utf8");
const crlf = raw.includes("\r\n");
let s = crlf ? raw.split("\r\n").join("\n") : raw;

function sub(from, to) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`found ${n}: ${from.slice(0, 60)}`);
  s = s.replace(from, to);
}

sub(
  `import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { getCurrentWeek, getCycleState, type Cycle } from "@/lib/cycles";
import { getCycles, getRunningCycle } from "@/lib/cycle-data";`,
  `import Link from "next/link";
import { C, R, F, label, rowCard, rowInner, rowBand, rowBody, rowAction, rowTitle, secondaryButton } from "@/lib/joc-tokens";
import { getCurrentWeek, getCycleState, type Cycle } from "@/lib/cycles";
import { getCycles, getRunningCycle } from "@/lib/cycle-data";
import { getPublishedLessons } from "@/lib/content";`,
);

sub(
  `  const [cycle, allCycles] = await Promise.all([getRunningCycle(), getCycles()]);
  const week = getCurrentWeek(cycle);
  const pct = Math.round((week / cycle.weeks) * 100);`,
  `  const [cycle, allCycles, lessons] = await Promise.all([
    getRunningCycle(),
    getCycles(),
    getPublishedLessons(),
  ]);
  const week = getCurrentWeek(cycle);
  const pct = Math.round((week / cycle.weeks) * 100);

  // What is published for these weeks. A teacher opens this page to find the
  // lesson, so it goes above everything except the cycle it belongs to.
  const thisWeek = lessons.filter((l) => l.cycleSlug === cycle.slug);
  const forNow = thisWeek.find((l) => l.cycleWeek === week) ?? thisWeek[0] ?? null;`,
);

// The card: blue rather than ink, with the numbers in Plex Mono.
sub(
  `        style={{
          backgroundColor: C.ink, borderRadius: "24px", padding: "30px",
          color: "#fff", marginBottom: "16px",
        }}`,
  `        style={{
          backgroundColor: C.blue, borderRadius: R.hero, padding: "30px",
          color: C.white, marginBottom: "16px",
        }}`,
);

sub(
  `            <p style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: C.orange, margin: "0 0 12px" }}>
              Running now · {cycle.hebrew}
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 36px)", lineHeight: 1.06, letterSpacing: "-0.035em", margin: "0 0 6px" }}>
              {cycle.theme}
            </h2>`,
  `            <p style={{ ...label, color: "#FFD8AE", margin: "0 0 12px" }}>
              Cycle {String(cycle.num).padStart(2, "0")} · Week {week} of {cycle.weeks} · {cycle.hebrew}
            </p>
            <h2 style={{ fontFamily: F.ui, fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 36px)", lineHeight: 1.06, letterSpacing: "-0.035em", margin: "0 0 6px" }}>
              {cycle.theme}
            </h2>`,
);

sub(
  `            <p style={{ fontSize: "15px", color: "rgba(255,255,255,.65)", margin: "0 0 20px" }}>{cycle.gloss}</p>`,
  `            <p style={{ fontFamily: F.read, fontSize: "17px", color: "#C6CFF0", margin: "0 0 20px" }}>{cycle.gloss}</p>`,
);

sub(
  `            <p
              style={{
                fontFamily: "var(--font-newsreader)", fontStyle: "italic",
                fontSize: "clamp(17px, 2vw, 21px)", lineHeight: 1.5,
                color: "rgba(255,255,255,.94)", borderLeft: \`3px solid \${C.orange}\`,
                paddingLeft: "18px", margin: 0, maxWidth: "34ch",
              }}
            >`,
  `            <p
              style={{
                fontFamily: F.read, fontStyle: "italic",
                fontSize: "clamp(18px, 2.1vw, 23px)", lineHeight: 1.5,
                color: C.white, borderLeft: \`3px solid \${C.orange}\`,
                paddingLeft: "18px", margin: 0, maxWidth: "34ch",
              }}
            >`,
);

sub(
  `            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "rgba(255,255,255,.6)", marginBottom: "8px" }}>
              <span>Week {week} of {cycle.weeks}</span>
              <span>{cycle.range}</span>
            </div>`,
  `            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ ...label, color: "#C6CFF0" }}>{cycle.range}</span>
            </div>`,
);

sub(
  `            <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(255,255,255,.72)", margin: "0 0 18px" }}>
              Everything published for these weeks points at this one middah.
            </p>`,
  `            <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: "#C6CFF0", margin: "0 0 18px" }}>
              Everything published for these weeks points at this one middah.
            </p>`,
);

// The lesson for these weeks, straight under the card.
sub(
  `      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>`,
  `      </section>

      {/* The reason a teacher opened this page. */}
      <div style={{ ...rowCard, marginBottom: "16px" }}>
        <div style={rowInner}>
          <div style={{ ...rowBand, backgroundColor: forNow ? C.blueTint : C.panel }}>
            <span style={{ ...label, color: forNow ? C.blue : C.orangeText }}>
              {forNow ? "This week" : "Nothing yet"}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, color: forNow ? C.blue : C.orangeText }}>
              {forNow ? \`Week \${week}\` : "—"}
            </span>
          </div>

          <div style={rowBody}>
            {forNow ? (
              <>
                <p style={rowTitle}>{forNow.title}</p>
                <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.55, margin: 0 }}>
                  {forNow.description}
                </p>
              </>
            ) : (
              <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.55, margin: 0 }}>
                No lesson is published for {cycle.theme} yet. When one is, it appears here.
              </p>
            )}
          </div>

          <div style={rowAction}>
            <Link
              href={forNow ? \`/lesson-plans/\${forNow.id}\` : "/lesson-plans"}
              style={{ ...secondaryButton, textDecoration: "none" }}
            >
              {forNow ? "Open the lesson" : "Browse lessons"}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>`,
);

fs.writeFileSync(path, crlf ? s.split("\n").join("\r\n") : s);
console.log("home rebuilt: blue cycle card, then this week's lesson");
