"use client";

import { useState, useTransition } from "react";
import { saveLesson } from "@/app/actions/content";
import type { CycleRef } from "@/components/admin/LessonEditor";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE_TEXT = "#C96C00";
const GREEN = "#1B7F4B";
const RED = "#B8321E";
const RULE = "rgba(16,35,63,.15)";

/**
 * Paste a block from the content workbook, map the columns, and approve every
 * row before anything is written.
 *
 * Nothing saves until the person has seen each row parsed back to them —
 * a silent import that half-works is worse than no import.
 */

type Row = {
  cells: string[];
  title: string;
  theme: string;
  description: string;
  grade: "es" | "ms" | "hf" | "hs";
  minutes: number;
  cycleSlug: string | null;
  include: boolean;
  problem: string | null;
};

const FIELDS = [
  { key: "title", label: "Title" },
  { key: "theme", label: "Theme" },
  { key: "description", label: "Description" },
  { key: "grade", label: "Grade band" },
  { key: "minutes", label: "Minutes" },
  { key: "cycle", label: "Cycle" },
  { key: "skip", label: "— ignore —" },
] as const;

function parseGrade(v: string): "es" | "ms" | "hs" {
  const s = v.trim().toLowerCase();
  if (s.startsWith("h")) return "hs";
  if (s.startsWith("m")) return "ms";
  return "es";
}

