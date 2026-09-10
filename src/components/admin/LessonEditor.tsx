"use client";

import { useState, useTransition } from "react";
import { saveLesson } from "@/app/actions/content";
import { FilePicker } from "@/components/admin/FilePicker";

const INK = "#10233F";
const DEEP = "#0B1A31";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const ORANGE_TEXT = "#C96C00";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.15)";

export type LessonDraft = {
  id?: number;
  title: string;
  theme: string;
  description: string;
  grade: "es" | "ms" | "hs";
  timeMinutes: number;
  prep: "Minimal" | "Moderate" | "Substantial";
  cycleSlug: string | null;
  published: boolean;
  featured: boolean;
  objectives: string[];
  materials: string[];
  discussion: string[];
  steps: { duration: string; title: string; description: string }[];
  files: { name: string; url: string }[];
};

export const EMPTY_LESSON: LessonDraft = {
  title: "", theme: "", description: "", grade: "es", timeMinutes: 20, prep: "Minimal",
  cycleSlug: null, published: false, featured: false,
  objectives: [""], materials: [""], discussion: [""],
  steps: [{ duration: "5", title: "", description: "" }],
  files: [],
};

export type CycleRef = { slug: string; theme: string; num: number; question: string; color: string };

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
const legend: React.CSSProperties = {
  fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase",
  fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "22px", marginBottom: "14px",
};

const GRADES = [["es", "Elementary"], ["ms", "Middle"], ["hs", "High school"]] as const;
const PREPS = ["Minimal", "Moderate", "Substantial"] as const;
const LENGTHS = [20, 40, 60, 90];

/** Minutes from a step's duration field, which may read "10" or "10 min". */
const mins = (s: string) => parseInt(s, 10) || 0;

