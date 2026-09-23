"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveCycle, deleteCycle, importStaticCycles } from "@/app/actions/cycles";
import { formatCycleRange, relinkCycles } from "@/lib/cycles";
import { PageIntro } from "@/components/admin/PageIntro";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1D6B37";
const RED = "#A3261A";
const RULE = "rgba(16,35,63,.15)";

export type CycleRow = {
  id: number;
  num: number;
  slug: string;
  theme: string;
  gloss: string;
  question: string;
  hebrew: string;
  anchor: string;
  range: string;
  startDate: string;
  endDate: string;
  weeks: number;
  color: string;
  tags: string[];
  desc: string;
  focus: string[];
  weekPlan: { title: string; body: string }[];
  lessonCount: number;
};

const BLANK: CycleRow = {
  id: 0, num: 1, slug: "", theme: "", gloss: "", question: "",
  hebrew: "", anchor: "", range: "", startDate: "", endDate: "",
  weeks: 4, color: "#2D46AF", tags: [], desc: "", focus: [""],
  weekPlan: [{ title: "", body: "" }], lessonCount: 0,
};

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px", outline: "none",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "#4A5A74", marginBottom: "5px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
};

const STEPS = [
  "Open a cycle to change it. Everything the site shows during those weeks follows what is here.",
  "To make a cycle longer or shorter, change its last day. Everything after it shifts to follow, keeping its own length — you never have to edit the other cycles to make room.",
  "To move the whole year, change the first day of Cycle 1. Only Cycle 1 has a first day you can set; every other cycle begins when the one before it ends.",
  "Before you save, the box under the dates lists exactly which cycles move and where they land. Nothing is hidden until afterwards.",
  "The theme is the name; the line under it is the plain-English meaning; the question is what it asks a student.",
  "The lesson plan breakdown is the stages the cycle moves through — it is what a teacher reads to see how it runs. There is no need for one per week.",
  "Press Save. It is live immediately — there is no separate publish step for cycles.",
];

/** Starting suggestions only — the real list is whatever JOC has used. */
const SUGGESTED_TAGS = ["Yom tov", "Whole school", "Community-wide"];

