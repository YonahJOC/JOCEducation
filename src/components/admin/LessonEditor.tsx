"use client";

import { useState, useTransition } from "react";
import { saveLesson } from "@/app/actions/content";

const INK = "#10233F";
const BLUE = "#2D46AF";
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
};

export const EMPTY_LESSON: LessonDraft = {
  title: "", theme: "", description: "", grade: "es", timeMinutes: 20, prep: "Minimal",
  cycleSlug: null, published: false, featured: false,
  objectives: [""], materials: [""], discussion: [""],
  steps: [{ duration: "5 min", title: "", description: "" }],
};

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};
const section: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px",
  padding: "20px", marginBottom: "14px",
};
const legend: React.CSSProperties = {
  fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase",
  fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px",
};

export function LessonEditor({
  initial, cycles, disabled, onDone,
}: {
  initial: LessonDraft;
  cycles: { slug: string; theme: string; num: number }[];
  disabled?: boolean;
  onDone?: () => void;
}) {
  const [d, setD] = useState<LessonDraft>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof LessonDraft>(k: K, v: LessonDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  const stepTotal = d.steps.reduce((n, s) => n + (parseInt(s.duration, 10) || 0), 0);
  const mismatch = stepTotal > 0 && stepTotal !== d.timeMinutes;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveLesson(d);
      if (r.ok) { setMsg("Saved."); onDone?.(); }
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit}>
      <div style={section}>
        <p style={legend}>The lesson</p>
        <div style={{ marginBottom: "12px" }}>
          <label style={label}>Title</label>
          <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="What students will do" style={field} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={label}>Theme / middah</label>
            <input value={d.theme} onChange={(e) => set("theme", e.target.value)} style={field} />
          </div>
          <div>
            <label style={label}>Grade band</label>
            <select value={d.grade} onChange={(e) => set("grade", e.target.value as LessonDraft["grade"])} style={field}>
              <option value="es">Elementary</option>
              <option value="ms">Middle school</option>
              <option value="hs">High school</option>
            </select>
          </div>
          <div>
            <label style={label}>Minutes</label>
            <select value={d.timeMinutes} onChange={(e) => set("timeMinutes", Number(e.target.value))} style={field}>
              {[20, 40, 60, 90].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Prep</label>
            <select value={d.prep} onChange={(e) => set("prep", e.target.value as LessonDraft["prep"])} style={field}>
              <option>Minimal</option><option>Moderate</option><option>Substantial</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label style={label}>Chesed Cycle</label>
          <select
            value={d.cycleSlug ?? ""}
            onChange={(e) => set("cycleSlug", e.target.value || null)}
            style={field}
          >
            <option value="">Not tied to a cycle</option>
            {cycles.map((c) => <option key={c.slug} value={c.slug}>Cycle {c.num} — {c.theme}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Description</label>
          <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Two sentences for the card" style={{ ...field, resize: "vertical" }} />
        </div>
      </div>

      <div style={section}>
        <p style={legend}>Objectives</p>
        <ListField items={d.objectives} onChange={(v) => set("objectives", v)} placeholder="Students will…" />
      </div>

      <div style={section}>
        <p style={legend}>Materials</p>
        <ListField items={d.materials} onChange={(v) => set("materials", v)} placeholder="What the teacher needs" />
      </div>

      <div style={section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
          <p style={{ ...legend, margin: 0 }}>Steps</p>
          <span style={{ fontSize: "12.5px", color: mismatch ? "#C96C00" : "rgba(16,35,63,.5)" }}>
            {stepTotal} of {d.timeMinutes} min{mismatch ? " — doesn't add up" : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {d.steps.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "78px 1fr 30px", gap: "8px", alignItems: "start" }}>
              <input
                value={s.duration}
                onChange={(e) => set("steps", d.steps.map((x, j) => j === i ? { ...x, duration: e.target.value } : x))}
                placeholder="5 min" style={field}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <input
                  value={s.title}
                  onChange={(e) => set("steps", d.steps.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  placeholder="Step title" style={field}
                />
                <textarea
                  value={s.description}
                  onChange={(e) => set("steps", d.steps.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  rows={2} placeholder="What happens" style={{ ...field, resize: "vertical" }}
                />
              </div>
              <button
                type="button"
                onClick={() => set("steps", d.steps.filter((_, j) => j !== i))}
                aria-label={`Remove step ${i + 1}`}
                style={{ background: "none", border: "none", color: "rgba(16,35,63,.4)", cursor: "pointer", fontSize: "18px", minHeight: "42px" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("steps", [...d.steps, { duration: "5 min", title: "", description: "" }])}
          style={{ marginTop: "10px", fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          + Add step
        </button>
      </div>

      <div style={section}>
        <p style={legend}>Discussion questions</p>
        <ListField items={d.discussion} onChange={(v) => set("discussion", v)} placeholder="A question to ask the class" />
      </div>

      <div style={{ ...section, display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
          <input type="checkbox" checked={d.published} onChange={(e) => set("published", e.target.checked)} style={{ width: "16px", height: "16px" }} />
          Published
        </label>
        <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
          <input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} style={{ width: "16px", height: "16px" }} />
          Featured
        </label>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={disabled || pending || !d.title.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14.5px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "13px 24px",
            minHeight: "44px", cursor: disabled || !d.title.trim() ? "not-allowed" : "pointer",
            opacity: disabled || pending || !d.title.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : d.id ? "Save changes" : "Create lesson"}
        </button>
        {msg && (
          <span style={{ fontSize: "13.5px", color: msg === "Saved." ? "#1B7F4B" : "#B8321E" }}>{msg}</span>
        )}
      </div>
    </form>
  );
}

function ListField({
  items, onChange, placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 30px", gap: "8px" }}>
            <input
              value={t}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={placeholder}
              style={field}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`Remove item ${i + 1}`}
              style={{ background: "none", border: "none", color: "rgba(16,35,63,.4)", cursor: "pointer", fontSize: "18px", minHeight: "42px" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        style={{ marginTop: "9px", fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        + Add
      </button>
    </>
  );
}
