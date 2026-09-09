"use client";

import { useState } from "react";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.14)";

export type DemoDay = { key: string; weekday: string; day: string; month: string };

/** Combine the chosen day (ISO date) and slot ("11:30 AM") into a timestamp. */
function isoFor(day: DemoDay, slot: string): string {
  const m = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return day.key;
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") hour += 12;
  const [y, mo, d] = day.key.split("-").map(Number);
  return new Date(y, mo - 1, d, hour, Number(m[2])).toISOString();
}

// Slots that are already taken. TODO: replace with real availability
// (Calendly / Google Calendar) once the JOC team picks a scheduler.
const TAKEN = new Set(["1-10:00 AM", "1-2:30 PM", "2-11:30 AM", "3-9:30 AM", "4-1:00 PM"]);
const SLOTS = ["9:30 AM", "10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "3:30 PM"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-outfit)",
  fontSize: "15px",
  color: INK,
  backgroundColor: "#F8FAFE",
  border: `1px solid ${RULE}`,
  borderRadius: "12px",
  padding: "13px 14px",
  outline: "none",
};

export function DemoScheduler({ days }: { days: DemoDay[] }) {
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");

  const day = days[dayIdx];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) { setError("Pick a time first."); return; }
    if (!name.trim() || !email.includes("@")) { setError("Name and a valid email, please."); return; }
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          school,
          requestedFor: isoFor(day, slot),
          message: `Requested ${day.weekday} ${day.month} ${day.day} at ${slot}.`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSending(false);
        setError(data?.error ?? "Something went wrong. Please email us instead.");
        return;
      }
    } catch {
      setSending(false);
      setError("Couldn't reach the server. Please email education@justonechesed.org.");
      return;
    }
    setSending(false);
    setDone(true);
  }

  if (done) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: `1.5px solid ${GREEN}`,
          borderRadius: "24px",
          padding: "34px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "46px", height: "46px", borderRadius: "50%",
            backgroundColor: "rgba(27,127,75,.12)", color: GREEN,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: "22px", fontWeight: 700,
          }}
          aria-hidden="true"
        >
          ✓
        </div>
        <p style={{ fontWeight: 700, fontSize: "19px", color: INK, marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Request sent
        </p>
        <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, marginBottom: "18px" }}>
          You asked for <strong style={{ color: INK }}>{day.weekday} {day.month} {day.day} at {slot}</strong>.
          Someone from the JOC Education team will confirm by email.
        </p>
        <button
          onClick={() => { setDone(false); setSlot(null); }}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13.5px",
            color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "44px",
          }}
        >
          Pick a different time
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        backgroundColor: "#fff",
        border: "1px solid rgba(16,35,63,.09)",
        borderRadius: "24px",
        boxShadow: "0 14px 36px rgba(16,35,63,.1)",
        padding: "26px",
      }}
    >
      <p style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "14px" }}>
        PICK A TIME
      </p>

      {/* Day chips */}
      <div role="group" aria-label="Choose a day" style={{ display: "flex", gap: "7px", marginBottom: "18px", flexWrap: "wrap" }}>
        {days.map((d, i) => {
          const on = i === dayIdx;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => { setDayIdx(i); setSlot(null); }}
              aria-pressed={on}
              style={{
                flex: "1 1 60px", minWidth: "58px", minHeight: "60px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px",
                borderRadius: "14px", cursor: "pointer",
                border: on ? `1.5px solid ${BLUE}` : `1px solid ${RULE}`,
                backgroundColor: on ? BLUE : "#fff",
                color: on ? "#fff" : INK,
                fontFamily: "var(--font-outfit)",
                transition: "background .15s",
              }}
            >
              <span style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", opacity: on ? 0.85 : 0.5 }}>
                {d.weekday}
              </span>
              <span style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1 }}>{d.day}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <div role="group" aria-label="Choose a time" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: "7px", marginBottom: "20px" }}>
        {SLOTS.map((s) => {
          const taken = TAKEN.has(`${dayIdx}-${s}`);
          const on = slot === s;
          return (
            <button
              key={s}
              type="button"
              disabled={taken}
              onClick={() => { setSlot(s); setError(null); }}
              aria-pressed={on}
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600,
                padding: "12px 8px", minHeight: "44px", borderRadius: "11px", cursor: taken ? "not-allowed" : "pointer",
                border: on ? `1.5px solid ${BLUE}` : `1px solid ${RULE}`,
                backgroundColor: on ? "rgba(45,70,175,.08)" : taken ? "rgba(16,35,63,.03)" : "#fff",
                color: taken ? "rgba(16,35,63,.3)" : on ? BLUE : INK,
                textDecoration: taken ? "line-through" : "none",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Your name" aria-label="Your name" autoComplete="name" style={inputStyle}
        />
        <input
          value={school} onChange={(e) => setSchool(e.target.value)}
          placeholder="School" aria-label="School" autoComplete="organization" style={inputStyle}
        />
        <input
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" aria-label="Email" type="email" autoComplete="email" style={inputStyle}
        />
      </div>

      {error && (
        <p role="alert" style={{ fontSize: "13px", color: "#B8321E", marginBottom: "12px" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        style={{
          width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "15px",
          color: "#fff", backgroundColor: INK, border: "none", borderRadius: "9999px",
          padding: "15px 20px", minHeight: "44px", cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1,
        }}
      >
        {sending ? "Sending…" : slot ? `Confirm ${day.weekday} ${day.day} · ${slot}` : "Pick a time above"}
      </button>
    </form>
  );
}
