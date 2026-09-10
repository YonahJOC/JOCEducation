"use client";

import { useState, useTransition } from "react";
import { saveDraft, discardDraft, publishDrafts, setPreview } from "@/app/actions/site";

const INK = "#10233F";
const DEEP = "#0B1A31";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const ORANGE_TEXT = "#C96C00";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.15)";
const DRAFT_BG = "#FFFBF3";

export type EditorField = {
  id: string;
  page: string;
  section: string;
  sectionLabel: string;
  key: string;
  label: string;
  type: string;
  help: string | null;
  published: string | null;
  draft: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type EditorPage = { page: string; label: string; fields: number; drafts: number };

const TYPE_LABEL: Record<string, string> = {
  SHORT_TEXT: "Short text", LONG_TEXT: "Long text", URL: "URL",
  EMAIL: "Email", NUMBER: "Number", IMAGE: "Image", REPEATABLE: "Repeatable",
};

type Repeat = { title?: string; body?: string; value?: string };

function parseList(v: string | null): Repeat[] {
  if (!v) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

const input: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};

export function SiteEditor({
  pages, fields, previewing, disabled,
}: {
  pages: EditorPage[];
  fields: EditorField[];
  previewing: boolean;
  disabled?: boolean;
}) {
  const [activePage, setActivePage] = useState(pages[0]?.page ?? "landing");
  const [local, setLocal] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const pageFields = fields.filter((f) => f.page === activePage);
  const sections = [...new Map(pageFields.map((f) => [f.section, f.sectionLabel])).entries()];

  // A field is dirty if it has a stored draft, or an unsaved local edit.
  const currentValue = (f: EditorField) =>
    local[f.id] ?? f.draft ?? f.published ?? "";
  const isDirty = (f: EditorField) =>
    f.draft !== null || (local[f.id] !== undefined && local[f.id] !== (f.published ?? ""));

  const allDirty = fields.filter((f) => f.draft !== null);

  function commit(f: EditorField, value: string) {
    setLocal((p) => ({ ...p, [f.id]: value }));
    setMsg(null);
    start(async () => {
      const r = await saveDraft({ page: f.page, section: f.section, key: f.key, value });
      if (!r.ok) setMsg(r.error);
    });
  }

  function revert(f: EditorField) {
    setLocal((p) => { const n = { ...p }; delete n[f.id]; return n; });
    start(async () => { await discardDraft(f.id); });
  }

  function publish() {
    if (!window.confirm(`Publish ${allDirty.length} change${allDirty.length === 1 ? "" : "s"} to the live site?`)) return;
    setMsg(null);
    start(async () => {
      const r = await publishDrafts();
      setMsg(r.ok ? `Published ${r.published} change${r.published === 1 ? "" : "s"}.` : r.error);
      if (r.ok) setLocal({});
    });
  }

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Site content
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>
        Every word on the public site. Edits become drafts — nothing changes for visitors until you publish.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "16px" }}>
        <div className="joc-site-grid" style={{ display: "grid", gridTemplateColumns: "190px minmax(0,1fr) 280px", gap: "16px", alignItems: "start" }}>

          {/* Pane 1 — pages */}
          <nav style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "10px", position: "sticky", top: "16px" }}>
            <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "6px 10px 10px" }}>
              Pages
            </p>
            {pages.map((p) => {
              const on = p.page === activePage;
              return (
                <button
                  key={p.page}
                  onClick={() => setActivePage(p.page)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px",
                    width: "100%", textAlign: "left", fontFamily: "var(--font-outfit)",
                    fontSize: "13.5px", fontWeight: on ? 700 : 500,
                    color: on ? BLUE : "rgba(16,35,63,.75)",
                    backgroundColor: on ? "#F4F7FD" : "transparent",
                    border: "none", borderRadius: "10px", padding: "10px 10px",
                    minHeight: "44px", cursor: "pointer",
                  }}
                >
                  <span>{p.label}</span>
                  {p.drafts > 0 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", backgroundColor: ORANGE, borderRadius: "9999px", padding: "2px 7px", flexShrink: 0 }}>
                      {p.drafts}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Pane 2 — fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {sections.map(([section, sectionLabel]) => (
              <div key={section} style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px" }}>
                <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 16px" }}>
                  {sectionLabel}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {pageFields.filter((f) => f.section === section).map((f) => (
                    <FieldRow
                      key={f.id}
                      field={f}
                      value={currentValue(f)}
                      dirty={isDirty(f)}
                      disabled={disabled || pending}
                      onCommit={(v) => commit(f, v)}
                      onRevert={() => revert(f)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pane 3 — publish */}
          <aside style={{ position: "sticky", top: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ backgroundColor: DEEP, borderRadius: "16px", padding: "20px", color: "rgba(255,255,255,.8)" }}>
              <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,.5)", margin: "0 0 12px" }}>
                Unpublished
              </p>
              <p style={{ fontWeight: 800, fontSize: "34px", lineHeight: 1, color: allDirty.length ? ORANGE : "#fff", margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>
                {allDirty.length}
              </p>
              <p style={{ fontSize: "13px", margin: "0 0 16px", color: "rgba(255,255,255,.6)" }}>
                {allDirty.length === 0 ? "The live site is up to date." : `change${allDirty.length === 1 ? "" : "s"} waiting`}
              </p>

              {allDirty.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "16px", maxHeight: "180px", overflowY: "auto" }}>
                  {allDirty.map((f) => (
                    <div key={f.id} style={{ fontSize: "12.5px", lineHeight: 1.4 }}>
                      <span style={{ color: "rgba(255,255,255,.5)" }}>{f.sectionLabel} → </span>
                      <span style={{ color: "#fff" }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={publish}
                disabled={disabled || pending || allDirty.length === 0}
                style={{
                  width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px",
                  color: allDirty.length ? INK : "rgba(255,255,255,.4)",
                  backgroundColor: allDirty.length ? ORANGE : "rgba(255,255,255,.08)",
                  border: "none", borderRadius: "9999px", padding: "13px 18px", minHeight: "44px",
                  cursor: allDirty.length && !disabled ? "pointer" : "default",
                  marginBottom: "8px",
                }}
              >
                {pending ? "Working…" : "Publish all"}
              </button>

              <form action={async () => { await setPreview(!previewing); }}>
                <button
                  type="submit"
                  disabled={disabled}
                  style={{
                    width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13.5px",
                    color: "#fff", backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,.25)", borderRadius: "9999px",
                    padding: "11px 18px", minHeight: "44px", cursor: "pointer",
                  }}
                >
                  {previewing ? "Stop previewing drafts" : "Preview drafts on the site"}
                </button>
              </form>

              {previewing && (
                <p style={{ fontSize: "12px", color: ORANGE, margin: "10px 0 0", lineHeight: 1.5 }}>
                  You are seeing drafts on the public site. Visitors are not.
                </p>
              )}
            </div>

            {msg && (
              <p style={{ fontSize: "13px", color: msg.startsWith("Published") ? GREEN : "#B8321E", margin: 0 }}>
                {msg}
              </p>
            )}

            <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", lineHeight: 1.55, margin: 0 }}>
              Every field keeps its full history, so any change can be rolled back after publishing.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field, value, dirty, disabled, onCommit, onRevert,
}: {
  field: EditorField;
  value: string;
  dirty: boolean;
  disabled?: boolean;
  onCommit: (v: string) => void;
  onRevert: () => void;
}) {
  const [draftValue, setDraftValue] = useState(value);
  const isList = field.type === "REPEATABLE";

  return (
    <div
      style={{
        backgroundColor: dirty ? DRAFT_BG : "transparent",
        border: dirty ? `1px solid ${ORANGE}` : "1px solid transparent",
        borderRadius: "12px",
        padding: dirty ? "14px" : "0",
        transition: "background .15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: INK }}>
          {field.label}
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(16,35,63,.4)", marginLeft: "9px" }}>
            {TYPE_LABEL[field.type] ?? field.type}
          </span>
        </label>
        {dirty && (
          <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", backgroundColor: ORANGE, borderRadius: "9999px", padding: "2px 8px" }}>
              Draft
            </span>
            <button
              onClick={onRevert}
              disabled={disabled}
              style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 600, color: ORANGE_TEXT, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Discard
            </button>
          </span>
        )}
      </div>

      {field.help && (
        <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "0 0 8px", lineHeight: 1.5 }}>{field.help}</p>
      )}

      {isList ? (
        <RepeatEditor
          items={parseList(draftValue)}
          disabled={disabled}
          onChange={(items) => {
            const v = JSON.stringify(items);
            setDraftValue(v);
            onCommit(v);
          }}
        />
      ) : field.type === "LONG_TEXT" ? (
        <textarea
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          onBlur={() => draftValue !== value && onCommit(draftValue)}
          rows={3}
          disabled={disabled}
          style={{ ...input, resize: "vertical" }}
        />
      ) : (
        <input
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          onBlur={() => draftValue !== value && onCommit(draftValue)}
          disabled={disabled}
          type={field.type === "NUMBER" ? "text" : field.type === "EMAIL" ? "email" : "text"}
          style={input}
        />
      )}

      {field.updatedBy && !dirty && (
        <p style={{ fontSize: "11.5px", color: "rgba(16,35,63,.4)", margin: "6px 0 0" }}>
          Last edited by {field.updatedBy}
        </p>
      )}
    </div>
  );
}

function RepeatEditor({
  items, disabled, onChange,
}: {
  items: Repeat[];
  disabled?: boolean;
  onChange: (items: Repeat[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "start", backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px", padding: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
            {"value" in it && (
              <input
                value={it.value ?? ""}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                placeholder="Figure"
                disabled={disabled}
                style={{ ...input, minHeight: "36px", fontWeight: 700 }}
              />
            )}
            <input
              value={it.title ?? ""}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              placeholder="Title"
              disabled={disabled}
              style={{ ...input, minHeight: "36px" }}
            />
            <textarea
              value={it.body ?? ""}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
              placeholder="Text"
              rows={2}
              disabled={disabled}
              style={{ ...input, minHeight: "36px", resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={disabled || i === 0}>↑</IconBtn>
            <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={disabled || i === items.length - 1}>↓</IconBtn>
            <IconBtn label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} disabled={disabled} danger>×</IconBtn>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { title: "", body: "" }])}
        disabled={disabled}
        style={{ alignSelf: "flex-start", fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: "6px 0", minHeight: "38px" }}
      >
        + Add item
      </button>
    </div>
  );
}

function IconBtn({
  children, label, onClick, disabled, danger,
}: {
  children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: "30px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", borderRadius: "6px",
        color: disabled ? "rgba(16,35,63,.2)" : danger ? "#B8321E" : "rgba(16,35,63,.5)",
        cursor: disabled ? "default" : "pointer", fontSize: "15px",
      }}
    >
      {children}
    </button>
  );
}