export function BulkImport({ cycles, disabled }: { cycles: CycleRef[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [mapping, setMapping] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const table = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split("\t").length > 1 ? l.split("\t") : l.split(","))
    .map((c) => c.map((x) => x.trim()));

  const columnCount = table.length ? Math.max(...table.map((r) => r.length)) : 0;

  function guessMapping() {
    const header = table[0]?.map((h) => h.toLowerCase()) ?? [];
    const guessed = Array.from({ length: columnCount }, (_, i) => {
      const h = header[i] ?? "";
      if (h.includes("title")) return "title";
      if (h.includes("theme") || h.includes("middah")) return "theme";
      if (h.includes("desc")) return "description";
      if (h.includes("grade") || h.includes("band")) return "grade";
      if (h.includes("min") || h.includes("time") || h.includes("length")) return "minutes";
      if (h.includes("cycle")) return "cycle";
      return "skip";
    });
    setMapping(guessed);
  }

  function build() {
    const hasHeader = table[0]?.some((c) => /title|theme|grade|cycle/i.test(c));
    const body = hasHeader ? table.slice(1) : table;

    const built: Row[] = body.map((cells) => {
      const pick = (key: string) => {
        const i = mapping.indexOf(key);
        return i >= 0 ? (cells[i] ?? "") : "";
      };
      const title = pick("title");
      const cycleRaw = pick("cycle").toLowerCase();
      const cycle =
        cycles.find((c) => c.slug === cycleRaw) ??
        cycles.find((c) => c.theme.toLowerCase() === cycleRaw) ??
        cycles.find((c) => String(c.num) === cycleRaw.replace(/\D/g, "")) ??
        null;

      return {
        cells,
        title,
        theme: pick("theme"),
        description: pick("description"),
        grade: parseGrade(pick("grade")),
        minutes: parseInt(pick("minutes"), 10) || 20,
        cycleSlug: cycle?.slug ?? null,
        include: Boolean(title),
        problem: !title ? "No title — cannot import" : cycleRaw && !cycle ? `Cycle "${cycleRaw}" not recognised` : null,
      };
    });
    setRows(built);
  }

  function runImport() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.include && r.title);
    setResult(null);
    start(async () => {
      let ok = 0;
      const failures: string[] = [];
      for (const r of chosen) {
        const res = await saveLesson({
          title: r.title,
          theme: r.theme,
          description: r.description,
          grade: r.grade as "es" | "ms" | "hs",
          timeMinutes: r.minutes,
          prep: "Minimal",
          cycleSlug: r.cycleSlug,
          published: false,
          featured: false,
          objectives: [],
          materials: [],
          discussion: [],
          steps: [],
        });
        if (res.ok) ok++;
        else failures.push(`${r.title}: ${res.error}`);
      }
      setResult(
        failures.length === 0
          ? `Imported ${ok} lesson${ok === 1 ? "" : "s"} as drafts.`
          : `Imported ${ok}. ${failures.length} failed — ${failures[0]}`
      );
      if (failures.length === 0) { setRows(null); setRaw(""); }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: BLUE,
          background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer",
          padding: "6px 0", minHeight: "40px", opacity: disabled ? 0.5 : 1,
        }}
      >
        Import from the content workbook
      </button>
    );
  }

  return (
    <div style={{ backgroundColor: "#fff", border: `1.5px solid ${BLUE}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
          Import from the workbook
        </p>
        <button
          onClick={() => { setOpen(false); setRows(null); setRaw(""); setResult(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: "rgba(16,35,63,.55)", background: "none", border: "none", cursor: "pointer" }}
        >
          Close
        </button>
      </div>

      {!rows ? (
        <>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: "0 0 12px" }}>
            Copy the rows straight out of the workbook and paste them here. Tabs or commas both work.
            Nothing is saved until you have seen every row.
          </p>
          <textarea
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setRows(null); }}
            onBlur={() => { if (raw && mapping.length !== columnCount) guessMapping(); }}
            rows={6}
            placeholder={"Title\tTheme\tGrade\tMinutes\tCycle\nSeeing the Person…\tBein Adam LaChaveiro\tES\t20\tCheshbon Hanefesh"}
            style={{
              width: "100%", fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "12.5px",
              color: INK, backgroundColor: "#FAFBFD", border: `1px solid ${RULE}`, borderRadius: "10px",
              padding: "12px", outline: "none", resize: "vertical", marginBottom: "14px",
            }}
          />

          {columnCount > 0 && (
            <>
              <p style={{ fontSize: "12.5px", fontWeight: 600, color: "rgba(16,35,63,.6)", margin: "0 0 9px" }}>
                What is each column?
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                {Array.from({ length: columnCount }, (_, i) => (
                  <label key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", color: "rgba(16,35,63,.5)" }}>
                      Column {i + 1}
                      {table[0]?.[i] ? ` · ${table[0][i].slice(0, 14)}` : ""}
                    </span>
                    <select
                      value={mapping[i] ?? "skip"}
                      onChange={(e) => setMapping((m) => { const n = [...m]; n[i] = e.target.value; return n; })}
                      style={{
                        fontFamily: "var(--font-outfit)", fontSize: "13px", color: INK,
                        backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "9px",
                        padding: "8px 10px", minHeight: "40px", outline: "none",
                      }}
                    >
                      {FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </label>
                ))}
              </div>

              <button
                onClick={build}
                disabled={!mapping.includes("title")}
                style={{
                  fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
                  backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 22px",
                  minHeight: "44px", cursor: mapping.includes("title") ? "pointer" : "not-allowed",
                  opacity: mapping.includes("title") ? 1 : 0.5,
                }}
              >
                Preview {table.length} row{table.length === 1 ? "" : "s"}
              </button>
              {!mapping.includes("title") && (
                <p style={{ fontSize: "12.5px", color: ORANGE_TEXT, margin: "9px 0 0" }}>
                  One column has to be the title.
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: "0 0 14px" }}>
            {rows.filter((r) => r.include).length} of {rows.length} will be imported, as unpublished
            drafts. Untick anything you do not want.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto", marginBottom: "16px" }}>
            {rows.map((r, i) => {
              const cycle = cycles.find((c) => c.slug === r.cycleSlug);
              return (
                <label
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: "11px",
                    alignItems: "start", padding: "10px 12px", borderRadius: "10px",
                    backgroundColor: r.problem && !r.title ? "rgba(184,50,30,.05)" : "#FAFBFD",
                    border: `1px solid ${r.problem && !r.title ? "rgba(184,50,30,.25)" : "rgba(16,35,63,.07)"}`,
                    cursor: r.title ? "pointer" : "not-allowed",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={r.include}
                    disabled={!r.title}
                    onChange={(e) => setRows((rs) => rs!.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))}
                    style={{ width: "16px", height: "16px", marginTop: "2px" }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: INK, display: "block" }}>
                      {r.title || <em style={{ color: RED, fontWeight: 400 }}>No title</em>}
                    </span>
                    <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)" }}>
                      {[r.theme, r.grade.toUpperCase(), `${r.minutes} min`, cycle ? cycle.theme : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {r.problem && (
                      <span style={{ display: "block", fontSize: "12px", color: ORANGE_TEXT, marginTop: "2px" }}>
                        {r.problem}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={runImport}
              disabled={pending || rows.filter((r) => r.include).length === 0}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
                backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 22px",
                minHeight: "44px", cursor: "pointer", opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Importing…" : `Import ${rows.filter((r) => r.include).length}`}
            </button>
            <button
              onClick={() => setRows(null)}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              Back
            </button>
            {result && (
              <span style={{ fontSize: "13px", color: result.includes("failed") ? RED : GREEN }}>{result}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
