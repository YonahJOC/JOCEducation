"use client";

import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { useState, useTransition } from "react";
import { saveProgram, deleteProgram, seedProgramsFromStatic } from "@/app/actions/content";
import { PageIntro } from "@/components/admin/PageIntro";

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
  howItWorks: { step: string; title: string; description: string; linkLabel?: string | null; linkUrl?: string | null }[];
  externalHref: string | null;
  videoUrl: string | null;
  leadCount?: number;
  responseCount?: number;
  cta: string;
  published: boolean;
  comingSoon: boolean;
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
  howItWorks: [{ step: "01", title: "", description: "", linkLabel: "", linkUrl: "" }],
  externalHref: null, videoUrl: null, leadCount: 0, responseCount: 0, cta: "Register your school", published: false, comingSoon: false, sort: 0,
};

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: C.ink, backgroundColor: "#fff",
  border: `1px solid ${C.hairline}`, borderRadius: "10px", padding: "10px 12px",
  outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "#4A5A74", marginBottom: "5px",
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
      <PageIntro
        title="Programs"
        what="What JOC actually runs for schools — the Kindness Booth, Bake for Chesed and the rest. This is the list a school reads before deciding to bring one in, so it is worth writing properly."
        steps={[
          "If the orange notice below is showing, press the import button in it first. That copies the programs written into the code into this console so you can edit them. Adding a new one before importing would hide all of them.",
          "Press “+ New program”.",
          "Give it a name and one line saying what it is. That line is what a school reads on the list before clicking through.",
          "Write the longer description, then add the steps — what a school actually does, in order, from getting in touch to running it.",
          "Set the order number to move it up or down the page. Lower numbers come first.",
          "Tick Published, then Save. It is on /programs immediately.",
        ]}
        note="Still to be added: Boots for Israel, The Kind Store for Schools, Run for Chesed, Just One Simcha and the Israel trips."
      >
        <button
          onClick={() => setEditing({ ...BLANK, sort: programs.length })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New program
        </button>
      </PageIntro>

      {usingStatic && (
        <div style={{ backgroundColor: "#FFF0E0", border: "1px solid rgba(154,84,5,.25)", borderRadius: "14px", padding: "16px 18px", marginBottom: "18px" }}>
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
              backgroundColor: "#C96C00", border: "none", borderRadius: "9999px",
              padding: "10px 18px", minHeight: "42px", cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Importing…" : "Import the six built-in programs"}
          </button>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13.5px", color: msg === "Imported." ? C.greenText : C.redText, marginBottom: "14px" }}>{msg}</p>
      )}

      {programs.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#4A5A74", margin: 0 }}>Nothing here yet.</p>
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
                {/* The name is the way in. It used to be plain text beside a
                    link labelled "Sign-ups", so the page holding the form and
                    the coordinators was behind a word that named neither. */}
                <Link
                  href={`/admin/programs/${p.slug}`}
                  style={{ fontSize: "14.5px", fontWeight: 600, color: C.ink, textDecoration: "none", display: "inline-block", minHeight: "26px" }}
                >
                  {p.name}
                </Link>
                <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "2px 0 0" }}>
                  {p.tag} · /programs/{p.slug}
                  {p.published ? "" : " · draft"}{p.comingSoon ? " · coming soon" : ""}
                </p>
                <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "3px 0 0" }}>
                  {p.leadCount
                    ? `${p.leadCount} coordinator${p.leadCount === 1 ? "" : "s"}`
                    : "No coordinator yet"}
                  {" · "}
                  {p.responseCount
                    ? `${p.responseCount} sign-up${p.responseCount === 1 ? "" : "s"}`
                    : "no sign-ups"}
                </p>
              </div>
              <Link
                href={`/admin/programs/${p.slug}`}
                style={{ fontSize: "13px", fontWeight: 600, color: C.blue, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
              >
                Form &amp; coordinators →
              </Link>
              <button
                onClick={() => setEditing(p)}
                disabled={disabled}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                Edit page
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
        videoUrl: d.videoUrl,
        cta: d.cta,
        published: d.published,
        comingSoon: d.comingSoon,
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
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
      >
        ← All programs
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: C.ink, margin: "0 0 20px" }}>
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
            <p style={{ fontSize: "11.5px", color: "#4A5A74", margin: "4px 0 0" }}>
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
            <label key={plan} style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: C.ink, minHeight: "36px" }}>
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
            <div key={i} style={{ border: `1px solid ${C.hairline}`, borderRadius: "12px", padding: "12px" }}>
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
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: "pointer", minHeight: "42px", flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
              <textarea
                value={s.description}
                onChange={(e) => set("howItWorks", d.howItWorks.map((x, n) => n === i ? { ...x, description: e.target.value } : x))}
                rows={2}
                placeholder="What happens at this stage"
                disabled={disabled}
                style={{ ...field, resize: "vertical" }}
              />

              {/* The one thing to do at this stage. Without it the page
                  describes a process and keeps the process somewhere else. */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <input
                  value={s.linkLabel ?? ""}
                  onChange={(e) => set("howItWorks", d.howItWorks.map((x, n) => n === i ? { ...x, linkLabel: e.target.value } : x))}
                  placeholder="Button text — “Book a time”"
                  disabled={disabled}
                  style={{ ...field, flex: "1 1 180px", minWidth: 0 }}
                />
                <input
                  value={s.linkUrl ?? ""}
                  onChange={(e) => set("howItWorks", d.howItWorks.map((x, n) => n === i ? { ...x, linkUrl: e.target.value } : x))}
                  placeholder="Where it goes — /pricing, {form}, https://…"
                  disabled={disabled}
                  style={{ ...field, flex: "2 1 240px", minWidth: 0 }}
                />
              </div>
            </div>
          ))}
          <p style={{ fontSize: "12.5px", color: "#4A5A74", lineHeight: 1.5, margin: "2px 0 0", maxWidth: "62ch" }}>
            Write <strong>{"{form}"}</strong> as the address to mean this program&rsquo;s own sign-up
            form — then it keeps working if the form is renamed. A stage with no button text just
            shows its words.
          </p>
          <button
            type="button"
            onClick={() => set("howItWorks", [...d.howItWorks, { step: String(d.howItWorks.length + 1).padStart(2, "0"), title: "", description: "", linkLabel: "", linkUrl: "" }])}
            disabled={disabled}
            style={{ alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: C.blue, background: "none", border: "none", padding: 0, minHeight: "42px", cursor: "pointer" }}
          >
            + Add a step
          </button>
        </div>
      </div>

      <div style={card}>
        <label style={label}>Promo video</label>
        <p style={{ fontSize: "13.5px", color: "#4A5A74", lineHeight: 1.55, margin: "0 0 12px", maxWidth: "64ch" }}>
          Paste the link — whatever you have. The one in the browser bar, the Share button&rsquo;s
          short link, a Vimeo page. It plays at the top of the program page, above How it works.
          Leave it empty and nothing shows: no empty box.
        </p>
        <input
          value={d.videoUrl ?? ""}
          onChange={(e) => set("videoUrl", e.target.value || null)}
          placeholder="https://youtu.be/… or https://vimeo.com/…"
          disabled={disabled}
          style={field}
        />
      </div>

      <div style={card}>
        <label style={label}>Runs on another JOC site</label>
        <p style={{ fontSize: "13.5px", color: "#4A5A74", lineHeight: 1.55, margin: "0 0 12px", maxWidth: "64ch" }}>
          For a program that does not sign up here — Chesed Match, for instance, which runs on
          chesedmatch.org. The orange button on the card and the page opens that address in a new
          tab instead of sending the school to pricing. Leave it empty for anything JOC runs on
          this site.
        </p>
        <input
          value={d.externalHref ?? ""}
          onChange={(e) => set("externalHref", e.target.value || null)}
          placeholder="https://chesedmatch.org — leave empty for a normal program"
          disabled={disabled}
          style={field}
        />
        {/* Both can be set, and the form wins. Saying so here is the whole
            point — otherwise the address sits in the box looking active
            while nobody can work out why nothing links to it. */}
        <p style={{ fontSize: "13px", color: "#4A5A74", lineHeight: 1.5, margin: "10px 0 0", maxWidth: "64ch" }}>
          If this program also has a sign-up form, the form is what people are sent to and this
          address is ignored.
        </p>
      </div>

      <div style={{ ...card, display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: C.ink }}>
          <input type="checkbox" checked={d.published} onChange={(e) => set("published", e.target.checked)} disabled={disabled} style={{ width: "16px", height: "16px" }} />
          Published — visible on the site
        </label>
        {/* Announced, but not open yet. The card keeps its place on the page
            and wears a "Coming soon" badge instead of a Register button —
            inviting a school to sign up for something that does not run yet
            is how you lose them. */}
        <label style={{ display: "flex", gap: "9px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: C.ink }}>
          <input type="checkbox" checked={d.comingSoon} onChange={(e) => set("comingSoon", e.target.checked)} disabled={disabled} style={{ width: "16px", height: "16px" }} />
          Coming soon — no Register button yet
        </label>
        <button
          type="submit"
          disabled={disabled || pending || !d.name.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: "9999px", padding: "12px 24px",
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
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: "pointer", minHeight: "44px", marginLeft: "auto" }}
          >
            Delete
          </button>
        )}
      </div>

      {msg && <p style={{ fontSize: "13.5px", color: C.redText, margin: 0 }}>{msg}</p>}
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
            style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minWidth: "36px", minHeight: "42px" }}
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
        style={{ alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: C.blue, background: "none", border: "none", padding: 0, minHeight: "42px", cursor: "pointer" }}
      >
        + Add
      </button>
    </div>
  );
}
