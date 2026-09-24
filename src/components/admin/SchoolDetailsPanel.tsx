"use client";

import { useState, useTransition } from "react";
import { label, R, C } from "@/lib/joc-tokens";
import { updateSchoolDetails } from "@/app/actions/admin";

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
  backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};

export function SchoolDetailsPanel({
  schoolId, name, city, region, website, type, enrollment, studentCount, emailDomains, appSchoolId, disabled,
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
  /** This school's id inside the JOC App, where somebody has set it. */
  appSchoolId?: string | null;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [f, setF] = useState({
    name, city: city ?? "", region: region ?? "", website: website ?? "",
    type, enrollment, studentCount: studentCount?.toString() ?? "",
    emailDomains: emailDomains.join(", "),
    appSchoolId: appSchoolId ?? "",
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
        appSchoolId: f.appSchoolId,
      });
      setMsg(r.ok ? "Saved." : r.error);
      if (r.ok) setEditing(false);
    });
  }

  return (
    <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <p style={{ ...label, color: "#4A5A74", margin: 0 }}>
          School details
        </p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            disabled={disabled}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: disabled ? C.muted : C.blue, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer" }}
          >
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <Row k="Name" v={name} />
          <Row k="Location" v={[city, region].filter(Boolean).join(" · ") || "Not recorded"} />
          <Row k="Type" v={type.replace(/_/g, " ").toLowerCase()} />
          <Row k="Students" v={studentCount ? String(studentCount) : "Enrolment not recorded"} />
          <div style={{ paddingTop: "10px", marginTop: "4px", borderTop: `1px solid ${C.hairline}` }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#4A5A74", margin: "0 0 6px" }}>
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
                  <span key={d} style={{ fontSize: "13px", fontWeight: 600, color: C.greenText, backgroundColor: "rgba(27,127,75,.1)", borderRadius: R.chip, padding: "4px 11px" }}>
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
            <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#4A5A74", margin: "6px 0 0" }}>
              Anyone signing in with an address on these joins this school automatically. Separate several
              with commas. A domain can only belong to one school.
            </p>
          </div>
          <div>
            <label style={label}>JOC App id</label>
            <input
              value={f.appSchoolId}
              onChange={(e) => set("appSchoolId", e.target.value)}
              placeholder="The id this school has inside the JOC App"
              style={field}
            />
            <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#4A5A74", margin: "6px 0 0" }}>
              How this school is matched to the JOC App. Until it is set, the app reports nothing
              for them — no hours, no approvals, nothing on the app console. Matching is by id and
              never by name: &ldquo;Yeshiva Darchei Torah&rdquo; and &ldquo;Darchei Torah&rdquo; are
              the same school and would never have lined up.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "2px" }}>
            <button
              onClick={save}
              disabled={pending || !f.name.trim()}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
                backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 20px",
                minHeight: "44px", cursor: "pointer", opacity: pending || !f.name.trim() ? 0.5 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13px", marginTop: "12px", marginBottom: 0, color: msg === "Saved." ? C.greenText : "#A3261A" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
      <span style={{ color: "#4A5A74" }}>{k}</span>
      <span style={{ color: C.ink, fontWeight: 500, textAlign: "right", textTransform: k === "Type" ? "capitalize" : "none" }}>{v}</span>
    </div>
  );
}
