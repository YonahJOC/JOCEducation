"use client";

import { useState, useTransition } from "react";
import { saveProgram, deleteProgram, seedProgramsFromStatic } from "@/app/actions/content";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RED = "#B8321E";
const RULE = "rgba(16,35,63,.15)";

export type ProgramRow = {
  id: number;
  slug: string;
  name: string;
  tag: string;
  tagline: string;
  description: string;
  heroColor: string;
  meta: string;
  available: string[];
  whatsIncluded: string[];
  howItWorks: { step: string; title: string; description: string }[];
  externalHref: string | null;
  cta: string;
  published: boolean;
  sort: number;
};

const TAGS = ["Event", "Ongoing", "Platform", "One-time", "Trip"];
const PLANS = [
  "JOC Education",
  "JOC App + JOC Education",
  "Full JOC Partnership",
  "All subscriptions (per-event pricing)",
];

const BLANK: ProgramRow = {
  id: 0, slug: "", name: "", tag: "Ongoing", tagline: "", description: "",
  heroColor: "#2D46AF", meta: "", available: [], whatsIncluded: [""],
  howItWorks: [{ step: "01", title: "", description: "" }],
  externalHref: null, cta: "Register your school", published: false, sort: 0,
};

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px", padding: "10px 12px",
  outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "rgba(16,35,63,.6)", marginBottom: "5px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

