"use client";

import { useState, useTransition } from "react";
import { releaseUpdate } from "@/app/actions/buzz-pickup";
import { C, R, F, label } from "@/lib/joc-tokens";

/** Done with it, or putting it back on the Buzz for somebody else. */
export function MyUpdateRow({ activityId, done }: { activityId: string; done: boolean }) {
  const [gone, setGone] = useState(false);
  const [state, setState] = useState<"open" | "done">(done ? "done" : "open");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const run = (isDone: boolean, after: () => void) => {
    setError(null);
    after();
    start(async () => {
      const res = await releaseUpdate(activityId, isDone);
      if (!res.ok) {
        setGone(false);
        setState(done ? "done" : "open");
        setError(res.error ?? "That didn't save.");
      }
    });
  };

  if (gone) {
    return <p style={{ ...label, color: C.muted, margin: 0 }}>Back on the Buzz</p>;
  }

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
      {state === "open" ? (
        <button type="button" onClick={() => run(true, () => setState("done"))} style={primary}>
          Mark dealt with
        </button>
      ) : (
        <span style={{
          ...label, color: C.greenText, backgroundColor: C.greenTint,
          borderRadius: R.chip, padding: "6px 10px",
        }}>
          Dealt with
        </span>
      )}

      <button type="button" onClick={() => run(false, () => setGone(true))} style={quiet}>
        Put it back
      </button>

      {error && <span style={{ ...label, color: C.orangeText }}>{error}</span>}
    </div>
  );
}

const primary: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
  backgroundColor: C.white, border: `1px solid ${C.hairline}`,
  borderRadius: R.chip, padding: "8px 13px", minHeight: "38px", cursor: "pointer",
};

const quiet: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.muted,
  background: "none", border: "none", cursor: "pointer",
  padding: "6px 2px", minHeight: "38px",
};
