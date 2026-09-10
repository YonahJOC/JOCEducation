"use client";

import { useState, useTransition } from "react";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RULE = "rgba(16,35,63,.15)";

export const crudField: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
export const crudLabel: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

/**
 * Shell for the smaller admin lists — resources and products. Holds the
 * add/edit form open, runs the save, and renders the rows the caller supplies.
 */
export function CrudShell<T extends { id: string | number }>({
  title, subtitle, items, blank, disabled,
  renderForm, renderRow, onSave, onDelete, addLabel,
}: {
  title: string;
  subtitle: string;
  items: T[];
  blank: T;
  disabled?: boolean;
  addLabel: string;
  renderForm: (draft: T, set: (patch: Partial<T>) => void) => React.ReactNode;
  renderRow: (item: T) => React.ReactNode;
  onSave: (draft: T) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (item: T) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [draft, setDraft] = useState<T | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = (patch: Partial<T>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  function save() {
    if (!draft) return;
    setMsg(null);
    start(async () => {
      const r = await onSave(draft);
      if (r.ok) { setDraft(null); setMsg("Saved."); }
      else setMsg(r.error ?? "Failed");
    });
  }

  function remove(item: T) {
    if (!window.confirm("Delete this permanently?")) return;
    setMsg(null);
    start(async () => {
      const r = await onDelete(item);
      if (!r.ok) setMsg(r.error ?? "Failed");
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: 0 }}>{title}</h1>
        {!draft && (
          <button
            onClick={() => setDraft({ ...blank })}
            disabled={disabled}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
              backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
              minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {addLabel}
          </button>
        )}
      </div>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>{subtitle}</p>

      {draft && (
        <div style={{ backgroundColor: "#fff", border: `1.5px solid ${BLUE}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
          {renderForm(draft, set)}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "16px" }}>
            <button
              onClick={save}
              disabled={pending}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
                backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 22px",
                minHeight: "44px", cursor: "pointer", opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setDraft(null); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13.5px", marginBottom: "12px", color: msg === "Saved." ? "#1B7F4B" : "#B8321E" }}>{msg}</p>
      )}

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
        {items.length === 0 ? (
          <p style={{ padding: "24px 20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>Nothing here yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
                  padding: "14px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>{renderRow(item)}</div>
                <div style={{ display: "flex", gap: "14px", flexShrink: 0 }}>
                  <button
                    onClick={() => setDraft({ ...item })}
                    disabled={disabled}
                    style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "38px" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(item)}
                    disabled={disabled}
                    style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: "#B8321E", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "38px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
