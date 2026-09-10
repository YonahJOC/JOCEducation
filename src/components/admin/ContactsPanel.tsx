"use client";

import { useState, useTransition } from "react";
import { saveSchoolContact, deleteSchoolContact } from "@/app/actions/admin";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.15)";

export type ContactRow = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

const BLANK: ContactRow = { id: "", name: "", title: "", email: "", phone: "", isPrimary: false };

/**
 * People at the school who are not necessarily users — the menahel who signs
 * the contract but never logs in still has to be reachable.
 */
export function ContactsPanel({
  schoolId, contacts, disabled,
}: {
  schoolId: string;
  contacts: ContactRow[];
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<ContactRow | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = (patch: Partial<ContactRow>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  function save() {
    if (!draft) return;
    setMsg(null);
    start(async () => {
      const r = await saveSchoolContact({
        id: draft.id || undefined,
        schoolId,
        name: draft.name,
        title: draft.title ?? undefined,
        email: draft.email ?? undefined,
        phone: draft.phone ?? undefined,
        isPrimary: draft.isPrimary,
      });
      if (r.ok) { setDraft(null); setMsg("Saved."); }
      else setMsg(r.error);
    });
  }

  function remove(c: ContactRow) {
    if (!window.confirm(`Remove ${c.name}?`)) return;
    start(async () => {
      const r = await deleteSchoolContact(c.id, schoolId);
      if (!r.ok) setMsg(r.error);
    });
  }

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
          Contacts
        </p>
        {!draft && (
          <button
            onClick={() => setDraft({ ...BLANK, isPrimary: contacts.length === 0 })}
            disabled={disabled}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: disabled ? "rgba(16,35,63,.3)" : BLUE, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer" }}
          >
            + Add
          </button>
        )}
      </div>

      {draft && (
        <div style={{ border: `1.5px solid ${BLUE}`, borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={label}>Name</label>
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} style={field} autoFocus />
            </div>
            <div>
              <label style={label}>Title</label>
              <input value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Menahel, coordinator…" style={field} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={label}>Email</label>
              <input value={draft.email ?? ""} onChange={(e) => set({ email: e.target.value })} type="email" style={field} />
            </div>
            <div>
              <label style={label}>Phone</label>
              <input value={draft.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} style={field} />
            </div>
          </div>
          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "13.5px", color: INK, marginBottom: "12px" }}>
            <input type="checkbox" checked={draft.isPrimary} onChange={(e) => set({ isPrimary: e.target.checked })} style={{ width: "16px", height: "16px" }} />
            Main contact for this school
          </label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={save}
              disabled={pending || !draft.name.trim()}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px", color: "#fff",
                backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "10px 20px",
                minHeight: "42px", cursor: "pointer", opacity: pending || !draft.name.trim() ? 0.5 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setDraft(null); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13.5px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !draft ? (
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(16,35,63,.6)", margin: 0 }}>
          Nobody recorded yet. Add whoever JOC actually speaks to at this school.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {contacts.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: INK, margin: 0 }}>
                  {c.name}
                  {c.isPrimary && (
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: GREEN, backgroundColor: "rgba(27,127,75,.1)", padding: "2px 7px", borderRadius: "9999px", marginLeft: "8px", letterSpacing: "0.06em" }}>
                      MAIN
                    </span>
                  )}
                </p>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0", wordBreak: "break-word" }}>
                  {[c.title, c.email, c.phone].filter(Boolean).join(" · ") || "No details"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                <button
                  onClick={() => setDraft(c)}
                  disabled={disabled}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "36px" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(c)}
                  disabled={disabled}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: "#B8321E", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "36px" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13px", marginTop: "12px", marginBottom: 0, color: msg === "Saved." ? GREEN : "#B8321E" }}>{msg}</p>
      )}
    </div>
  );
}
