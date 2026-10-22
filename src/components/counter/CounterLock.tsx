"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockCounter } from "@/app/actions/counter-lock";

/**
 * One box and one button.
 *
 * Nothing else: no email, no account, no "forgot it". Somebody standing at
 * a table with a group waiting types a word and starts counting, and the
 * iPad does not ask again for a year.
 */
export function CounterLock() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await unlockCounter(value);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "That did not work."); setValue(""); return; }
    router.refresh();
  }

  return (
    <main style={S.page}>
      <form
        style={S.card}
        onSubmit={(e) => { e.preventDefault(); void go(); }}
      >
        <div style={{ fontWeight: 800, fontSize: "30px", color: "#1E3FA0" }}>
          Just<span style={{ color: "#FF8A00" }}>O</span>neChesed
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#1E3FA0", margin: 0 }}>
          Group counter
        </h1>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          // A phone keyboard offers to save this and fill it next time,
          // which on a shared iPad is the whole point.
          autoComplete="current-password"
          enterKeyHint="go"
          style={S.input}
        />

        {error ? (
          <p role="alert" style={{ color: "#A3261A", fontWeight: 700, fontSize: "16px", margin: 0 }}>
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy || !value.trim()} style={{
          ...S.button,
          opacity: busy || !value.trim() ? 0.5 : 1,
        }}>
          {busy ? "Checking…" : "Start counting"}
        </button>
      </form>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#1F6FB8,#25319A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    fontFamily: "Montserrat, system-ui, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    borderRadius: "40px",
    padding: "40px",
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    boxSizing: "border-box",
  },
  input: {
    height: "72px",
    background: "#F1F4FB",
    border: "none",
    borderRadius: "18px",
    padding: "0 22px",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: "24px",
    color: "#1E3FA0",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    height: "76px",
    borderRadius: "28px",
    background: "#FF8A00",
    color: "#fff",
    border: "none",
    fontFamily: "inherit",
    fontWeight: 900,
    fontSize: "22px",
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(255,138,0,.35)",
  },
};
