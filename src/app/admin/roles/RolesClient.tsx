"use client";

import { useState, useTransition } from "react";
import { saveAdminRole, deleteAdminRole } from "@/app/actions/admin-roles";
import { PageIntro } from "@/components/admin/PageIntro";
import {
  CAPABILITY_GROUPS, CAPABILITY_LABELS, CAPABILITY_DESCRIPTIONS,
  type Capability,
} from "@/lib/access";
import type { AdminRoleRow } from "@/lib/admin-roles";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px", outline: "none",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

const BLANK: AdminRoleRow = {
  id: "", name: "", description: null, capabilities: [],
  builtIn: false, isSuperAdmin: false, sort: 0, memberCount: 0,
};

const STEPS = [
  "Each row is an admin type — a named set of things somebody is allowed to do.",
  "There are fourteen permissions, one for each thing in the console. Tick the ones that type should have; anything unticked is not just hidden, those pages refuse to open.",
  "They are grouped under the four headings the sidebar uses, and each group has a “Tick all” if you want the whole heading.",
  "Press “+ New admin type” to make your own — someone who only runs the shop, someone who only keeps the calendar.",
  "To give somebody a type, go to People and pick it from their row.",
  "A change takes effect for that person within five minutes. They do not need to sign out.",
];

export function RolesClient({ roles, disabled }: { roles: AdminRoleRow[]; disabled?: boolean }) {
  const [editing, setEditing] = useState<AdminRoleRow | null>(null);

  if (editing) {
    return <RoleForm initial={editing} disabled={disabled} onDone={() => setEditing(null)} />;
  }

  return (
    <div>
      <PageIntro
        title="Admin types"
        what="Who can do what in the console. Each type is a named set of permissions; every person on the JOC side holds one."
        steps={STEPS}
        note="Super admin always keeps every permission — it is what lets you undo anything else done here. You also cannot remove your own access to this page."
      >
        <button
          onClick={() => setEditing({ ...BLANK })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New admin type
        </button>
      </PageIntro>

      {/* The whole picture in one grid: every type down the side, every
          permission across. This is the question people actually ask —
          "who can do X" — and a list of cards cannot answer it. */}
      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "760px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px 20px", fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD" }}>
                Admin type
              </th>
              {CAPABILITY_GROUPS.map((g) => (
                <th
                  key={g.label}
                  style={{ textAlign: "center", padding: "12px 14px", fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}
                >
                  {g.label}
                </th>
              ))}
              <th style={{ borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD" }} />
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                  <span style={{ fontWeight: 600, color: INK, display: "block" }}>
                    {r.name}
                    {r.builtIn && (
                      <span style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(16,35,63,.45)", backgroundColor: "rgba(16,35,63,.07)", borderRadius: "9999px", padding: "2px 8px", marginLeft: "8px" }}>
                        built in
                      </span>
                    )}
                  </span>
                  {r.description && (
                    <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", display: "block", marginTop: "2px", maxWidth: "46ch" }}>
                      {r.description}
                    </span>
                  )}
                  <span style={{ fontSize: "12px", color: "rgba(16,35,63,.45)", display: "block", marginTop: "3px" }}>
                    {r.memberCount === 0
                      ? "nobody yet"
                      : `${r.memberCount} ${r.memberCount === 1 ? "person" : "people"}`}
                  </span>
                </td>
                {/* "3 of 7" rather than a tick: with fourteen permissions,
                    a tick would have to mean "some of these", which is the
                    kind of half-truth that gets somebody the wrong access. */}
                {CAPABILITY_GROUPS.map((g) => {
                  const held = g.capabilities.filter((c) => r.capabilities.includes(c));
                  const all = held.length === g.capabilities.length;
                  const none = held.length === 0;
                  return (
                    <td
                      key={g.label}
                      title={held.map((c) => CAPABILITY_LABELS[c]).join(", ") || "none"}
                      style={{ textAlign: "center", padding: "13px 14px", borderBottom: "1px solid rgba(16,35,63,.05)" }}
                    >
                      {none ? (
                        <span style={{ color: "rgba(16,35,63,.22)", fontSize: "16px" }}>·</span>
                      ) : (
                        <span style={{
                          fontSize: "12px", fontWeight: 700, borderRadius: "9999px", padding: "3px 9px",
                          color: all ? "#1B7F4B" : "#C96C00",
                          backgroundColor: all ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)",
                        }}>
                          {all ? "all" : `${held.length} of ${g.capabilities.length}`}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => setEditing(r)}
                    disabled={disabled}
                    style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "16px 18px", marginTop: "18px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.5)", margin: "0 0 10px" }}>
          What each permission covers
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px 24px" }}>
          {CAPABILITY_GROUPS.map((g) => (
            <div key={g.label}>
              <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 6px" }}>
                {g.label}
              </p>
              {g.capabilities.map((c) => (
                <div key={c} style={{ marginBottom: "6px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: INK, margin: 0 }}>{CAPABILITY_LABELS[c]}</p>
                  <p style={{ fontSize: "12.5px", lineHeight: 1.45, color: "rgba(16,35,63,.6)", margin: 0 }}>
                    {CAPABILITY_DESCRIPTIONS[c]}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleForm({
  initial, disabled, onDone,
}: {
  initial: AdminRoleRow;
  disabled?: boolean;
  onDone: () => void;
}) {
  const [d, setD] = useState<AdminRoleRow>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const locked = d.isSuperAdmin;

  function toggle(c: Capability) {
    if (locked) return;
    setD((p) => ({
      ...p,
      capabilities: p.capabilities.includes(c)
        ? p.capabilities.filter((x) => x !== c)
        : [...p.capabilities, c],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveAdminRole({
        id: d.id || undefined,
        name: d.name,
        description: d.description ?? "",
        capabilities: d.capabilities,
      });
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete the "${d.name}" admin type?`)) return;
    start(async () => {
      const r = await deleteAdminRole(d.id);
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "760px" }}>
      <button
        type="button"
        onClick={onDone}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
      >
        ← All admin types
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
        {d.id ? d.name : "New admin type"}
      </h1>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px", marginBottom: "14px" }}>
        <div style={{ marginBottom: "12px" }}>
          <label style={label}>Name</label>
          <input
            value={d.name}
            onChange={(e) => setD((p) => ({ ...p, name: e.target.value }))}
            placeholder="Shop manager"
            disabled={disabled || d.builtIn}
            style={{ ...field, backgroundColor: d.builtIn ? "#F7F8FB" : "#fff" }}
            autoFocus={!d.id}
          />
          {d.builtIn && (
            <p style={{ fontSize: "12px", color: "rgba(16,35,63,.5)", margin: "5px 0 0" }}>
              Built-in types keep their name. You can still change what this one can do.
            </p>
          )}
        </div>
        <div>
          <label style={label}>What is it for?</label>
          <input
            value={d.description ?? ""}
            onChange={(e) => setD((p) => ({ ...p, description: e.target.value }))}
            placeholder="Runs the shop catalogue and the orders that come in."
            disabled={disabled}
            style={field}
          />
        </div>
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px", marginBottom: "14px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 4px" }}>
          What this type can do
        </p>
        <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", margin: "0 0 14px", lineHeight: 1.55 }}>
          {locked
            ? "Super admin holds every permission and cannot be reduced — it is the way back from any other mistake made on this page."
            : "Anything not ticked is not just hidden: those pages refuse to open."}
        </p>

        {CAPABILITY_GROUPS.map((g) => {
          const held = g.capabilities.filter((c) => d.capabilities.includes(c));
          const allOn = held.length === g.capabilities.length;
          return (
            <div key={g.label} style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
                  {g.label}
                </p>
                {!locked && (
                  <button
                    type="button"
                    onClick={() =>
                      setD((p) => ({
                        ...p,
                        capabilities: allOn
                          ? p.capabilities.filter((x) => !g.capabilities.includes(x))
                          : [...new Set([...p.capabilities, ...g.capabilities])],
                      }))
                    }
                    disabled={disabled}
                    style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {allOn ? "Clear all" : "Tick all"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {g.capabilities.map((c) => {
            const on = d.capabilities.includes(c);
            return (
              <label
                key={c}
                style={{
                  display: "flex", gap: "12px", alignItems: "flex-start",
                  border: `1px solid ${on ? "rgba(45,70,175,.3)" : RULE}`,
                  backgroundColor: on ? "rgba(45,70,175,.04)" : "#fff",
                  borderRadius: "12px", padding: "13px 15px",
                  cursor: locked || disabled ? "default" : "pointer",
                  opacity: locked ? 0.75 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(c)}
                  disabled={disabled || locked}
                  style={{ width: "17px", height: "17px", marginTop: "2px", flexShrink: 0 }}
                />
                <span>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600, color: INK }}>
                    {CAPABILITY_LABELS[c]}
                  </span>
                  <span style={{ display: "block", fontSize: "13px", color: "rgba(16,35,63,.62)", lineHeight: 1.5, marginTop: "2px" }}>
                    {CAPABILITY_DESCRIPTIONS[c]}
                  </span>
                </span>
              </label>
            );
          })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={disabled || pending || !d.name.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 24px",
            minHeight: "44px", cursor: pending ? "wait" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>

        {d.id && !d.builtIn && (
          <button
            type="button"
            onClick={remove}
            disabled={disabled || pending}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: RED, background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
          >
            Delete
          </button>
        )}

        {msg && <p style={{ fontSize: "13.5px", color: RED, margin: 0, lineHeight: 1.5 }}>{msg}</p>}
      </div>
    </form>
  );
}
