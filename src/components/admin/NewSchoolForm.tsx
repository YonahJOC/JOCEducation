"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchool } from "@/app/actions/admin";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

export function NewSchoolForm({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("DAY_SCHOOL");
  const [enrollment, setEnrollment] = useState("MEDIUM");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await createSchool({ name, city, region, type, enrollment });
      if (r.ok) {
        setName(""); setCity(""); setRegion("");
        setOpen(false);
        if (r.id) router.push(`/admin/schools/${r.id}`);
        else router.refresh();
      } else {
        setMsg(r.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
          backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
          minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          whiteSpace: "nowrap",
        }}
      >
        + Add school
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        backgroundColor: "#fff", border: `1.5px solid ${BLUE}`, borderRadius: "16px",
        padding: "20px", marginBottom: "16px", width: "100%",
      }}
    >
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
        New school
      </p>

      <div style={{ marginBottom: "12px" }}>
        <label style={label}>School name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Yeshiva Darchei Torah" style={field} autoFocus />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={label}>City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brooklyn, NY" style={field} />
        </div>
        <div>
          <label style={label}>Region</label>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Brooklyn" style={field} />
        </div>
        <div>
          <label style={label}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={field}>
            <option value="DAY_SCHOOL">Day school</option>
            <option value="YESHIVA">Yeshiva</option>
            <option value="SEMINARY">Seminary</option>
            <option value="CHEDER">Cheder</option>
            <option value="HIGH_SCHOOL">High school</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label style={label}>Enrollment</label>
          <select value={enrollment} onChange={(e) => setEnrollment(e.target.value)} style={field}>
            <option value="SMALL">Under 150</option>
            <option value="MEDIUM">150–400</option>
            <option value="LARGE">400+</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 22px",
            minHeight: "44px", cursor: !name.trim() ? "not-allowed" : "pointer",
            opacity: pending || !name.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "Creating…" : "Create school"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setMsg(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
        >
          Cancel
        </button>
        {msg && <span style={{ fontSize: "13px", color: "#B8321E" }}>{msg}</span>}
      </div>
      <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "12px 0 0", lineHeight: 1.5 }}>
        Created as a prospect with no plan. Set the plan, invite staff and log activity on the school&rsquo;s page.
      </p>
    </form>
  );
}
