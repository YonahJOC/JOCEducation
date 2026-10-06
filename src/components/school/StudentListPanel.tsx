"use client";

import { useActionState, useRef } from "react";
import { uploadStudentList, type ListResult } from "@/app/actions/student-list";
import { BandRow } from "@/components/ui/BandRow";
import { C, F } from "@/lib/joc-tokens";

/**
 * Where the school's student list has got to.
 *
 * Three states, and the stuck one is the point: JOC marks a list unusable
 * with a reason, and that reason appears here rather than in somebody's
 * inbox. Before this the school found out on a phone call, or didn't.
 *
 * Shown only to whoever runs the account. A teacher who runs the school's app
 * has no business sending the list of every student.
 */
export function StudentListPanel({
  state, note, at,
}: {
  state: "NOT_SENT" | "UPLOADED" | "STUCK";
  note: string | null;
  at: Date | null;
}) {
  const [result, action, pending] = useActionState<ListResult | null, FormData>(
    uploadStudentList,
    null,
  );
  const picker = useRef<HTMLInputElement>(null);

  const when = at
    ? at.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const upload = (
    <form action={action} style={{ display: "contents" }}>
      <input
        ref={picker}
        type="file"
        name="file"
        accept=".csv,.xlsx,.xls,.pdf,.numbers,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(e) => { if (e.target.files?.length) e.target.form?.requestSubmit(); }}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => picker.current?.click()}
        disabled={pending}
        style={{
          fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white,
          backgroundColor: C.blue, border: "none", borderRadius: "12px",
          padding: "0 18px", minHeight: "44px", cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.7 : 1, width: "100%",
        }}
      >
        {pending
          ? "Sending…"
          : state === "NOT_SENT"
          ? "Send your list"
          : state === "STUCK"
          ? "Send a fixed list"
          : "Send an updated one"}
      </button>
    </form>
  );

  return (
    <div style={{ marginBottom: "10px" }}>
      <BandRow
        tone={state === "UPLOADED" ? "good" : state === "STUCK" ? "urgent" : "warn"}
        label="Student list"
        figure={state === "UPLOADED" ? "Sent" : state === "STUCK" ? "Stuck" : "Not sent"}
        word
        title={
          state === "UPLOADED"
            ? `JOC has your list${when ? ` from ${when}` : ""}`
            : state === "STUCK"
            ? "JOC can't use the list you sent"
            : "JOC doesn't have your student list yet"
        }
        line={
          state === "STUCK"
            ? note ?? "Nobody wrote down what was wrong with it. Ask your coordinator."
            : state === "UPLOADED"
            ? "New students this year? Send an updated one."
            : "It's how students get onto the app."
        }
        actionNode={upload}
      />

      {result && !result.ok && (
        <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "6px 2px 0" }}>
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p style={{ fontFamily: F.read, fontSize: "14px", color: C.greenText, margin: "6px 2px 0" }}>
          Sent. JOC will tell you if anything needs changing.
        </p>
      )}
    </div>
  );
}
