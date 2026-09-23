import fs from "node:fs";

/**
 * Put the program console behind tabs.
 *
 * The form builder was the first thing on the page, above the schools, the
 * traffic light and the sign-ups — so the console opened on the one job a
 * coordinator does least often. Each section is now a tab, and Today is the
 * default.
 *
 * A one-off, kept only so the diff is explicable.
 */

const path = "src/app/admin/programs/[slug]/ProgramAdminClient.tsx";
const raw = fs.readFileSync(path, "utf8");
const crlf = raw.includes("\r\n");
let s = crlf ? raw.split("\r\n").join("\n") : raw;

function sub(from, to) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`found ${n}: ${from.slice(0, 70)}`);
  s = s.replace(from, to);
}

// ── The old page furniture. The band above the tabs says all of it now. ────
sub(`      <Link href="/admin/programs" style={{ fontSize: "13px", color: C.blue, textDecoration: "none", fontWeight: 600 }}>
        ← All programs
      </Link>

      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: C.ink, margin: "12px 0 4px" }}>
        {view.name}
      </h1>
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 4px" }}>
        /programs/{view.slug}
        {!view.published && " · draft"}
        {view.comingSoon && " · coming soon"}
      </p>
      {asCoordinator && (
        <div style={{ backgroundColor: "#10233F", borderRadius: "12px", padding: "12px 16px", margin: "12px 0 0", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13.5px", color: "#fff", lineHeight: 1.5, flex: 1, minWidth: "min(100%, 300px)" }}>
            You are seeing this the way <strong>whoever runs this program</strong> sees it — no
            editing the form, no coordinators panel, no app figures.
          </span>
          <Link
            href={\`/admin/programs/\${view.slug}\`}
            style={{ fontSize: "13px", fontWeight: 700, color: "#10233F", backgroundColor: "#FA912D", borderRadius: "9999px", padding: "9px 16px", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Back to your own view
          </Link>
        </div>
      )}

      {!asCoordinator && (view.canEditForm || view.canSetCoordinators) && (
        <p style={{ margin: "12px 0 0" }}>
          <Link
            href={\`/admin/programs/\${view.slug}?as=coordinator\`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              fontSize: "13px", fontWeight: 600, color: C.ink,
              backgroundColor: "rgba(16,35,63,.06)", borderRadius: "9999px",
              padding: "9px 16px", minHeight: "40px", textDecoration: "none",
            }}
          >
            See this as its coordinator does
          </Link>
        </p>
      )}

      {!asCoordinator && view.asLead && (
        <p style={{ fontSize: "13.5px", color: "#C96C00", backgroundColor: "#FFF0E0", borderRadius: "10px", padding: "10px 14px", margin: "12px 0 0", maxWidth: "62ch", lineHeight: 1.5 }}>
          You are down as running this program, so you can see its sign-ups. Everything else in the
          console stays as it was.
        </p>
      )}

      <div style={{ height: "22px" }} />

      {/* ── The form, edited right here ────────────────────────────────── */}
      <div style={{ marginBottom: "14px" }}>`,
`      {/* The band and the tabs are rendered by the page, above this. */}

      {tab === "today" && today}

      {!asCoordinator && (view.canEditForm || view.canSetCoordinators) && (
        <p style={{ margin: "0 0 14px" }}>
          <Link
            href={\`/admin/programs/\${view.slug}?tab=\${tab}&as=coordinator\`}
            style={{ ...textButton, display: "inline-flex", alignItems: "center" }}
          >
            See this as its coordinator does
          </Link>
        </p>
      )}

      {/* ── The sign-up form ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "14px", display: tab === "setup" ? undefined : "none" }}>`);

// ── The panels that now live under their own tabs ─────────────────────────
sub(`      {appActivity && <AppActivityPanel data={appActivity} />}`,
`      {tab === "today" && appActivity && <AppActivityPanel data={appActivity} />}`);

sub(`      <ProgramSchools`, `      {tab === "schools" && <ProgramSchools`);

sub(`      {reporting && <ProgramReports programName={view.name} data={reporting} />}`,
`      {tab === "today" && reporting && <ProgramReports programName={view.name} data={reporting} />}`);

sub(`      {traffic && (
        <ProgramLights programId={view.id} slug={view.slug} programName={view.name} data={traffic} />
      )}`,
`      {tab === "not-in-yet" && traffic && (
        <ProgramLights programId={view.id} slug={view.slug} programName={view.name} data={traffic} />
      )}`);

sub(`      {/* ── Where it is running ────────────────────────────────────────── */}
      <div style={card}>`,
`      {/* ── Where it is running ────────────────────────────────────────── */}
      <div style={{ ...card, display: tab === "calendar" ? undefined : "none" }}>`);

sub(`      {/* ── Swapping the form out ──────────────────────────────────────── */}`,
`      {/* ── Swapping the form out ──────────────────────────────────────── */}
      {tab === "setup" && (`);

sub(`      {/* ── Who runs it ────────────────────────────────────────────────── */}
      {view.canSetCoordinators && (`,
`      )}

      {/* ── Who runs it ────────────────────────────────────────────────── */}
      {tab === "setup" && view.canSetCoordinators && (`);

sub(`      {/* ── The sign-ups ───────────────────────────────────────────────── */}`,
`      {/* ── The sign-ups ───────────────────────────────────────────────── */}
      {tab === "sign-ups" && (`);

// The props.
sub(`  enrolled = [], reporting = null,
}: {`, `  enrolled = [], reporting = null, tab = "today", today = null,
}: {`);

sub(`  /** What the student ambassadors have reported. Never carries a name. */
  reporting?: ProgramReporting | null;
}) {`,
`  /** What the student ambassadors have reported. Never carries a name. */
  reporting?: ProgramReporting | null;
  /** Which section is open. An address, not state — see ProgramConsoleHeader. */
  tab?: TabKey;
  /** The Today tab, rendered by the page because it reads the database. */
  today?: React.ReactNode;
}) {`);

sub(`import { ProgramReports } from "@/components/admin/ProgramReports";`,
`import { ProgramReports } from "@/components/admin/ProgramReports";
import type { TabKey } from "@/components/admin/ProgramConsoleHeader";
import { textButton } from "@/lib/joc-tokens";`);

fs.writeFileSync(path, crlf ? s.split("\n").join("\r\n") : s);
console.log("console is tabbed");