export function LessonEditor({
  initial, cycles, disabled, onDone,
}: {
  initial: LessonDraft;
  cycles: CycleRef[];
  disabled?: boolean;
  onDone?: () => void;
}) {
  const [d, setD] = useState<LessonDraft>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof LessonDraft>(k: K, v: LessonDraft[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const stepTotal = d.steps.reduce((n, s) => n + mins(s.duration), 0);
  const drift = stepTotal - d.timeMinutes;
  const cycle = cycles.find((c) => c.slug === d.cycleSlug);

  // What is still missing before this is worth publishing.
  const missing: string[] = [];
  if (!d.title.trim()) missing.push("a title");
  if (!d.theme.trim()) missing.push("a theme");
  if (!d.description.trim()) missing.push("a description");
  if (!d.cycleSlug) missing.push("a Chesed Cycle");
  if (!d.objectives.some((o) => o.trim())) missing.push("at least one objective");
  if (!d.steps.some((s) => s.title.trim())) missing.push("at least one step");
  if (stepTotal > 0 && drift !== 0) missing.push("steps that add up to the lesson length");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveLesson({
        ...d,
        steps: d.steps.map((s) => ({ ...s, duration: `${mins(s.duration)} min` })),
      });
      if (r.ok) { setMsg("Saved."); onDone?.(); }
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="joc-lesson-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 290px", gap: "18px", alignItems: "start" }}>
        {/* ── Writing surface ───────────────────────────────────────────── */}
        <div style={{ minWidth: 0 }}>
          {/* Title reads as writing, not a form row */}
          <input
            value={d.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="What will students do?"
            disabled={disabled}
            style={{
              width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 800,
              fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.035em", lineHeight: 1.15,
              color: INK, background: "transparent", border: "none", borderBottom: "2px solid transparent",
              outline: "none", padding: "4px 0", marginBottom: "18px",
            }}
          />

          {/* Segmented rows rather than three selects */}
          <div style={{ ...card, paddingTop: "18px", paddingBottom: "18px" }}>
            <Segmented
              label="Chesed Cycle"
              value={d.cycleSlug ?? ""}
              onChange={(v) => set("cycleSlug", v || null)}
              options={[["", "None"], ...cycles.map((c) => [c.slug, `${c.num}. ${c.theme}`] as [string, string])]}
              disabled={disabled}
            />
            <Segmented
              label="Grade band"
              value={d.grade}
              onChange={(v) => set("grade", v as LessonDraft["grade"])}
              options={GRADES.map(([v, l]) => [v, l] as [string, string])}
              disabled={disabled}
            />
            <Segmented
              label="Length"
              value={String(d.timeMinutes)}
              onChange={(v) => set("timeMinutes", Number(v))}
              options={LENGTHS.map((t) => [String(t), `${t} min`] as [string, string])}
              disabled={disabled}
            />
            <Segmented
              label="Prep"
              value={d.prep}
              onChange={(v) => set("prep", v as LessonDraft["prep"])}
              options={PREPS.map((p) => [p, p] as [string, string])}
              disabled={disabled}
              last
            />
          </div>

          <div style={card}>
            <p style={legend}>The lesson in two sentences</p>
            <textarea
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="What a teacher sees on the card before they open it"
              disabled={disabled}
              style={{ ...field, resize: "vertical" }}
            />
            <div style={{ marginTop: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", display: "block", marginBottom: "5px" }}>
                Theme or middah
              </label>
              <input value={d.theme} onChange={(e) => set("theme", e.target.value)} disabled={disabled} style={field} />
            </div>
          </div>

          {/* Steps are the centre of the screen */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <p style={{ ...legend, margin: 0 }}>How the lesson runs</p>
              <span
                style={{
                  fontSize: "12.5px", fontWeight: 700, padding: "5px 12px", borderRadius: "9999px",
                  color: drift === 0 ? GREEN : ORANGE_TEXT,
                  backgroundColor: drift === 0 ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)",
                }}
              >
                {stepTotal} of {d.timeMinutes} minutes accounted for
                {drift > 0 ? ` · ${drift} over` : drift < 0 ? ` · ${-drift} left` : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {d.steps.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: "62px minmax(0,1fr) 28px", gap: "12px",
                    alignItems: "start", backgroundColor: "#FAFBFD",
                    border: `1px solid rgba(16,35,63,.08)`, borderRadius: "14px", padding: "12px",
                  }}
                >
                  {/* The minute clock */}
                  <div style={{ textAlign: "center" }}>
                    <input
                      value={s.duration}
                      onChange={(e) =>
                        set("steps", d.steps.map((x, j) => (j === i ? { ...x, duration: e.target.value.replace(/\D/g, "") } : x)))
                      }
                      inputMode="numeric"
                      aria-label={`Minutes for step ${i + 1}`}
                      disabled={disabled}
                      style={{
                        width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 800,
                        fontSize: "22px", letterSpacing: "-0.03em", textAlign: "center", color: BLUE,
                        backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
                        padding: "8px 4px", outline: "none",
                      }}
                    />
                    <span style={{ fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(16,35,63,.4)", fontWeight: 700 }}>
                      min
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 }}>
                    <input
                      value={s.title}
                      onChange={(e) => set("steps", d.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                      placeholder={`Step ${i + 1}`}
                      disabled={disabled}
                      style={{ ...field, fontWeight: 600, backgroundColor: "#fff" }}
                    />
                    <textarea
                      value={s.description}
                      onChange={(e) => set("steps", d.steps.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                      rows={2}
                      placeholder="What happens, in the teacher's hands"
                      disabled={disabled}
                      style={{ ...field, resize: "vertical", backgroundColor: "#fff" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <Tiny label="Move up" onClick={() => swap(d, set, i, -1)} disabled={disabled || i === 0}>↑</Tiny>
                    <Tiny label="Move down" onClick={() => swap(d, set, i, 1)} disabled={disabled || i === d.steps.length - 1}>↓</Tiny>
                    <Tiny label="Remove step" onClick={() => set("steps", d.steps.filter((_, j) => j !== i))} disabled={disabled} danger>×</Tiny>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => set("steps", [...d.steps, { duration: "5", title: "", description: "" }])}
              disabled={disabled}
              style={{ marginTop: "12px", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: "6px 0", minHeight: "40px" }}
            >
              + Add a step
            </button>
          </div>

          <div style={card}>
            <p style={legend}>Objectives</p>
            <ListField items={d.objectives} onChange={(v) => set("objectives", v)} placeholder="Students will…" disabled={disabled} />
          </div>

          <div style={card}>
            <p style={legend}>Materials</p>
            <ListField items={d.materials} onChange={(v) => set("materials", v)} placeholder="What the teacher needs in hand" disabled={disabled} />
          </div>

          <div style={card}>
            <p style={legend}>Discussion questions</p>
            <ListField items={d.discussion} onChange={(v) => set("discussion", v)} placeholder="A question to put to the class" disabled={disabled} />
          </div>

          <div style={card}>
            <p style={legend}>Printables and handouts</p>
            <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", lineHeight: 1.55, margin: "-6px 0 14px" }}>
              What a teacher downloads with this lesson. Only signed-in accounts with access can open them.
            </p>
            <LessonFiles files={d.files} onChange={(v) => set("files", v)} disabled={disabled} />
          </div>
        </div>

        {/* ── Right rail ────────────────────────────────────────────────── */}
        <aside className="joc-lesson-rail" style={{ position: "sticky", top: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* The Cycle's guiding question — the lesson has to answer back to it */}
          <div style={{ backgroundColor: DEEP, borderRadius: "16px", padding: "20px", color: "#fff" }}>
            {cycle ? (
              <>
                <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: ORANGE, margin: "0 0 10px" }}>
                  Cycle {cycle.num} · {cycle.theme}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-newsreader)", fontStyle: "italic",
                    fontSize: "17px", lineHeight: 1.5, color: "rgba(255,255,255,.95)",
                    borderLeft: `3px solid ${ORANGE}`, paddingLeft: "14px", margin: 0,
                  }}
                >
                  {cycle.question}
                </p>
                <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,.55)", margin: "12px 0 0", lineHeight: 1.5 }}>
                  This lesson should answer back to that.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: ORANGE, margin: "0 0 10px" }}>
                  No Cycle chosen
                </p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "rgba(255,255,255,.72)", margin: 0 }}>
                  Pick one above and its guiding question will sit here while you write.
                </p>
              </>
            )}
          </div>

          {/* Pre-publish checklist naming what is missing */}
          <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px" }}>
            <p style={{ ...legend, marginBottom: "12px" }}>Before publishing</p>
            {missing.length === 0 ? (
              <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: GREEN, margin: 0 }}>
                Everything is here. Ready to publish.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {missing.map((m) => (
                  <li key={m} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: ORANGE, flexShrink: 0, marginTop: "7px" }} />
                    <span style={{ fontSize: "13.5px", lineHeight: 1.5, color: "rgba(16,35,63,.72)" }}>Needs {m}</span>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(16,35,63,.08)" }}>
              <label style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
                <input type="checkbox" checked={d.published} onChange={(e) => set("published", e.target.checked)} disabled={disabled} style={{ width: "16px", height: "16px" }} />
                Published
              </label>
              <label style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
                <input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} disabled={disabled} style={{ width: "16px", height: "16px" }} />
                Featured
              </label>
            </div>

            <button
              type="submit"
              disabled={disabled || pending || !d.title.trim()}
              style={{
                width: "100%", marginTop: "16px", fontFamily: "var(--font-outfit)",
                fontWeight: 700, fontSize: "14.5px", color: "#fff", backgroundColor: BLUE,
                border: "none", borderRadius: "9999px", padding: "13px 20px", minHeight: "44px",
                cursor: disabled || !d.title.trim() ? "not-allowed" : "pointer",
                opacity: disabled || pending || !d.title.trim() ? 0.5 : 1,
              }}
            >
              {pending ? "Saving…" : d.id ? "Save changes" : "Create lesson"}
            </button>
            {msg && (
              <p style={{ fontSize: "13px", margin: "10px 0 0", color: msg === "Saved." ? GREEN : "#B8321E" }}>{msg}</p>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}

function swap(
  d: LessonDraft,
  set: <K extends keyof LessonDraft>(k: K, v: LessonDraft[K]) => void,
  i: number,
  dir: -1 | 1
) {
  const next = [...d.steps];
  const j = i + dir;
  if (j < 0 || j >= next.length) return;
  [next[i], next[j]] = [next[j], next[i]];
  set("steps", next);
}

function Segmented({
  label, value, onChange, options, disabled, last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "104px minmax(0,1fr)", gap: "14px", alignItems: "center", paddingBottom: last ? 0 : "12px", marginBottom: last ? 0 : "12px", borderBottom: last ? "none" : "1px solid rgba(16,35,63,.06)" }}>
      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "rgba(16,35,63,.6)" }}>{label}</span>
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {options.map(([v, l]) => {
          const on = v === value;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              disabled={disabled}
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600,
                padding: "7px 13px", borderRadius: "9999px", minHeight: "38px",
                cursor: disabled ? "default" : "pointer",
                border: on ? `1.5px solid ${BLUE}` : `1px solid ${RULE}`,
                backgroundColor: on ? "#F4F7FD" : "#fff",
                color: on ? BLUE : "rgba(16,35,63,.7)",
                whiteSpace: "nowrap",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListField({
  items, onChange, placeholder, disabled,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 28px", gap: "8px" }}>
            <input
              value={t}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={placeholder}
              disabled={disabled}
              style={field}
            />
            <Tiny label={`Remove item ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))} disabled={disabled} danger>
              ×
            </Tiny>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        disabled={disabled}
        style={{ marginTop: "9px", fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: "6px 0", minHeight: "38px" }}
      >
        + Add
      </button>
    </>
  );
}

function Tiny({
  children, label, onClick, disabled, danger,
}: {
  children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: "28px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", borderRadius: "6px",
        color: disabled ? "rgba(16,35,63,.2)" : danger ? "#B8321E" : "rgba(16,35,63,.5)",
        cursor: disabled ? "default" : "pointer", fontSize: "15px",
      }}
    >
      {children}
    </button>
  );
}

/** The printables attached to a lesson: a name a teacher recognises, and a file. */
function LessonFiles({
  files, onChange, disabled,
}: {
  files: { name: string; url: string }[];
  onChange: (v: { name: string; url: string }[]) => void;
  disabled?: boolean;
}) {
  const patch = (i: number, p: Partial<{ name: string; url: string }>) =>
    onChange(files.map((f, n) => (n === i ? { ...f, ...p } : f)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {files.map((f, i) => (
        <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: "12px", padding: "14px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px" }}>
                What the teacher sees
              </label>
              <input
                value={f.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="Reflection cards"
                disabled={disabled}
                style={field}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(files.filter((_, n) => n !== i))}
              disabled={disabled}
              style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: "#B8321E", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", minHeight: "42px" }}
            >
              Remove
            </button>
          </div>
          <FilePicker
            value={f.url || null}
            onChange={(url) => patch(i, { url: url ?? "" })}
            disabled={disabled}
            label="The file itself"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...files, { name: "", url: "" }])}
        disabled={disabled}
        style={{
          alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13.5px",
          fontWeight: 600, color: disabled ? "rgba(16,35,63,.35)" : BLUE, background: "none",
          border: "none", padding: 0, minHeight: "42px", cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        + Add a printable
      </button>
    </div>
  );
}