export function ProgramsClient({
  programs, usingStatic, disabled,
}: {
  programs: ProgramRow[];
  /** True while the public site is still reading lib/programs.ts. */
  usingStatic: boolean;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState<ProgramRow | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function importStatic() {
    setMsg(null);
    start(async () => {
      const r = await seedProgramsFromStatic();
      setMsg(r.ok ? "Imported." : r.error);
    });
  }

  if (editing) {
    return (
      <ProgramForm
        initial={editing}
        disabled={disabled}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: 0 }}>Programs</h1>
        <button
          onClick={() => setEditing({ ...BLANK, sort: programs.length })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New program
        </button>
      </div>

      <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.6)", lineHeight: 1.55, margin: "0 0 18px", maxWidth: "70ch" }}>
        What JOC runs for schools. Anything published here replaces the built-in list on{" "}
        <strong style={{ color: INK }}>/programs</strong> — so this is where Boots for Israel, Run
        for Chesed, The Kind Store, Just One Simcha and the Israel trips get added.
      </p>

      {usingStatic && (
        <div style={{ backgroundColor: "#FDEEDA", border: "1px solid rgba(154,84,5,.25)", borderRadius: "14px", padding: "16px 18px", marginBottom: "18px" }}>
          <p style={{ fontSize: "14px", color: "#7C4A00", margin: "0 0 10px", lineHeight: 1.55 }}>
            The site is still showing the six programs written into the code. Import them here
            first, then edit them and add the rest — otherwise publishing one new program would
            hide the other six.
          </p>
          <button
            onClick={importStatic}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px", color: "#fff",
              backgroundColor: "#9A5405", border: "none", borderRadius: "9999px",
              padding: "10px 18px", minHeight: "42px", cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Importing…" : "Import the six built-in programs"}
          </button>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13.5px", color: msg === "Imported." ? GREEN : RED, marginBottom: "14px" }}>{msg}</p>
      )}

      {programs.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", margin: 0 }}>Nothing here yet.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
          {programs.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "14px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(16,35,63,.07)",
              }}
            >
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: p.heroColor, flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "14.5px", fontWeight: 600, color: INK, margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0" }}>
                  {p.tag} · /programs/{p.slug}
                  {p.published ? "" : " · draft"}
                </p>
              </div>
              <button
                onClick={() => setEditing(p)}
                disabled={disabled}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramForm({
  initial, disabled, onDone,
}: {
  initial: ProgramRow;
  disabled?: boolean;
  onDone: () => void;
}) {
  const [d, setD] = useState<ProgramRow>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof ProgramRow>(k: K, v: ProgramRow[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveProgram({
        id: d.id || undefined,
        slug: d.slug || slugify(d.name),
        name: d.name,
        tag: d.tag,
        tagline: d.tagline,
        description: d.description,
        heroColor: d.heroColor,
        meta: d.meta,
        available: d.available,
        whatsIncluded: d.whatsIncluded,
        howItWorks: d.howItWorks,
        externalHref: d.externalHref,
        cta: d.cta,
        published: d.published,
        sort: d.sort,
      });
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete ${d.name}? The page at /programs/${d.slug} will 404.`)) return;
    start(async () => {
      const r = await deleteProgram(d.id);
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit}>
      <button
        type="button"
        onClick={onDone}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
      >
        ← All programs
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
        {d.id ? `Edit ${initial.name}` : "New program"}
      </h1>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={label}>Name</label>
            <input value={d.name} onChange={(e) => set("name", e.target.value)} disabled={disabled} style={field} autoFocus />
          </div>
          <div>
            <label style={label}>Web address</label>
            <input
              value={d.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder={slugify(d.name) || "boots-for-israel"}
              disabled={disabled}
              style={field}
            />
            <p style={{ fontSize: "11.5px", color: "rgba(16,35,63,.5)", margin: "4px 0 0" }}>
              /programs/{d.slug || slugify(d.name) || "…"}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={label}>Kind</label>
            <select value={d.tag} onChange={(e) => set("tag", e.target.value)} disabled={disabled} style={field}>
              {TAGS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Header colour</label>
            <input value={d.heroColor} onChange={(e) => set("heroColor", e.target.value)} disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Order</label>
            <input
              type="number"
              value={d.sort}
              onChange={(e) => set("sort", Number(e.target.value))}
              disabled={disabled}
              style={field}
            />
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={label}>One line under the name</label>
          <input value={d.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Chesed students can run — and own." disabled={disabled} style={field} />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={label}>What it is</label>
          <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={3} disabled={disabled} style={{ ...field, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div>
            <label style={label}>Practical line</label>
            <input value={d.meta} onChange={(e) => set("meta", e.target.value)} placeholder="Half-day setup · All grade levels" disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Button wording</label>
            <input value={d.cta} onChange={(e) => set("cta", e.target.value)} disabled={disabled} style={field} />
          </div>
        </div>
      </div>

      <div style={card}>
        <p style={{ ...label, marginBottom: "10px" }}>Included with these plans</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {PLANS.map((plan) => (
            <label key={plan} style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK, minHeight: "36px" }}>
              <input
                type="checkbox"
                checked={d.available.includes(plan)}
                onChange={(e) =>
                  set("available", e.target.checked
                    ? [...d.available, plan]
                    : d.available.filter((a) => a !== plan))
                }
                disabled={disabled}
                style={{ width: "16px", height: "16px" }}
              />
              {plan}
            </label>
          ))}
        </div>
      </div>

      <div style={card}>
        <p style={{ ...label, marginBottom: "10px" }}>What the school gets</p>
        <Lines items={d.whatsIncluded} onChange={(v) => set("whatsIncluded", v)} placeholder="Branded booth display and signage" disabled={disabled} />
      </div>

      <div style={card}>
        <p style={{ ...label, marginBottom: "10px" }}>How it works</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {d.howItWorks.map((s, i) => (
            <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: "12px", padding: "12px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input
                  value={s.step}
                  onChange={(e) => set("howItWorks", d.howItWorks.map((x, n) => n === i ? { ...x, step: e.target.value } : x))}
                  disabled={disabled}
                  style={{ ...field, width: "70px", flexShrink: 0 }}
                />
                <input
                  value={s.title}
                  onChange={(e) => set("howItWorks", d.howItWorks.map((x, n) => n === i ? { ...x, title: e.target.value } : x))}
                  placeholder="Register your event"
                  disabled={disabled}
                  style={field}
                />
                <button
                  type="button"
                  onClick={() => set("howItWorks", d.howItWorks.filter((_, n) => n !== i))}
                  disabled={disabled}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: RED, background: "none", border: "none", cursor: "pointer", minHeight: "42px", flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
              <textarea
                value={s.description}
                onChange={(e) => set("howItWorks", d.howItWorks.map((x, n) => n === i ? { ...x, description: e.target.value } : x))}
                rows={2}
                placeholder="What happens at this step"
                disabled={disabled}
                style={{ ...field, resize: "vertical" }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("howItWorks", [...d.howItWorks, { step: String(d.howItWorks.length + 1).padStart(2, "0"), title: "", description: "" }])}
            disabled={disabled}
            style={{ alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", padding: 0, minHeight: "42px", cursor: "pointer" }}
          >
            + Add a step
          </button>
        </div>
      </div>

      <div style={card}>
        <label style={label}>Runs on another JOC site</label>
        <input
          value={d.externalHref ?? ""}
          onChange={(e) => set("externalHref", e.target.value || null)}
          placeholder="https://chesedmatch.org — leave empty for a normal program"
          disabled={disabled}
          style={field}
        />
      </div>

      <div style={{ ...card, display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
          <input type="checkbox" checked={d.published} onChange={(e) => set("published", e.target.checked)} disabled={disabled} style={{ width: "16px", height: "16px" }} />
          Published — visible on the site
        </label>
        <button
          type="submit"
          disabled={disabled || pending || !d.name.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 24px",
            minHeight: "44px", cursor: pending ? "wait" : "pointer",
            opacity: disabled || pending || !d.name.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {d.id > 0 && (
          <button
            type="button"
            onClick={remove}
            disabled={disabled || pending}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: RED, background: "none", border: "none", cursor: "pointer", minHeight: "44px", marginLeft: "auto" }}
          >
            Delete
          </button>
        )}
      </div>

      {msg && <p style={{ fontSize: "13.5px", color: RED, margin: 0 }}>{msg}</p>}
    </form>
  );
}

/** A simple ordered list of one-line entries. */
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
            style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", color: "rgba(16,35,63,.4)", background: "none", border: "none", cursor: "pointer", minWidth: "36px", minHeight: "42px" }}
            aria-label="Remove"
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
