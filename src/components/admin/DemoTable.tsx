"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDemoStatus, convertDemoToSchool } from "@/app/actions/admin";

const INK = "#10233F";
const RULE = "rgba(16,35,63,.15)";

const STATUS_COLOR: Record<string, string> = {
  NEW: "#FA912D", CONTACTED: "#2C7AC9", SCHEDULED: "#2D46AF",
  COMPLETED: "#1B7F4B", CONVERTED: "#1B7F4B", LOST: "#7A8699",
};

const STATUSES = ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "LOST"] as const;

export type DemoRowT = {
  id: string;
  name: string;
  email: string;
  schoolName: string | null;
  requestedFor: Date | string | null;
  status: string;
  createdAt: Date | string;
};

function fmt(d: Date | string | null, withTime = false) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

const th: React.CSSProperties = {
  textAlign: "left", padding: "11px 20px", fontSize: "10.5px", letterSpacing: "0.16em",
  textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)",
  borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", verticalAlign: "middle",
};

export function DemoTable({ demos, disabled }: { demos: DemoRowT[]; disabled?: boolean }) {
  if (demos.length === 0) {
    return (
      <p style={{ padding: "24px 20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>
        No demo requests yet. They arrive here when someone books on the landing page.
      </p>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "760px" }}>
        <thead>
          <tr>
            <th style={th}>Who</th>
            <th style={th}>School</th>
            <th style={th}>Requested slot</th>
            <th style={th}>Received</th>
            <th style={th}>Status</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {demos.map((r) => <Row key={r.id} demo={r} disabled={disabled} />)}
        </tbody>
      </table>
    </div>
  );
}

function Row({ demo, disabled }: { demo: DemoRowT; disabled?: boolean }) {
  const [status, setStatus] = useState(demo.status);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const converted = status === "CONVERTED";

  function change(next: string) {
    const prev = status;
    setStatus(next);
    setMsg(null);
    start(async () => {
      const r = await setDemoStatus(demo.id, next);
      if (!r.ok) { setStatus(prev); setMsg(r.error); }
    });
  }

  function convert() {
    if (!window.confirm(`Create a school account from ${demo.schoolName || demo.name}?`)) return;
    setMsg(null);
    start(async () => {
      const r = await convertDemoToSchool(demo.id);
      if (r.ok) {
        setStatus("CONVERTED");
        if (r.id) router.push(`/admin/schools/${r.id}`);
      } else {
        setMsg(r.error);
      }
    });
  }

  return (
    <tr>
      <td style={td}>
        <span style={{ fontWeight: 600, color: INK, display: "block" }}>{demo.name}</span>
        <a href={`mailto:${demo.email}`} style={{ fontSize: "12.5px", color: "#2D46AF", textDecoration: "none", wordBreak: "break-all" }}>
          {demo.email}
        </a>
        {msg && <span style={{ display: "block", fontSize: "12px", color: "#B8321E", marginTop: "3px" }}>{msg}</span>}
      </td>
      <td style={{ ...td, color: "rgba(16,35,63,.75)" }}>{demo.schoolName ?? "—"}</td>
      <td style={{ ...td, color: "rgba(16,35,63,.75)", whiteSpace: "nowrap" }}>{fmt(demo.requestedFor, true)}</td>
      <td style={{ ...td, color: "rgba(16,35,63,.6)", whiteSpace: "nowrap" }}>{fmt(demo.createdAt)}</td>
      <td style={td}>
        {converted ? (
          <span style={{
            display: "inline-block", fontSize: "11.5px", fontWeight: 700, padding: "3px 10px",
            borderRadius: "9999px", color: STATUS_COLOR.CONVERTED, backgroundColor: `${STATUS_COLOR.CONVERTED}1a`,
          }}>
            converted
          </span>
        ) : (
          <select
            value={status}
            onChange={(e) => change(e.target.value)}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
              color: STATUS_COLOR[status] ?? INK, backgroundColor: "#fff",
              border: `1px solid ${RULE}`, borderRadius: "9px", padding: "7px 9px",
              minHeight: "38px", cursor: disabled ? "not-allowed" : "pointer", outline: "none",
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        )}
      </td>
      <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
        {!converted && (
          <button
            onClick={convert}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 700,
              color: "#fff", backgroundColor: "#2D46AF", border: "none", borderRadius: "9999px",
              padding: "8px 14px", minHeight: "38px",
              cursor: disabled ? "not-allowed" : "pointer", opacity: disabled || pending ? 0.5 : 1,
            }}
          >
            {pending ? "…" : "Create school"}
          </button>
        )}
      </td>
    </tr>
  );
}
