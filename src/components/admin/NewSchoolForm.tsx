"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchool } from "@/app/actions/admin";

/**
 * Adding a school: a name and a country.
 *
 * It used to ask for city, region, type and enrollment band as well. All four
 * are real, and all four are things somebody often does not know at the
 * moment they want to write a school down — so the form stood between them
 * and the one fact they did have. Everything else is asked for on the
 * school's own page, which is where it belongs.
 */

const INK = "#10233F";
const BLUE = "#2D46AF";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

/** The ones JOC actually works in. Anything else is typed. */
const COUNTRIES = [
  "United States",
  "Israel",
  "Canada",
  "United Kingdom",
  "Australia",
  "South Africa",
];

export function NewSchoolForm({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("United States");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await createSchool({ name, country });
      if (r.ok) {
        setName("");
        setOpen(false);
        // Straight to the school, which is where the rest gets filled in.
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
        backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.12)",
        borderRadius: "16px", padding: "20px", maxWidth: "460px",
      }}
    >
      <p style={{ fontSize: "15px", fontWeight: 700, color: INK, margin: "0 0 4px" }}>Add a school</p>
      <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", lineHeight: 1.55, margin: "0 0 16px" }}>
        The name and where it is. Everything else — the city, the size, who runs chesed there — is
        on the school&rsquo;s own page once it exists.
      </p>

      <div style={{ marginBottom: "12px" }}>
        <label style={label} htmlFor="new-school-name">School name</label>
        <input
          id="new-school-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yeshiva Darchei Torah"
          required
          autoFocus
          disabled={pending}
          style={field}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={label} htmlFor="new-school-country">Country</label>
        <input
          id="new-school-country"
          list="joc-countries"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="United States"
          disabled={pending}
          style={field}
        />
        <datalist id="joc-countries">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 22px",
            minHeight: "44px", cursor: pending ? "wait" : "pointer", opacity: name.trim() ? 1 : 0.5,
          }}
        >
          {pending ? "Adding…" : "Create school"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setMsg(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
        >
          Cancel
        </button>
        {msg && <span style={{ fontSize: "13px", color: "#B8321E" }}>{msg}</span>}
      </div>
    </form>
  );
}
