"use client";

import { useEffect, useRef, useState } from "react";
import { submitToScreen } from "@/app/actions/impact-counter";
import {
  WORDS, loadSession, newSession, pending, saveSession,
  type CounterSession, type Project,
} from "@/lib/counter/session";

/**
 * The counter an iPad runs at the table while a group works.
 *
 * Three screens: who has arrived, the count, and a setup panel for the
 * things that change mid-session. Built to the handoff, with one thing
 * deliberately different — see the note on the submit button.
 *
 * Everything except a submit is local. A group's count belongs to the
 * device until somebody decides the wall should know, and holding it there
 * means a dropped network costs nothing until the one moment that needs it.
 */

const C = {
  blue: "#1E3FA0",
  orange: "#FF8A00",
  lightOrange: "#FFC27A",
  field: "#F1F4FB",
  muted: "#8A90AE",
  border: "#D5DAEA",
  off: "#C9CCDA",
  white: "#FFFFFF",
} as const;

const GRADIENT = "linear-gradient(135deg,#1F6FB8,#25319A)";

export function GroupCounter() {
  const [session, setSession] = useState<CounterSession | null>(null);
  const [ready, setReady] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resume whatever this iPad was in the middle of.
  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  const update = (next: CounterSession | null) => {
    setSession(next);
    saveSession(next);
  };

  async function submit() {
    if (!session || sending) return;
    const delta = pending(session);
    if (delta === 0) { setNote("Nothing new to send yet."); return; }
    setError(null);
    setSending(true);
    const res = await submitToScreen({
      project: session.project,
      delta,
      groupName: session.showName ? session.groupName : "",
    });
    setSending(false);
    if (!res.ok) { setError(res.error); return; }
    update({ ...session, submitted: session.count });
    setNote(`On the screen: ${delta > 0 ? "+" : ""}${delta} ${WORDS[session.project].one}${Math.abs(delta) === 1 ? "" : "s"}`);
  }

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);

  if (!ready) return <div style={{ ...S.page, background: GRADIENT }} />;

  if (!session) {
    return (
      <div style={{ ...S.page, background: GRADIENT }}>
        <Welcome onStart={(s) => update(s)} />
      </div>
    );
  }

  return (
    <div style={{ ...S.page, background: GRADIENT, display: "block" }}>
      <Counter
        session={session}
        sending={sending}
        note={note}
        error={error}
        onCount={(n) => update({ ...session, count: Math.max(0, n) })}
        onSubmit={submit}
        onSetup={() => setSetupOpen(true)}
      />
      {setupOpen ? (
        <Setup
          session={session}
          onChange={update}
          onClose={() => setSetupOpen(false)}
          onNewGroup={() => { update(null); setSetupOpen(false); }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ welcome -- */

function Welcome({ onStart }: { onStart: (s: CounterSession) => void }) {
  const [name, setName] = useState("");
  const [project, setProject] = useState<Project>("pizzas");
  const [amount, setAmount] = useState("");
  const [justCount, setJustCount] = useState(false);

  const goal = Number(amount);
  const ready = name.trim().length > 0 && (justCount || (Number.isFinite(goal) && goal > 0));

  return (
    <div style={S.welcomeCard}>
      <Wordmark size={30} />
      <h1 style={{ fontSize: "40px", fontWeight: 900, color: C.blue, margin: 0, lineHeight: 1.1 }}>
        Welcome! Let&rsquo;s get started.
      </h1>

      <Field label="Group name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bnei Akiva"
          autoCapitalize="words"
          maxLength={48}
          style={S.bigInput}
        />
      </Field>

      <Field label="What are you making?">
        <Segmented
          options={[{ id: "pizzas", label: "Pizzas" }, { id: "beds", label: "Beds" }]}
          value={project}
          onChange={(v) => setProject(v as Project)}
        />
      </Field>

      <Field label={`How many ${project} are you making?`}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          disabled={justCount}
          placeholder="0"
          style={{
            ...S.bigInput, fontSize: "26px", fontWeight: 800,
            opacity: justCount ? 0.45 : 1,
          }}
        />
        <button
          type="button"
          onClick={() => setJustCount((v) => !v)}
          style={{
            ...S.toggle,
            background: justCount ? C.blue : C.white,
            color: justCount ? C.white : C.blue,
            border: justCount ? "2px solid transparent" : `2px solid ${C.border}`,
          }}
        >
          Not sure — just count
        </button>
      </Field>

      <button
        type="button"
        disabled={!ready}
        onClick={() =>
          onStart(newSession({ groupName: name, project, goal: justCount ? null : goal }))
        }
        style={{ ...S.start, opacity: ready ? 1 : 0.45 }}
      >
        Start
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ counter -- */

function Counter({
  session, sending, note, error, onCount, onSubmit, onSetup,
}: {
  session: CounterSession;
  sending: boolean;
  note: string | null;
  error: string | null;
  onCount: (n: number) => void;
  onSubmit: () => void;
  onSetup: () => void;
}) {
  const w = WORDS[session.project];
  const waiting = pending(session);
  const reached = session.goal !== null && session.count >= session.goal;
  const left = session.goal === null ? 0 : Math.max(0, session.goal - session.count);

  return (
    <div style={S.counterWrap}>
      <header style={S.header}>
        <div>
          <Wordmark size={34} onDark />
          <div style={{ color: C.lightOrange, fontWeight: 700, fontSize: "16px", marginTop: "4px" }}>
            {w.label} · Group counter
          </div>
        </div>
        <button type="button" onClick={onSetup} style={S.setupPill}>
          <span aria-hidden="true">⚙</span> Setup
        </button>
      </header>

      <div style={S.grid}>
        <section style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: C.orange }} />
            <span style={{
              fontWeight: 800, fontSize: "22px", letterSpacing: ".14em",
              textTransform: "uppercase", color: C.blue,
            }}>{w.made}</span>
            {reached ? (
              <span style={{
                background: C.orange, color: C.white, fontWeight: 800, fontSize: "16px",
                borderRadius: "20px", padding: "6px 14px",
              }}>Goal reached!</span>
            ) : null}
          </div>

          <div style={S.bigNumber}>
            {session.count.toLocaleString()}
            {session.goal !== null ? (
              <span style={{ color: C.muted, fontWeight: 800, fontSize: "36px" }}> / {session.goal}</span>
            ) : null}
          </div>

          {session.goal !== null ? (
            <div>
              <div style={S.track}>
                <div style={{
                  ...S.fill,
                  width: `${Math.min(100, (session.count / session.goal) * 100)}%`,
                }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: C.blue, marginTop: "10px" }}>
                {reached ? "You did it — amazing work!" : `${left} more to reach the goal`}
              </div>
            </div>
          ) : null}

          <div style={S.buttons}>
            <button
              type="button"
              onClick={() => onCount(session.count - 1)}
              disabled={session.count === 0}
              aria-label={`One fewer ${w.one}`}
              style={{ ...S.minus, opacity: session.count === 0 ? 0.4 : 1 }}
            >−</button>
            <button
              type="button"
              onClick={() => onCount(session.count + 1)}
              aria-label={`One more ${w.one}`}
              style={S.plus}
            >+1</button>
          </div>
        </section>

        <aside style={S.side}>
          <div style={S.sideCard}>
            <div style={S.sideLabel}>Today&rsquo;s group</div>
            <div style={{ fontWeight: 900, fontSize: "26px", color: C.blue, marginTop: "6px" }}>
              {session.showName && session.groupName
                ? `Welcome, ${session.groupName}!`
                : "Welcome to Just One Chesed!"}
            </div>
          </div>

          <div style={S.sideCard}>
            <div style={S.sideLabel}>Waiting to send</div>
            <div style={{ fontWeight: 900, fontSize: "40px", color: waiting > 0 ? C.orange : C.muted }}>
              {waiting > 0 ? `+${waiting}` : waiting < 0 ? waiting : "—"}
            </div>
            <div style={{ color: C.muted, fontWeight: 600, fontSize: "14px", marginTop: "2px" }}>
              {session.submitted.toLocaleString()} already on the screen
            </div>
          </div>

          {error ? <div role="alert" style={S.error}>{error}</div> : null}
          {note && !error ? <div style={S.note}>{note}</div> : null}

          {/*
            The handoff pins this to the bottom and never changes its label.
            It says how many are waiting as well, because the one mistake
            this button can make is being pressed twice — and a button that
            reads "Submit 4 to Live Screen" and then "Nothing to send" is a
            button that cannot be pressed twice by accident.
          */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={sending || waiting === 0}
            style={{ ...S.submit, opacity: sending || waiting === 0 ? 0.5 : 1 }}
          >
            {sending
              ? "Sending…"
              : waiting === 0
                ? "Nothing new to send"
                : `Submit ${waiting > 0 ? `${waiting} ` : ""}to Live Screen`}
          </button>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- setup -- */

function Setup({
  session, onChange, onClose, onNewGroup,
}: {
  session: CounterSession;
  onChange: (s: CounterSession) => void;
  onClose: () => void;
  onNewGroup: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [total, setTotal] = useState(String(session.count));

  return (
    <div style={S.scrim} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Setup">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: 900, fontSize: "28px", color: C.blue, margin: 0 }}>Setup</h2>
          <button type="button" onClick={onClose} style={S.donePill}>Done</button>
        </div>

        <Section title="This group is making">
          <Segmented
            options={[{ id: "pizzas", label: "Pizzas" }, { id: "beds", label: "Beds" }]}
            value={session.project}
            onChange={(v) => onChange({ ...session, project: v as Project })}
          />
        </Section>

        <Section title="Show group name">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              role="switch"
              aria-checked={session.showName}
              onClick={() => onChange({ ...session, showName: !session.showName })}
              style={{
                width: "60px", height: "36px", borderRadius: "18px", border: "none",
                background: session.showName ? C.orange : C.off, position: "relative",
                cursor: "pointer", flex: "0 0 auto",
              }}
            >
              <span style={{
                position: "absolute", top: "4px", left: session.showName ? "28px" : "4px",
                width: "28px", height: "28px", borderRadius: "50%", background: C.white,
                transition: "left .15s ease",
              }} />
            </button>
            <input
              value={session.groupName}
              onChange={(e) => onChange({ ...session, groupName: e.target.value.slice(0, 48) })}
              placeholder="Group name"
              style={{ ...S.bigInput, height: "56px", fontSize: "18px" }}
            />
          </div>
        </Section>

        <Section title="Display">
          <Segmented
            options={[{ id: "count", label: "Just count" }, { id: "goal", label: "Count to a goal" }]}
            value={session.goal === null ? "count" : "goal"}
            onChange={(v) =>
              onChange({
                ...session,
                goal: v === "goal" ? Math.max(1, session.goal ?? (session.count || 1)) : null,
              })
            }
          />
          {session.goal !== null ? (
            <input
              value={String(session.goal)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, "").slice(0, 4));
                onChange({ ...session, goal: n > 0 ? n : 1 });
              }}
              inputMode="numeric"
              aria-label="Goal"
              style={{ ...S.bigInput, height: "56px", marginTop: "12px" }}
            />
          ) : null}
        </Section>

        <Section title="Set total">
          {/*
            For correcting a miscount. It changes what this iPad has counted,
            not what the wall has been told: the difference is what the next
            submit sends, so a correction downward sends a negative and the
            wall comes back to the truth.
          */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={total}
              onChange={(e) => setTotal(e.target.value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              aria-label="Set the count"
              style={{ ...S.bigInput, height: "56px" }}
            />
            <button
              type="button"
              onClick={() => onChange({ ...session, count: Math.max(0, Number(total) || 0) })}
              style={{ ...S.donePill, height: "56px" }}
            >Set</button>
          </div>
          <p style={{ color: C.muted, fontWeight: 600, fontSize: "13px", margin: "8px 0 0" }}>
            The next submit sends the difference, so a correction downward takes it off the screen too.
          </p>
        </Section>

        <Section title="New group — reset counts">
          {confirming ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={onNewGroup} style={{ ...S.donePill, background: C.orange }}>
                Yes, start a new group
              </button>
              <button type="button" onClick={() => setConfirming(false)} style={S.outlineBtn}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} style={S.outlineBtn}>
              New group
            </button>
          )}
          <p style={{ color: C.muted, fontWeight: 600, fontSize: "13px", margin: "8px 0 0" }}>
            What has already gone to the screen stays there.
          </p>
        </Section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- parts -- */

function Wordmark({ size, onDark }: { size: number; onDark?: boolean }) {
  return (
    <div style={{ fontWeight: 800, fontSize: `${size}px`, color: onDark ? C.white : C.blue }}>
      Just<span style={{ color: C.orange }}>O</span>neChesed
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <span style={{
        fontWeight: 800, fontSize: "14px", letterSpacing: ".12em",
        textTransform: "uppercase", color: C.blue,
      }}>{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: `2px solid ${C.field}`, paddingTop: "18px" }}>
      <div style={{
        fontWeight: 800, fontSize: "14px", letterSpacing: ".12em",
        textTransform: "uppercase", color: C.blue, marginBottom: "12px",
      }}>{title}</div>
      {children}
    </section>
  );
}

function Segmented({
  options, value, onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" style={{
      display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      gap: "8px", background: C.field, padding: "6px", borderRadius: "20px",
    }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            style={{
              height: "60px", borderRadius: "15px", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 800, fontSize: "17px",
              background: on ? C.blue : "transparent",
              color: on ? C.white : C.blue,
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    padding: "32px",
    boxSizing: "border-box",
    fontFamily: "Montserrat, system-ui, sans-serif",
    overflowY: "auto",
  },
  welcomeCard: {
    background: C.white, maxWidth: "620px", width: "100%", borderRadius: "40px",
    padding: "40px", display: "flex", flexDirection: "column", gap: "28px",
    margin: "auto", boxSizing: "border-box",
  },
  bigInput: {
    height: "64px", background: C.field, borderRadius: "18px", border: "none",
    padding: "0 20px", fontWeight: 700, fontSize: "22px", color: C.blue,
    width: "100%", fontFamily: "inherit", boxSizing: "border-box",
  },
  toggle: {
    height: "64px", borderRadius: "18px", marginTop: "12px", width: "100%",
    cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: "18px",
  },
  start: {
    height: "80px", borderRadius: "28px", background: C.orange, color: C.white,
    border: "none", fontFamily: "inherit", fontWeight: 900, fontSize: "24px",
    cursor: "pointer", boxShadow: "0 12px 28px rgba(255,138,0,.35)",
  },

  counterWrap: { padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: "24px" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" },
  setupPill: {
    height: "56px", padding: "0 22px", borderRadius: "28px", background: C.white,
    color: C.blue, border: "none", fontFamily: "inherit", fontWeight: 800,
    fontSize: "17px", cursor: "pointer", flex: "0 0 auto",
  },
  grid: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(300px,360px)", gap: "24px" },
  card: {
    background: C.white, borderRadius: "36px", padding: "32px 36px", minHeight: "560px",
    boxShadow: "0 24px 60px rgba(10,20,90,.25)", display: "flex",
    flexDirection: "column", gap: "20px",
  },
  bigNumber: {
    fontWeight: 900, fontSize: "clamp(120px,17vw,210px)", lineHeight: 0.85,
    color: C.blue, fontVariantNumeric: "tabular-nums",
  },
  track: { height: "18px", borderRadius: "9px", background: C.field, overflow: "hidden" },
  fill: { height: "100%", background: C.orange, transition: "width .4s ease" },
  buttons: { display: "grid", gridTemplateColumns: "120px 1fr", gap: "16px", marginTop: "auto" },
  minus: {
    height: "120px", borderRadius: "30px", background: C.field, color: C.blue,
    border: "none", fontFamily: "inherit", fontWeight: 900, fontSize: "52px", cursor: "pointer",
  },
  plus: {
    height: "120px", borderRadius: "30px", background: C.orange, color: C.white,
    border: "none", fontFamily: "inherit", fontWeight: 900, fontSize: "46px",
    cursor: "pointer", boxShadow: "0 12px 28px rgba(255,138,0,.35)",
  },

  side: { display: "flex", flexDirection: "column", gap: "20px" },
  sideCard: { background: C.white, borderRadius: "30px", padding: "24px" },
  sideLabel: {
    fontWeight: 800, fontSize: "13px", letterSpacing: ".14em",
    textTransform: "uppercase", color: C.muted,
  },
  error: {
    background: "#FFE8E4", color: "#A3261A", borderRadius: "20px",
    padding: "14px 18px", fontWeight: 700, fontSize: "15px",
  },
  note: {
    background: "rgba(255,255,255,.18)", color: C.white, borderRadius: "20px",
    padding: "14px 18px", fontWeight: 700, fontSize: "15px",
  },
  submit: {
    marginTop: "auto", height: "96px", borderRadius: "30px", background: C.orange,
    color: C.white, border: "none", fontFamily: "inherit", fontWeight: 900,
    fontSize: "24px", cursor: "pointer", boxShadow: "0 12px 28px rgba(255,138,0,.35)",
  },

  scrim: {
    position: "fixed", inset: 0, background: "rgba(8,16,70,.55)",
    display: "flex", justifyContent: "flex-end", padding: "16px", zIndex: 30,
  },
  sheet: {
    background: C.white, width: "min(460px, 100% - 32px)", borderRadius: "32px",
    padding: "28px", display: "flex", flexDirection: "column", gap: "22px",
    overflowY: "auto", boxSizing: "border-box",
  },
  donePill: {
    height: "48px", padding: "0 22px", borderRadius: "24px", background: C.blue,
    color: C.white, border: "none", fontFamily: "inherit", fontWeight: 800,
    fontSize: "16px", cursor: "pointer",
  },
  outlineBtn: {
    height: "56px", padding: "0 24px", borderRadius: "28px", background: "transparent",
    color: C.blue, border: `2px solid ${C.blue}`, fontFamily: "inherit",
    fontWeight: 800, fontSize: "16px", cursor: "pointer",
  },
};
