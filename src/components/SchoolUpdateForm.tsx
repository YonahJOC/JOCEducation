"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { logSchoolUpdate, type LogResult } from "@/app/actions/school-update";
import {
  NEW_CONTACT, INTERACTION_LABEL, INTERACTION_TYPES,
  type UpdateKind, type EventStage, type InteractionType,
} from "@/lib/school-update";
import { C, R, F, label, primaryButton } from "@/lib/joc-tokens";

/**
 * The JOC School Update Form.
 *
 * Built for somebody standing in a car park on a phone, not for a desk: one
 * column, big targets, and labels rather than instructions. Nothing here
 * explains itself in a sentence — a field that needs a paragraph is the wrong
 * field.
 *
 * A meeting and an event are not the same fact, so they are not the same
 * form. A meeting asks who and what was said. An event asks whether the date
 * is set or it is already behind us, and only then what to fill in.
 */

type WhenChoice = "TODAY" | "OTHER";

export function SchoolUpdateForm({
  schools, programs, myName, locked = false, signIn = null,
}: {
  schools: { id: string; name: string; contacts: { id: string; name: string }[] }[];
  programs: { id: number; name: string }[];
  myName: string;
  /**
   * Nobody has signed in yet. The form still works — they fill it in and the
   * sign-in sits where the send button goes. What they type is kept in their
   * own browser and put back when they come back from Google.
   */
  locked?: boolean;
  /** The sign-in, which is its own form and so cannot be nested in this one. */
  signIn?: React.ReactNode;
}) {
  const [result, action, pending] = useActionState<LogResult | null, FormData>(logSchoolUpdate, null);

  const [kind, setKind] = useState<UpdateKind | "">("");
  const [how, setHow] = useState<InteractionType>("MEETING");
  const [stage, setStage] = useState<EventStage>("DONE");
  const [schoolId, setSchoolId] = useState("");
  const [adding, setAdding] = useState(false);
  const [contactId, setContactId] = useState("");
  const [whenChoice, setWhenChoice] = useState<WhenChoice>("TODAY");
  const [again, setAgain] = useState(0);

  const school = schools.find((s) => s.id === schoolId) ?? null;
  const contacts = school?.contacts ?? [];
  const naming = contactId === NEW_CONTACT;
  const today = new Date().toISOString().slice(0, 10);

  const talking = kind === "INTERACTION";
  const booked = kind === "EVENT" && stage === "BOOKED";

  // What they wrote before signing in, carried across the trip to Google.
  const box = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLFormElement>(null);
  const [restoring, setRestoring] = useState<Record<string, string> | null>(null);

  /** Every keystroke, because the trip to Google is a full page load. */
  const keepDraft = () => {
    const el = box.current;
    if (!el) return;
    const d: Record<string, string> = {};
    el.querySelectorAll<HTMLInputElement>("[name]").forEach((f) => {
      // The sign-in sits inside this card and carries fields of its own.
      if (f.closest("form")) return;
      if (f.value) d[f.name] = f.value;
    });
    try { sessionStorage.setItem(DRAFT, JSON.stringify(d)); } catch { /* private window */ }
  };

  // Back from Google. Read it once, clear it, and open whichever branches it
  // needs before filling in.
  //
  // setState in an effect, deliberately: sessionStorage exists only in the
  // browser, so reading it during render would make this markup disagree with
  // the server's. It runs once, on the one page load that follows a sign-in.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (locked) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(DRAFT);
      sessionStorage.removeItem(DRAFT);
    } catch { /* private window */ }
    if (!raw) return;

    let d: Record<string, string>;
    try { d = JSON.parse(raw) as Record<string, string>; } catch { return; }

    if (d.kind === "INTERACTION" || d.kind === "EVENT") setKind(d.kind);
    if (d.how === "MEETING" || d.how === "CALL" || d.how === "EMAIL") setHow(d.how);
    if (d.stage === "BOOKED" || d.stage === "DONE") setStage(d.stage);
    if (d.whenChoice === "TODAY" || d.whenChoice === "OTHER") setWhenChoice(d.whenChoice);
    if (d.schoolId) setSchoolId(d.schoolId);
    if (d.newSchoolName) setAdding(true);
    if (d.contactId) setContactId(d.contactId);
    setRestoring(d);
  }, [locked]);

  // One render later, with those branches on screen, put the values back.
  useEffect(() => {
    const el = live.current;
    if (!restoring || !el) return;
    for (const [name, value] of Object.entries(restoring)) {
      // The selects are controlled; setting them here would fight React.
      if (name === "schoolId" || name === "contactId") continue;
      const f = el.querySelector<HTMLInputElement>(`[name="${name}"]`);
      if (f) f.value = value;
    }
    setRestoring(null);
  }, [restoring]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (result?.ok) {
    return (
      <div style={{ ...card, padding: "30px 26px", textAlign: "center" }}>
        <p style={{ fontSize: "34px", margin: "0 0 8px" }} aria-hidden="true">✓</p>
        <h2 style={{
          fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em",
          color: C.ink, margin: "0 0 8px", lineHeight: 1.2,
        }}>
          Thank you
        </h2>
        <p style={{
          fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted,
          margin: "0 auto 8px", maxWidth: "40ch",
        }}>
          {result.booked
            ? `In the diary for ${result.schoolName}.`
            : `Saved to ${result.schoolName}.`}
        </p>

        {result.newSchool && (
          <p style={{
            fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.orangeText,
            margin: "0 auto 18px", maxWidth: "42ch",
          }}>
            {result.schoolName} wasn&rsquo;t on our list. It&rsquo;s been added for the office
            to check.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setKind(""); setStage("DONE"); setSchoolId(""); setAdding(false);
            setContactId(""); setWhenChoice("TODAY"); setAgain((n) => n + 1);
            // useActionState has no reset, so the form is remounted by key.
            window.location.reload();
          }}
          style={{ ...primaryButton, cursor: "pointer", marginTop: "8px" }}
        >
          Add another
        </button>
      </div>
    );
  }

  /** Today, or a date they pick. Shared by a conversation and a run event. */
  const dateBlock = (title: string) => (
    <div>
      <Label>{title}</Label>
      <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "1fr 1fr" }}>
        <Radio on={whenChoice === "TODAY"} onPick={() => setWhenChoice("TODAY")}>Today</Radio>
        <Radio on={whenChoice === "OTHER"} onPick={() => setWhenChoice("OTHER")}>Another date</Radio>
      </div>
      {/* Distinct keys: without them React reuses the one <input> and swaps
          defaultValue for value, which is the controlled-to-uncontrolled
          warning and, eventually, a date that will not change. */}
      {whenChoice === "OTHER" ? (
        <input key="when-picked" type="date" name="when" defaultValue={today} style={{ ...input, marginTop: "8px" }} />
      ) : (
        <input key="when-today" type="hidden" name="when" value={today} readOnly />
      )}
    </div>
  );

  const fields = (
    <>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="how" value={how} />
      <input type="hidden" name="stage" value={stage} />
      <input type="hidden" name="whenChoice" value={whenChoice} />

      <div>
        <Label>Interaction or event</Label>
        <Choice
          options={[
            { value: "INTERACTION", label: "Interaction" },
            { value: "EVENT", label: "Event" },
          ]}
          value={kind}
          onPick={(v) => setKind(v as UpdateKind)}
        />
      </div>

      {/* A meeting, a call and an email are the same fact told three ways.
          One branch, three records. */}
      {talking && (
        <div>
          <Label>How</Label>
          <Choice
            options={INTERACTION_TYPES.map((t) => ({
              value: t, label: INTERACTION_LABEL[t],
            }))}
            value={how}
            onPick={(v) => setHow(v as InteractionType)}
          />
        </div>
      )}

      {kind && (
        <>
          <div>
            <Label>School</Label>
            {!adding ? (
              <>
                <select
                  name="schoolId"
                  value={schoolId}
                  onChange={(e) => { setSchoolId(e.target.value); setContactId(""); }}
                  style={input}
                >
                  <option value="">Pick a school</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { setAdding(true); setSchoolId(""); setContactId(""); }}
                  style={quiet}
                >
                  It&rsquo;s not listed
                </button>
              </>
            ) : (
              <>
                <input name="newSchoolName" placeholder="School name" style={input} autoFocus />
                <button type="button" onClick={() => setAdding(false)} style={quiet}>
                  Pick from the list instead
                </button>
              </>
            )}
          </div>

          <div>
            <Label>Program</Label>
            <select name="programId" style={input} defaultValue="">
              <option value="">None / something else</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Always a list, even at a school we hold nobody for — the way to
              add somebody is the last line of it. */}
          <div>
            <Label>Who at the school</Label>
            <select
              name="contactId"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              style={input}
            >
              <option value="">Pick a person</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value={NEW_CONTACT}>Add someone…</option>
            </select>
            {naming && (
              <>
                <input name="contactName" placeholder="Name" style={{ ...input, marginTop: "8px" }} />
                <input name="contactReach" placeholder="Email or phone" style={{ ...input, marginTop: "8px" }} />
              </>
            )}
          </div>

          {talking ? (
            <>
              <div>
                <Label>Conversation notes</Label>
                <textarea
                  name="what"
                  rows={5}
                  required
                  style={{ ...input, resize: "vertical", fontFamily: F.read }}
                />
              </div>
              {dateBlock("Date of conversation")}
            </>
          ) : (
            <>
              <Check
                checked={booked}
                onChange={(on) => setStage(on ? "BOOKED" : "DONE")}
                title="Event date set"
              />

              {booked ? (
                <>
                  <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                    <div>
                      <Label>Date</Label>
                      <input type="date" name="when" defaultValue={today} style={input} />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <input type="time" name="time" style={input} />
                    </div>
                  </div>
                  <div>
                    <Label>Event notes</Label>
                    <textarea
                      name="what"
                      rows={4}
                      style={{ ...input, resize: "vertical", fontFamily: F.read }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Post event notes</Label>
                    <textarea
                      name="what"
                      rows={5}
                      required
                      style={{ ...input, resize: "vertical", fontFamily: F.read }}
                    />
                  </div>
                  {dateBlock("Date of event")}
                  <div>
                    <Label>Students</Label>
                    <input
                      type="number"
                      name="students"
                      min="0"
                      inputMode="numeric"
                      placeholder="Roughly"
                      style={input}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );

  // Not signed in: the same card and the same live fields, with the sign-in
  // standing where the send button goes. Not a <form>, because the sign-in
  // inside it is one and they cannot nest.
  if (locked) {
    return (
      <div
        ref={box}
        onInput={keepDraft}
        onChange={keepDraft}
        style={{ ...card, display: "grid", gap: "18px" }}
      >
        {fields}

        <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: "18px" }}>
          {signIn}
        </div>
      </div>
    );
  }

  return (
    <form ref={live} key={again} action={action} style={{ ...card, display: "grid", gap: "18px" }}>
      {fields}

      {result && !result.ok && (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: 0 }}>
          {result.error}
        </p>
      )}

      {kind && (
        <div>
          <button
            type="submit"
            disabled={pending}
            style={{
              ...primaryButton, width: "100%", minHeight: "52px", fontSize: "17px",
              cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Saving…" : "Send"}
          </button>
          <p style={{ ...hint, textAlign: "center", marginTop: "10px" }}>{myName}</p>
        </div>
      )}
    </form>
  );
}

/** One box to tick, where the answer is yes or nothing. */
function Check({
  checked, onChange, title,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  title: string;
}) {
  return (
    <label style={{
      display: "flex", gap: "12px", alignItems: "center", cursor: "pointer",
      border: `1.5px solid ${checked ? C.ink : C.hairline}`,
      borderRadius: R.form, padding: "14px 16px", minHeight: "50px",
      backgroundColor: checked ? C.blueTint : C.white,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "22px", height: "22px", margin: 0, flex: "0 0 auto", cursor: "pointer" }}
      />
      <span style={{
        fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink, lineHeight: 1.35,
      }}>
        {title}
      </span>
    </label>
  );
}

/** One of two, drawn as a radio because that is what it is. */
function Radio({
  on, onPick, children,
}: {
  on: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{
      display: "flex", gap: "9px", alignItems: "center", cursor: "pointer",
      border: `1.5px solid ${on ? C.ink : C.hairline}`,
      borderRadius: R.form, padding: "0 12px", minHeight: "50px",
      backgroundColor: on ? C.blueTint : C.white,
    }}>
      <input
        type="radio"
        checked={on}
        onChange={onPick}
        style={{ width: "19px", height: "19px", margin: 0, flex: "0 0 auto", cursor: "pointer" }}
      />
      <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink }}>
        {children}
      </span>
    </label>
  );
}

/** Two buttons that behave as one answer. */
function Choice({
  options, value, onPick,
}: {
  options: { value: string; label: string }[];
  value: string;
  onPick: (v: string) => void;
}) {
  // Two across on a phone once there are more than three, rather than four
  // columns of squeezed text.
  return (
    <div style={{
      display: "grid", gap: "8px",
      gridTemplateColumns: options.length > 3
        ? "repeat(auto-fit, minmax(140px, 1fr))"
        : `repeat(${options.length}, 1fr)`,
    }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(o.value)}
            style={{
              fontFamily: F.ui, fontSize: "16px", fontWeight: 600,
              color: on ? C.white : C.ink,
              backgroundColor: on ? C.ink : C.white,
              border: on ? `1.5px solid ${C.ink}` : `1.5px solid ${C.hairline}`,
              borderRadius: R.form, padding: "0 10px", minHeight: "50px",
              cursor: "pointer", textAlign: "center",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...label, color: C.muted, margin: "0 0 7px" }}>{children}</p>
  );
}

/** Their own browser, their own words — never sent anywhere until they send it. */
const DRAFT = "joc-school-update-draft";

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: "18px", padding: "22px 20px",
  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
};

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
