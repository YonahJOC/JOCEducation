"use client";

import { useEffect, useRef, useState } from "react";
import { submitShoutOut } from "@/app/actions/school-screen";
import { shoutOutFrom } from "@/lib/school-screen/rules";
import { ACTIONS, ANSWER_MAX, C, SCREEN_NAME, isLive, type ScanAction } from "@/lib/scan/actions";

/**
 * What a phone sees after scanning the code on the lobby wall.
 *
 * Built to the design handoff: one column at 440px, navy edge to edge, a
 * home screen of doors and a flow behind each. Only the question is built,
 * so only its door is shown — see src/lib/scan/actions.ts.
 *
 * The question itself comes from the same place the wall gets it, passed in
 * from the server, so the thing being answered on the phone is the thing
 * being asked on the screen a few feet away. If those two ever drift apart
 * the page is worse than useless: it asks a stranger to answer something
 * nobody is showing them.
 */

/**
 * The parts a phone needs that an inline style cannot say: safe areas,
 * the real viewport height, what a press looks like, and what shows when
 * somebody drags the page past its end.
 */
const MOBILE = `
.jsl-page {
  /* 100vh on iOS Safari is the height with the toolbars hidden, which is
     taller than what you can see — the pinned button ends up under the
     browser's own chrome. dvh is the visible height; vh stays first for
     anything too old to know the newer one. */
  min-height: 100vh;
  min-height: 100dvh;
  /* Dragging a page past its end shows the body behind it. White behind
     navy reads as the page coming apart. */
  background: #1E2A8C;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
}
.jsl-col {
  /* Reach under the notch and the home bar, then keep the content out of
     them. max() so a phone with no insets still gets the design's 20px. */
  padding-left: max(20px, env(safe-area-inset-left));
  padding-right: max(20px, env(safe-area-inset-right));
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
}
.jsl-page button,
.jsl-page a[href] {
  /* Android paints a grey box over a tapped button; iOS flashes it. The
     design says a press is a slight shrink, so that is what a press is. */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform .08s ease;
}
.jsl-page button:not(:disabled):active,
.jsl-page a[href]:active { transform: scale(.98); }
.jsl-page textarea::placeholder,
.jsl-page input::placeholder { color: #8A90B5; opacity: 1; }
.jsl-page textarea,
.jsl-page input { -webkit-appearance: none; appearance: none; }
.jsl-page :focus-visible { outline: 3px solid #FFD23F; outline-offset: 2px; }
`;

type Screen = "home" | ScanAction | "thanks";