export function CyclesClient({
  cycles, usingStatic, disabled,
}: {
  cycles: CycleRow[];
  usingStatic: boolean;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState<CycleRow | null>(null);
  const allTags = [...new Set([...cycles.flatMap((c) => c.tags), ...SUGGESTED_TAGS])].sort();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (editing) {
    return <CycleForm initial={editing} siblings={cycles} allTags={allTags} disabled={disabled} onDone={() => setEditing(null)} />;
  }

  return (
    <div>
      <PageIntro
        title="Chesed Cycles"
        what="The eight themes the school year is built around. Whichever one today falls inside is the cycle the whole site points at — the home page, the cycle pages, and everything tagged to it."
        steps={STEPS}
        note="The cycles are one continuous chain — each begins the day after the one before it ends, so there can never be a gap or an overlap. Changing one date is always a single action; the console does the rest."
      >
        <button
          onClick={() => setEditing({ ...BLANK, num: cycles.length + 1 })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New cycle
        </button>
      </PageIntro>

      {usingStatic && (
        <div style={{ backgroundColor: "#FFF0E0", border: "1px solid rgba(154,84,5,.25)", borderRadius: "14px", padding: "16px 18px", marginBottom: "18px" }}>
          <p style={{ fontSize: "14px", color: "#7C4A00", margin: "0 0 10px", lineHeight: 1.55 }}>
            The site is showing the eight cycles written into the code. Bring them in here and they
            become editable — nothing on the site changes when you do.
          </p>
          <button
            onClick={() => start(async () => {
              const r = await importStaticCycles();
              setMsg(r.ok ? "Imported." : r.error);
            })}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px", color: "#fff",
              backgroundColor: "#C96C00", border: "none", borderRadius: "9999px",
              padding: "10px 18px", minHeight: "42px", cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Importing…" : "Bring in the eight cycles"}
          </button>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13.5px", color: msg === "Imported." ? GREEN : RED, marginBottom: "14px" }}>{msg}</p>
      )}

      {cycles.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#4A5A74", margin: 0 }}>Nothing here yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cycles.map((c) => {
            const now = Date.now();
            const running = now >= new Date(c.startDate).getTime() && now <= new Date(c.endDate).getTime() + 86_400_000;
            const past = now > new Date(c.endDate).getTime() + 86_400_000;
            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: "#fff", border: running ? `1.5px solid ${c.color}` : "1px solid rgba(16,35,63,.09)",
                  borderRadius: "16px", padding: "16px 18px",
                  display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                  opacity: past ? 0.65 : 1,
                }}
              >
                <span style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: c.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
                  {c.num}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: "15.5px", fontWeight: 700, color: INK, margin: 0 }}>
                    {c.theme}
                    {running && (
                      <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#fff", backgroundColor: c.color, borderRadius: "9999px", padding: "2px 9px", marginLeft: "9px", letterSpacing: "0.06em" }}>
                        RUNNING NOW
                      </span>
                    )}
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "10.5px", fontWeight: 700, color: "#4A5A74",
                          backgroundColor: "rgba(16,35,63,.07)", borderRadius: "9999px",
                          padding: "2px 8px", marginLeft: "8px", letterSpacing: "0.04em",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </p>
                  <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "2px 0 0" }}>
                    {c.range} · {c.weeks} weeks · {c.hebrew} ·{" "}
                    {c.lessonCount > 0
                      ? `${c.lessonCount} lesson${c.lessonCount === 1 ? "" : "s"}`
                      : "no lessons yet"}
                  </p>
                </div>
                <Link
                  href={`/cycles/${c.slug}`}
                  style={{ fontSize: "13px", fontWeight: 600, color: "#4A5A74", textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
                >
                  View
                </Link>
                <button
                  onClick={() => setEditing(c)}
                  disabled={disabled}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CycleForm({
  initial, siblings, allTags, disabled, onDone,
}: {
  initial: CycleRow;
  /** Every cycle, this one included — needed to work out what a date change moves. */
  siblings: CycleRow[];
  /** Every label already in use, offered as suggestions. */
  allTags: string[];
  disabled?: boolean;
  onDone: () => void;
}) {
  const [d, setD] = useState<CycleRow>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof CycleRow>(k: K, v: CycleRow[K]) => setD((p) => ({ ...p, [k]: v }));

  // Both shown live, so neither can disagree with the dates.
  const derivedWeeks = (() => {
    const s = new Date(d.startDate).getTime();
    const e = new Date(d.endDate).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
    return Math.max(1, Math.round((e - s) / (7 * 86_400_000)));
  })();

  const derivedRange = d.startDate && d.endDate ? formatCycleRange(d.startDate, d.endDate) : "";

  const isFirst = siblings.length === 0 || d.num <= Math.min(...siblings.map((c) => c.num), d.num);

  /**
   * Where the rest of the year lands if this is saved.
   *
   * Moving one cycle moves every cycle after it, which is a big enough
   * consequence that nobody should have to press Save to discover it.
   */
  const knockOn = (() => {
    if (!d.startDate || !d.endDate) return [];
    const ordered = [...siblings.filter((c) => c.id !== d.id), { id: d.id, num: d.num, theme: d.theme, startDate: d.startDate, endDate: d.endDate }]
      .sort((a, b) => a.num - b.num);
    return relinkCycles(ordered)
      .map((c) => {
        const before = siblings.find((s) => s.id === c.id);
        if (!before || c.id === d.id) return null;
        if (before.startDate === c.startDate && before.endDate === c.endDate) return null;
        return { num: c.num, theme: c.theme, from: formatCycleRange(before.startDate, before.endDate), to: formatCycleRange(c.startDate, c.endDate) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  })();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveCycle({
        id: d.id || undefined,
        num: d.num,
        slug: d.slug || undefined,
        theme: d.theme, gloss: d.gloss, question: d.question,
        hebrew: d.hebrew, anchor: d.anchor,
        startDate: d.startDate, endDate: d.endDate,
        color: d.color, tags: d.tags, desc: d.desc,
        focus: d.focus, weekPlan: d.weekPlan,
      });
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete Cycle ${d.num}? Lessons tagged to it will lose their tag.`)) return;
    start(async () => {
      const r = await deleteCycle(d.id);
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "820px" }}>
      <button
        type="button"
        onClick={onDone}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
      >
        ← All cycles
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
        {d.id ? `Cycle ${initial.num} — ${initial.theme}` : "New cycle"}
      </h1>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={label}>Number</label>
            <input type="number" min={1} value={d.num} onChange={(e) => set("num", Number(e.target.value))} disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Theme</label>
            <input value={d.theme} onChange={(e) => set("theme", e.target.value)} placeholder="Hakarat Hatov" disabled={disabled} style={field} autoFocus />
          </div>
          <div>
            <label style={label}>Colour</label>
            <input value={d.color} onChange={(e) => set("color", e.target.value)} disabled={disabled} style={field} />
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={label}>What it means, in plain English</label>
          <input value={d.gloss} onChange={(e) => set("gloss", e.target.value)} placeholder="Recognising the good that is done for us" disabled={disabled} style={field} />
        </div>

        <div>
          <label style={label}>The question it asks a student</label>
          <input value={d.question} onChange={(e) => set("question", e.target.value)} placeholder="Who have I not thanked?" disabled={disabled} style={field} />
          <p style={{ fontSize: "12px", color: "#4A5A74", margin: "5px 0 0" }}>
            Shown large on the cycle page, and to the education team while they write a lesson for it.
          </p>
        </div>
      </div>

      <div style={card}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 14px" }}>
          When it runs
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={label}>First day</label>
            {/* Only the first cycle of the year has a start worth choosing.
                Every other one begins when the cycle before it finishes —
                offering a free date picker here is what let the year drift
                into overlaps and gaps in the first place. */}
            {isFirst ? (
              <input type="date" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} disabled={disabled} style={field} />
            ) : (
              <p style={{ ...field, display: "flex", alignItems: "center", backgroundColor: "#FBF9F4", color: INK, margin: 0 }}>
                {d.startDate ? formatCycleRange(d.startDate, d.startDate).split(" – ")[0] : "No date yet"}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "#4A5A74", margin: "5px 0 0" }}>
              {isFirst
                ? "The first day of the school year. Everything else follows from here."
                : `The day after Cycle ${d.num - 1} ends.`}
            </p>
          </div>
          <div>
            <label style={label}>Last day</label>
            <input type="date" value={d.endDate} onChange={(e) => set("endDate", e.target.value)} disabled={disabled} style={field} />
            <p style={{ fontSize: "12px", color: "#4A5A74", margin: "5px 0 0" }}>
              Change this and the later cycles move with it.
            </p>
          </div>
          <div>
            <label style={label}>Length</label>
            <p style={{ ...field, display: "flex", alignItems: "center", backgroundColor: "#FBF9F4", color: derivedWeeks ? INK : "#4A5A74", margin: 0 }}>
              {derivedWeeks ? `${derivedWeeks} weeks` : "set both dates"}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div>
            <label style={label}>Hebrew months</label>
            <input value={d.hebrew} onChange={(e) => set("hebrew", e.target.value)} placeholder="Kislev – Teves" disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>What it is pinned to</label>
            <input value={d.anchor} onChange={(e) => set("anchor", e.target.value)} placeholder="Chanukah" disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Dates as written on the site</label>
            {/* This is the line every public page shows. It used to be typed
                here by hand, which meant you could change the two dates above
                and the whole site would carry on showing the old ones. */}
            <p style={{ ...field, display: "flex", alignItems: "center", backgroundColor: "#FBF9F4", color: derivedRange ? INK : "#4A5A74", margin: 0 }}>
              {derivedRange || "set both dates"}
            </p>
          </div>
        </div>

        {/* Moving one cycle moves every cycle after it. That is a big enough
            consequence that it should be visible before Save, not discovered
            afterwards. */}
        {knockOn.length > 0 && (
          <div style={{ backgroundColor: "#F4F7FD", borderRadius: "12px", padding: "14px 16px", marginTop: "14px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: INK, margin: "0 0 8px" }}>
              Saving this also moves {knockOn.length} later cycle{knockOn.length === 1 ? "" : "s"}:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {knockOn.map((k) => (
                <p key={k.num} style={{ fontSize: "13px", color: "#4A5A74", margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: INK, fontWeight: 600 }}>Cycle {k.num} — {k.theme}</strong>{" "}
                  <span style={{ color: "#4A5A74", textDecoration: "line-through" }}>{k.from}</span>{" "}
                  → {k.to}
                </p>
              ))}
            </div>
            <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "9px 0 0", lineHeight: 1.5 }}>
              Each one keeps its own length. You do not need to edit them yourself.
            </p>
          </div>
        )}

        {/* This was a single "Israel-focused" checkbox, which meant that was
            the only label the site could ever show — anything else needed a
            developer. Cycles now carry as many labels as apply, and the team
            names them. Suggestions below are a starting point, not the list. */}
        <div style={{ marginTop: "18px" }}>
          <p style={{ ...label, marginBottom: "8px" }}>Labels</p>
          <TagPicker
            tags={d.tags}
            onChange={(v) => set("tags", v)}
            suggestions={allTags}
            disabled={disabled}
          />
          <p style={{ fontSize: "12px", color: "#4A5A74", margin: "8px 0 0" }}>
            Shown on the cycle page. Pick as many as apply, or type your own.
          </p>
        </div>
      </div>

      <div style={card}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 14px" }}>
          About this cycle
        </p>
        <textarea value={d.desc} onChange={(e) => set("desc", e.target.value)} rows={3} placeholder="A paragraph a teacher reads to understand what these weeks are for." disabled={disabled} style={{ ...field, resize: "vertical" }} />

        <p style={{ ...label, margin: "16px 0 8px" }}>What the weeks focus on</p>
        <Lines items={d.focus} onChange={(v) => set("focus", v)} placeholder="One thing this cycle asks of a school" disabled={disabled} />
      </div>

      <div style={card}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 6px" }}>
          Lesson plan breakdown
        </p>
        {/* This used to read "The dates give 8 weeks. You have written 4.",
            which stated a rule that was never true: the breakdown is the
            stages a cycle moves through, not one entry per week. Cycle 1 runs
            eight weeks in four stages on purpose. It says what it is now, and
            stops telling anybody off. */}
        <p style={{ fontSize: "13.5px", color: "#4A5A74", margin: "0 0 14px", lineHeight: 1.55 }}>
          The stages this cycle moves through, in order — what a teacher reads to see how it runs.
          {derivedWeeks
            ? ` These ${d.weekPlan.length} stage${d.weekPlan.length === 1 ? "" : "s"} spread across ${derivedWeeks} week${derivedWeeks === 1 ? "" : "s"}; there is no need for one each.`
            : ""}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {d.weekPlan.map((w, i) => (
            <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: "12px", padding: "12px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#4A5A74", flexShrink: 0, minWidth: "54px" }}>
                  STEP {i + 1}
                </span>
                <input
                  value={w.title}
                  onChange={(e) => set("weekPlan", d.weekPlan.map((x, n) => n === i ? { ...x, title: e.target.value } : x))}
                  placeholder="What this stage is called"
                  disabled={disabled}
                  style={field}
                />
                <button
                  type="button"
                  onClick={() => set("weekPlan", d.weekPlan.filter((_, n) => n !== i))}
                  disabled={disabled}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: RED, background: "none", border: "none", cursor: "pointer", minHeight: "42px", flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
              <textarea
                value={w.body}
                onChange={(e) => set("weekPlan", d.weekPlan.map((x, n) => n === i ? { ...x, body: e.target.value } : x))}
                rows={2}
                placeholder="What happens in the classroom this week"
                disabled={disabled}
                style={{ ...field, resize: "vertical" }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("weekPlan", [...d.weekPlan, { title: "", body: "" }])}
            disabled={disabled}
            style={{ alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", padding: 0, minHeight: "42px", cursor: "pointer" }}
          >
            + Add a week
          </button>
        </div>
      </div>

      <div style={{ ...card, display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={disabled || pending || !d.theme.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 24px",
            minHeight: "46px", cursor: pending ? "wait" : "pointer",
            opacity: disabled || pending || !d.theme.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <span style={{ fontSize: "13px", color: "#4A5A74" }}>
          Saving puts this on the site straight away.
        </span>
        {d.id > 0 && (
          <button
            type="button"
            onClick={remove}
            disabled={disabled || pending}
            style={{ marginLeft: "auto", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: RED, background: "none", border: "none", cursor: "pointer", minHeight: "46px" }}
          >
            Delete
          </button>
        )}
      </div>

      {msg && <p style={{ fontSize: "13.5px", color: RED, margin: 0 }}>{msg}</p>}
    </form>
  );
}

function Lines({
  items, onChange, placeholder, disabled,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: "8px" }}>
          <input
            value={v}
            onChange={(e) => onChange(items.map((x, n) => (n === i ? e.target.value : x)))}
            placeholder={placeholder}
            disabled={disabled}
            style={field}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, n) => n !== i))}
            disabled={disabled}
            aria-label="Remove"
            style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minWidth: "36px", minHeight: "42px" }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        disabled={disabled}
        style={{ alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", padding: 0, minHeight: "42px", cursor: "pointer" }}
      >
        + Add
      </button>
    </div>
  );
}

/**
 * Pick as many labels as apply, and add your own.
 *
 * Replaced a single hardcoded "Israel-focused" checkbox. Suggestions are
 * whatever JOC has already used elsewhere, so the vocabulary grows on its own
 * rather than needing a developer each time a new one is wanted.
 */
function TagPicker({
  tags, onChange, suggestions, disabled,
}: {
  tags: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const has = (t: string) => tags.some((x) => x.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t || has(t) || tags.length >= 12) return;
    onChange([...tags, t]);
    setDraft("");
  };
  const toggle = (t: string) =>
    has(t) ? onChange(tags.filter((x) => x.toLowerCase() !== t.toLowerCase())) : add(t);

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                fontSize: "13px", fontWeight: 600, color: BLUE,
                backgroundColor: "rgba(45,70,175,.08)", border: `1px solid rgba(45,70,175,.25)`,
                borderRadius: "9999px", padding: "6px 8px 6px 13px",
              }}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                disabled={disabled}
                aria-label={`Remove ${t}`}
                style={{
                  fontFamily: "var(--font-outfit)", fontSize: "15px", lineHeight: 1,
                  color: BLUE, background: "none", border: "none", cursor: "pointer",
                  padding: "0 4px", opacity: 0.7,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        {suggestions.filter((t) => !has(t)).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            disabled={disabled}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 500,
              color: "#4A5A74", backgroundColor: "#fff",
              border: `1px dashed ${RULE}`, borderRadius: "9999px",
              padding: "6px 13px", minHeight: "36px",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            + {t}
          </button>
        ))}
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        // Enter adds the label rather than submitting the whole cycle form,
        // which is what it would otherwise do.
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => add(draft)}
        placeholder="Add your own, then press Enter"
        disabled={disabled || tags.length >= 12}
        style={{ ...field, maxWidth: "320px" }}
      />
    </div>
  );
}
