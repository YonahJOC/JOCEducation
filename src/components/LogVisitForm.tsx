"use client";

import { useActionState, useState } from "react";
import { logVisit, type LogResult } from "@/app/actions/log-visit";
import { C, R, F, label, primaryButton } from "@/lib/joc-tokens";

/**
 * What you did at a school, written down before you forget it.
 *
 * Built for somebody standing in a car park on a phone after an event, not
 * for a desk: one column, big targets, nothing to navigate, and a date that
 * is already today. Everything except the school and the line about what
 * happened is optional, because a half-filled record beats the one nobody
 * wrote.
 */

export function LogVisitForm({
  schools, programs, myName,
}: {
  schools: { id: string; name: string; contacts: { id: string; name: string }[] }[];
  programs: { id: number; name: string }[];
  myName: string;
}) {
  const [result, action, pending] = useActionState<LogResult | null, FormData>(logVisit, null);

  const [schoolId, setSchoolId] = useState("");
  const [adding, setAdding] = useState(false);
  const [contactId, setContactId] = useState("");
  const [newContact, setNewContact] = useState(false);
  const [again, setAgain] = useState(0);

  const school = schools.find((s) => s.id === schoolId) ?? null;
  const today = new Date().toISOString().slice(0, 10);

  if (result?.ok) {
    return (
      <div style={{
        backgroundColor: C.white, borderRadius: "18px", padding: "30px 26px",
        boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)", textAlign: "center",
      }}>
        <p style={{ fontSize: "34px", margin: "0 0 8px" }} aria-hidden="true">✓</p>
        <h2 style={{
          fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em",
          color: C.ink, margin: "0 0 10px", lineHeight: 1.2,
        }}>
          Thank you — that&rsquo;s written down
        </h2>
        <p style={{
          fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted,
          margin: "0 auto 8px", maxWidth: "44ch",
        }}>
          {result.schoolName} now has it on their record, and the office can see it.
        </p>

        {result.newSchool && (
          <p style={{
            fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.orangeText,
            margin: "0 auto 18px", maxWidth: "46ch",
          }}>
            {result.schoolName} wasn&rsquo;t on our list, so it has been added for somebody to
            check. Nothing else is needed from you.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setSchoolId(""); setAdding(false); setContactId("");
            setNewContact(false); setAgain((n) => n + 1);
            // useActionState has no reset, so the form is remounted by key.
            window.location.reload();
          }}
          style={{ ...primaryButton, cursor: "pointer", marginTop: "8px" }}
        >
          Log another one
        </button>
      </div>
    );
  }

  return (
    <form key={again} action={action} style={{
      backgroundColor: C.white, borderRadius: "18px", padding: "22px 20px",
      boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
      display: "grid", gap: "18px",
    }}>
      {/* ── Which school ──────────────────────────────────────────────── */}
      <div>
        <Label>Which school?</Label>
        {!adding ? (
          <>
            <select
              name="schoolId"
              value={schoolId}
              onChange={(e) => { setSchoolId(e.target.value); setContactId(""); setNewContact(false); }}
              style={input}
            >
              <option value="">Pick a school</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => { setAdding(true); setSchoolId(""); }}
              style={quiet}
            >
              It&rsquo;s not listed
            </button>
          </>
        ) : (
          <>
            <input name="newSchoolName" placeholder="The school's name" style={input} autoFocus />
            <button type="button" onClick={() => setAdding(false)} style={quiet}>
              Pick from the list instead
            </button>
            <p style={hint}>
              Somebody at the office will check the details. You don&rsquo;t need to.
            </p>
          </>
        )}
      </div>

      {/* ── Which program ─────────────────────────────────────────────── */}
      <div>
        <Label>Which program?</Label>
        <select name="programId" style={input} defaultValue="">
          <option value="">Not one of ours / something else</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* ── Who they dealt with ───────────────────────────────────────── */}
      <div>
        <Label>Who did you deal with there?</Label>
        {school && school.contacts.length > 0 && !newContact ? (
          <>
            <select
              name="contactId"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              style={input}
            >
              <option value="">Pick a person</option>
              {school.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" onClick={() => { setNewContact(true); setContactId(""); }} style={quiet}>
              Somebody new
            </button>
          </>
        ) : (
          <>
            <input name="contactName" placeholder="Their name" style={input} />
            <input
              name="contactReach"
              placeholder="Their email or phone, if you have it"
              style={{ ...input, marginTop: "8px" }}
            />
            {school && school.contacts.length > 0 && (
              <button type="button" onClick={() => setNewContact(false)} style={quiet}>
                Pick someone we already have
              </button>
            )}
          </>
        )}
      </div>

      {/* ── What happened ─────────────────────────────────────────────── */}
      <div>
        <Label>What did you do there?</Label>
        <textarea
          name="what"
          rows={4}
          required
          placeholder="Ran the boots assembly for grades 6 to 8"
          style={{ ...input, resize: "vertical", fontFamily: F.read }}
        />
      </div>

      <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div>
          <Label>When?</Label>
          <input type="date" name="when" defaultValue={today} style={input} />
        </div>
        <div>
          <Label>Roughly how many students?</Label>
          <input
            type="number"
            name="students"
            min="0"
            inputMode="numeric"
            placeholder="Optional"
            style={input}
          />
          <p style={hint}>A guess is fine — it&rsquo;s recorded as your estimate.</p>
        </div>
      </div>

      {result && !result.ok && (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: 0 }}>
          {result.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          style={{
            ...primaryButton, width: "100%", minHeight: "52px", fontSize: "17px",
            cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Saving…" : "Send it in"}
        </button>
        <p style={{ ...hint, textAlign: "center", marginTop: "10px" }}>
          Signed in as {myName}. Nothing is emailed to the school.
        </p>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...label, color: C.muted, margin: "0 0 7px" }}>{children}</p>
  );
}

const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: F.ui, fontSize: "16px", color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: R.form,
  padding: "12px 14px", minHeight: "50px",
};

const quiet: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue,
  background: "none", border: "none", cursor: "pointer",
  padding: "10px 2px", minHeight: "44px",
};

const hint: React.CSSProperties = {
  fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.muted, margin: "6px 0 0",
};
