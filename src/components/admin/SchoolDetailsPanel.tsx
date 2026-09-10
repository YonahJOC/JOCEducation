"use client";

import { useState, useTransition } from "react";
import { updateSchoolDetails } from "@/app/actions/admin";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

export function SchoolDetailsPanel({
  schoolId, name, city, region, website, type, enrollment, studentCount, emailDomains, disabled,
}: {
  schoolId: string;
  name: string;
  city: string | null;
  region: string | null;
  website: string | null;
  type: string;
  enrollment: string;
  studentCount: number | null;
  emailDomains: string[];
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [f, setF] = useState({
    name, city: city ?? "", region: region ?? "", website: website ?? "",
    type, enrollment, studentCount: studentCount?.toString() ?? "",
    emailDomains: emailDomains.join(", "),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function save() {
    setMsg(null);
    start(async () => {
      const r = await updateSchoolDetails({
        schoolId,
        name: f.name,
        city: f.city,
        region: f.region,
        website: f.website,
        type: f.type,
        enrollment: f.enrollment,
        studentCount: f.studentCount ? Number(f.studentCount) : null,
        emailDomains: f.emailDomains,
      });
      setMsg(r.ok ? "Saved." : r.error);
      if (r.ok) setEditing(false);
    });
  }

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
          School details
        </p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            disabled={disabled}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: disabled ? "rgba(16,35,63,.3)" : BLUE, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer" }}
          >
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <Row k="Name" v={name} />
          <Row k="Location" v={[city, region].filter(Boolean).join(" · ") || "—"} />
          <Row k="Type" v={type.replace(/_/g, " ").toLowerCase()} />
          <Row k="Students" v={studentCount ? String(studentCount) : "—"} />
          <div style={{ paddingTop: "10px", marginTop: "4px", borderTop: "1px solid rgba(16,35,63,.07)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", margin: "0 0 6px" }}>
              Email domains
            </p>
            {emailDomains.length === 0 ? (
              <p style={{ fontSize: "13px", lineHeight: 1.55, color: "#C96C00", margin: 0 }}>
                None set. Teachers here have to be invited one by one. Add the school&rsquo;s domain and
                anyone signing in with that address joins automatically.
              </p>
            ) : (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {emailDomains.map((d) => (
                  <span key={d} style={{ fontSize: "12.5px", fontWeight: 600, color: GREEN, backgroundColor: "rgba(27,127,75,.1)", borderRadius: "9999px", padding: "4px 11px" }}>
                    @{d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={label}>Name</label>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} style={field} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            <div>
              <label style={label}>City</label>
              <input value={f.city} onChange={(e) => set("city", e.target.value)} style={field} />
            </div>
            <div>
              <label style={label}>Region</label>
              <input value={f.region} onChange={(e) => set("region", e.target.value)} style={field} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            <div>
              <label style={label}>Type</label>
              <select value={f.type} onChange={(e) => set("type", e.target.value)} style={field}>
                <option value="DAY_SCHOOL">Day school</option>
                <option value="YESHIVA">Yeshiva</option>
                <option value="SEMINARY">Seminary</option>
                <option value="CHEDER">Cheder</option>
                <option value="HIGH_SCHOOL">High school</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={label}>Enrollment band</label>
              <select value={f.enrollment} onChange={(e) => set("enrollment", e.target.value)} style={field}>
                <option value="SMALL">Under 150</option>
                <option value="MEDIUM">150–400</option>
                <option value="LARGE">400+</option>
              </select>
            </div>
            <div>
              <label style={label}>Students</label>
              <input
                value={f.studentCount}
                onChange={(e) => set("studentCount", e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                style={field}
              />
            </div>
          </div>
          <div>
            <label style={label}>Email domains</label>
            <input
              value={f.emailDomains}
              onChange={(e) => set("emailDomains", e.target.value)}
              placeholder="darcheitorah.org, staff.darcheitorah.org"
              style={field}
            />
            <p style={{ fontSize: "12.5px", lineHeight: 1.5, color: "rgba(16,35,63,.55)", margin: "6px 0 0" }}>
              Anyone signing in with an address on these joins this school automatically. Separate several
              with commas. A domain can only belong to one school.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "2px" }}>
            <button
              onClick={save}
              disabled={pending || !f.name.trim()}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
                backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
                minHeight: "44px", cursor: "pointer", opacity: pending || !f.name.trim() ? 0.5 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13px", marginTop: "12px", marginBottom: 0, color: msg === "Saved." ? GREEN : "#B8321E" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
      <span style={{ color: "rgba(16,35,63,.55)" }}>{k}</span>
      <span style={{ color: INK, fontWeight: 500, textAlign: "right", textTransform: k === "Type" ? "capitalize" : "none" }}>{v}</span>
    </div>
  );
}