export function ScanLanding({
  question,
  slug,
  shortName,
}: {
  question: string;
  slug: string;
  shortName: string;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [answer, setAnswer] = useState("");
  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  // Null until they choose. The form this replaces made the choice
  // required and so does this: whether somebody's name goes on a wall in
  // a public lobby is not a thing to infer from whether they filled in an
  // optional box.
  const [showName, setShowName] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  // The design asks for a scroll to the top on every change of screen. On a
  // phone the alternative is landing halfway down a form you have not read.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
    window.scrollTo(0, 0);
  }, [screen]);

  /** Back, and Back to Start, both return home and forget everything typed. */
  function home() {
    setScreen("home");
    setAnswer("");
    setName("");
    setLast("");
    setShowName(null);
    setError(null);
  }

  function send() {
    const text = answer.trim();
    if (!text || sending) return;
    if (showName === null) { setError("Say whether your name may be shown."); return; }
    setError(null);
    setSending(true);
    const form = new FormData();
    form.set("slug", slug);
    form.set("text", text);
    form.set("firstName", name.trim());
    form.set("lastName", last.trim());
    form.set("grade", "");
    form.set("showName", showName ? "1" : "0");
    submitShoutOut(form).then((res) => {
      setSending(false);
      if (!res.ok) { setError(res.error); return; }
      setScreen("thanks");
    });
  }

  const label = screen === "home" || screen === "thanks" ? "Just One Chesed" : SCREEN_NAME[screen];

  return (
    <div className="jsl-page" style={S.page}>
      <style>{MOBILE}</style>
      <div className="jsl-col" style={S.col} ref={top}>
        <header style={S.header}>
          {screen === "home" || screen === "thanks" ? <span /> : (
            <button type="button" onClick={home} style={S.back}>&lsaquo;&ensp;Back</button>
          )}
          <span style={S.headerLabel}>{label}</span>
        </header>

        {screen === "home" ? <Home onPick={setScreen} /> : null}

        {screen === "answer" ? (
          <Answer
            question={question}
            answer={answer} setAnswer={setAnswer}
            name={name} setName={setName}
            last={last} setLast={setLast}
            showName={showName} setShowName={setShowName}
            sending={sending} error={error} onSend={send}
          />
        ) : null}

        {screen === "thanks" ? (
          <Thanks
            title="Thank you for sharing"
            sub={`Keep an eye on the screen — your answer may show up soon.`}
            onHome={home}
            shortName={shortName}
          />
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- home -- */

function Home({ onPick }: { onPick: (s: Screen) => void }) {
  const doors = ACTIONS.filter((a) => isLive(a.id));
  return (
    <>
      <div style={S.hero}>
        <h1 style={S.heroTitle}>
          Thank you for visiting{" "}
          <span style={{ color: C.orange }}>Just One Chesed.</span>
        </h1>
        <p style={S.heroSub}>What would you like to do?</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {doors.map((a) => {
          const inner = (
            <>
              <span style={{ textAlign: "left", whiteSpace: "pre-line" }}>{a.label}</span>
              <span aria-hidden="true" style={{ fontSize: "24px", flex: "0 0 auto" }}>
                {a.href ? "\u2197" : "\u2192"}
              </span>
            </>
          );
          const look = {
            ...S.door,
            background: a.bg,
            color: a.fg,
            ...(a.outline ? { border: "2px solid rgba(255,255,255,.55)", minHeight: "66px" } : null),
          };

          // A real anchor for the three that leave: long-press, copy, open
          // in a new tab and "opens in a new window" to a screen reader all
          // come free, and none of them do if a button sets location.
          return a.href ? (
            <a
              key={a.id}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...look, textDecoration: "none" }}
            >
              {inner}
            </a>
          ) : (
            <button key={a.id} type="button" onClick={() => onPick(a.id)} style={look}>
              {inner}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- answer -- */

function Answer({
  question, answer, setAnswer, name, setName, last, setLast,
  showName, setShowName, sending, error, onSend,
}: {
  question: string;
  answer: string; setAnswer: (v: string) => void;
  name: string; setName: (v: string) => void;
  last: string; setLast: (v: string) => void;
  showName: boolean | null; setShowName: (v: boolean) => void;
  sending: boolean; error: string | null; onSend: () => void;
}) {
  const ready = answer.trim().length > 0 && showName !== null && !sending;
  // What the wall will actually print, worked out by the same function the
  // wall uses. Shown before they send it, so nobody is surprised by their
  // own name in a lobby.
  const line = shoutOutFrom({ firstName: name, lastName: last, grade: "", showName: showName === true });
  return (
    <>
      <div style={S.qCard}>
        <div style={S.qEyebrow}>On the screen now</div>
        <div style={S.qText}>{question}</div>
      </div>

      <div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={ANSWER_MAX}
          placeholder="Share yours…"
          aria-label="Your answer"
          style={S.textarea}
        />
        <div style={S.counter}>{answer.length}/{ANSWER_MAX}</div>
      </div>

      {/* Side by side where there is room, stacked on a narrow phone. */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name (optional)"
          aria-label="First name, optional"
          autoComplete="given-name"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          maxLength={30}
          style={{ ...S.input, flex: "1 1 150px" }}
        />
        {/* As much or as little as they want: "L", "Levy", or nothing. */}
        <input
          value={last}
          onChange={(e) => setLast(e.target.value)}
          placeholder="Last name or initial"
          aria-label="Last name or initial, optional"
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={30}
          style={{ ...S.input, flex: "1 1 150px" }}
        />
      </div>

      <div>
        <div style={S.choiceLabel}>May we show your name on the screen?</div>
        <div role="radiogroup" aria-label="May we show your name on the screen" style={S.segment}>
          <button
            type="button" role="radio" aria-checked={showName === true}
            onClick={() => setShowName(true)}
            style={{ ...S.seg, ...(showName === true ? S.segOn : null) }}
          >Yes</button>
          <button
            type="button" role="radio" aria-checked={showName === false}
            onClick={() => setShowName(false)}
            style={{ ...S.seg, ...(showName === false ? S.segOn : null) }}
          >No</button>
        </div>
        {showName !== null ? (
          <p style={{ ...S.note, marginTop: "10px" }}>
            {line
              ? <>Under your answer the screen will say <strong>{line.replace(/^— /, "")}</strong>.</>
              : <>Your answer goes up without a name.</>}
          </p>
        ) : null}
      </div>

      <p style={S.note}>Answers are reviewed before appearing on the screen.</p>

      {error ? <p role="alert" style={{ ...S.note, color: C.yellow, fontWeight: 700 }}>{error}</p> : null}

      <button
        type="button"
        onClick={onSend}
        disabled={!ready}
        style={{
          ...S.cta,
          background: C.orange,
          color: C.navy,
          opacity: ready ? 1 : 0.5,
        }}
      >
        {sending ? "Sending…" : "Send to the Screen"}
      </button>
    </>
  );
}

/* ------------------------------------------------------- confirmation -- */

function Thanks({
  title, sub, onHome, shortName,
}: { title: string; sub: string; onHome: () => void; shortName: string }) {
  return (
    <div style={S.thanks}>
      <div style={S.tick} aria-hidden="true">&#10003;</div>
      <h2 style={S.thanksTitle}>{title}</h2>
      <p style={S.thanksSub}>{sub}</p>
      <button type="button" onClick={onHome} style={S.outline}>Back to Start</button>
      <span style={{ display: "none" }}>{shortName}</span>
    </div>
  );
}

/* --------------------------------------------------------------- bones -- */

const S: Record<string, React.CSSProperties> = {
  page: {
    // minHeight and background live in MOBILE, which can say dvh.
    background: C.navy,
    display: "flex",
    justifyContent: "center",
    fontFamily: "Montserrat, system-ui, sans-serif",
  },
  col: {
    width: "100%",
    maxWidth: "440px",
    // Height and padding live in MOBILE, which can read the safe areas.
    minHeight: "inherit",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxSizing: "border-box",
  },
  header: {
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "-4px",
  },
  headerLabel: { color: C.white, fontWeight: 800, fontSize: "15px" },
  back: {
    height: "44px",
    borderRadius: "22px",
    padding: "0 16px 0 12px",
    background: C.veil,
    color: C.white,
    fontWeight: 700,
    fontSize: "15px",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "24px 0",
  },
  heroTitle: {
    color: C.white,
    fontWeight: 800,
    fontSize: "38px",
    lineHeight: 1.1,
    margin: 0,
    textWrap: "pretty" as React.CSSProperties["textWrap"],
  },
  heroSub: { color: C.white, fontWeight: 600, fontSize: "19px", margin: "12px 0 0" },

  door: {
    minHeight: "76px",
    borderRadius: "24px",
    padding: "12px 24px",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    textAlign: "left",
  },

  qCard: { background: C.orange, borderRadius: "28px", padding: "24px" },
  qEyebrow: {
    fontWeight: 800, fontSize: "13px", letterSpacing: ".12em",
    textTransform: "uppercase", color: C.navy,
  },
  qText: { fontWeight: 800, fontSize: "26px", lineHeight: 1.2, color: C.navy, marginTop: "8px" },

  textarea: {
    width: "100%",
    background: C.white,
    borderRadius: "22px",
    padding: "18px",
    minHeight: "150px",
    fontWeight: 600,
    fontSize: "18px",
    color: C.navy,
    border: "none",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  counter: { textAlign: "right", color: C.white, fontWeight: 600, fontSize: "13px", marginTop: "6px" },

  input: {
    height: "56px",
    borderRadius: "18px",
    padding: "0 18px",
    fontWeight: 600,
    fontSize: "17px",
    color: C.navy,
    // White, like the box above it. Without this the field takes the
    // browser's default, which on this navy is a white box nobody can see.
    background: C.white,
    border: "none",
    width: "100%",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  note: { color: C.white, fontWeight: 500, fontSize: "14px", margin: 0 },

  choiceLabel: { color: C.white, fontWeight: 800, fontSize: "15px", marginBottom: "8px" },
  segment: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    background: C.veil,
    borderRadius: "20px",
    padding: "6px",
  },
  seg: {
    height: "48px",
    borderRadius: "15px",
    border: "none",
    background: "transparent",
    color: C.white,
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
  },
  segOn: { background: C.white, color: C.navy },

  cta: {
    marginTop: "auto",
    height: "60px",
    borderRadius: "30px",
    width: "100%",
    border: "none",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: "18px",
    cursor: "pointer",
  },

  thanks: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
  },
  tick: {
    width: "88px", height: "88px", borderRadius: "50%", background: C.orange,
    color: C.navy, fontSize: "44px", fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  thanksTitle: { color: C.white, fontWeight: 800, fontSize: "30px", margin: 0 },
  thanksSub: {
    color: C.white, fontWeight: 500, fontSize: "16px", lineHeight: 1.5,
    maxWidth: "300px", margin: 0,
  },
  outline: {
    height: "56px",
    padding: "0 28px",
    border: `2px solid ${C.white}`,
    borderRadius: "28px",
    background: "transparent",
    color: C.white,
    fontWeight: 800,
    fontSize: "16px",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "8px",
  },
};
