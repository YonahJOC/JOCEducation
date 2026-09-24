"use client";

import { useState, useTransition } from "react";
import { R, C } from "@/lib/joc-tokens";
import { PageIntro } from "@/components/admin/PageIntro";

export const crudField: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
  backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
export const crudLabel: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: C.muted, marginBottom: "5px",
};

/**
 * Shell for the smaller admin lists — resources and products. Holds the
 * add/edit form open, runs the save, and renders the rows the caller supplies.
 */
export function CrudShell<T extends { id: string | number }>({
  title, subtitle, steps, note, items, blank, disabled,
  renderForm, renderRow, onSave, onDelete, addLabel,
}: {
  title: string;
  subtitle: string;
  /** Numbered instructions, folded away under the title. */
  steps?: string[];
  note?: string;
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
      <PageIntro title={title} what={subtitle} steps={steps} note={note}>
        {!draft && (
          <button
            onClick={() => setDraft({ ...blank })}
            disabled={disabled}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: C.white,
              backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 20px",
              minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {addLabel}
          </button>
        )}
      </PageIntro>

      {draft && (
        <div style={{ backgroundColor: C.white, border: `1.5px solid ${C.blue}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
          {renderForm(draft, set)}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "16px" }}>
            <button
              onClick={save}
              disabled={pending}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: C.white,
                backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 22px",
                minHeight: "44px", cursor: "pointer", opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setDraft(null); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "15px", marginBottom: "12px", color: msg === "Saved." ? C.greenText : C.redText }}>{msg}</p>
      )}

      <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
        {items.length === 0 ? (
          <p style={{ padding: "24px 20px", fontSize: "14px", color: C.muted, margin: 0 }}>Nothing here yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
                  padding: "14px 20px", borderBottom: `1px solid ${C.hairline}`, flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>{renderRow(item)}</div>
                <div style={{ display: "flex", gap: "14px", flexShrink: 0 }}>
                  <button
                    onClick={() => setDraft({ ...item })}
                    disabled={disabled}
                    style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "38px" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(item)}
                    disabled={disabled}
                    style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "38px" }}
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
