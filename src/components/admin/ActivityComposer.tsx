"use client";

import { useState, useTransition } from "react";
import { addSchoolNote } from "@/app/actions/admin";

const INK = "#10233F";
const RULE = "rgba(16,35,63,.15)";

/** Kind, label, and a prompt that suits that kind of interaction. */
const TYPES = [
  ["CALL", "Call", "Who you spoke to and what they said"],
  ["EMAIL", "Email", "What you wrote, or what came back"],
  ["MEETING", "Meeting", "Who was in the room and what was decided"],
  ["DEMO", "Demo", "What you showed and how it landed"],
  ["NOTE", "Note", "Anything worth knowing next time"],
] as const;

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none",
};

export function ActivityComposer({ schoolId, disabled }: { schoolId: string; disabled?: boolean }) {
  const [type, setType] = useState<string>("CALL");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 10));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await addSchoolNote({ schoolId, type, summary, detail, occurredAt: when });
      if (r.ok) {
        setSummary(""); setDetail("");
        setMsg("Logged.");
      } else {
        setMsg(r.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px" }}
    >
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
        Log an interaction
      </p>

      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "11px" }}>
        {TYPES.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setType(v)}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600,
              padding: "7px 13px", borderRadius: "9999px", cursor: "pointer", minHeight: "38px",
              border: type === v ? "1.5px solid #2D46AF" : `1px solid ${RULE}`,
              backgroundColor: type === v ? "#F4F7FD" : "#fff",
              color: type === v ? "#2D46AF" : "rgba(16,35,63,.7)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="What happened — one line"
        style={{ ...field, marginBottom: "9px" }}
      />
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={3}
        /* The prompt changes with the kind, so it asks for the right thing */
        placeholder={TYPES.find(([v]) => v === type)?.[2] ?? "Anything worth remembering"}
        style={{ ...field, resize: "vertical", marginBottom: "9px" }}
      />
      <div style={{ display: "flex", gap: "9px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="date"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          style={{ ...field, width: "auto", flex: "0 1 170px" }}
        />
        <button
          type="submit"
          disabled={disabled || pending || !summary.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: "#10233F", border: "none", borderRadius: "9999px",
            padding: "11px 20px", minHeight: "42px",
            cursor: disabled || !summary.trim() ? "not-allowed" : "pointer",
            opacity: disabled || pending || !summary.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : "Log it"}
        </button>
        {msg && (
          <span style={{ fontSize: "13px", color: msg === "Logged." ? "#1B7F4B" : "#B8321E" }}>{msg}</span>
        )}
      </div>
    </form>
  );
}
