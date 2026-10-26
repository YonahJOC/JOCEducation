"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { C, F, R, HIT } from "@/lib/joc-tokens";
import { TV_POLL_MINUTES } from "@/lib/school-screen/slideshow";
import type { QueueItem } from "@/lib/school-screen/queue";
import { useMedia } from "@/components/ui/useMedia";
import { FlyerPreview } from "./FlyerPreview";

/**
 * The moment a teacher's yes puts something in a corridor.
 *
 * Approving used to be a row quietly leaving a list, which is the same
 * feedback as deleting it. But this is the one thing the whole portal is
 * for: a flyer a student made is now on a wall that four hundred people
 * walk past. It is worth a second of somebody's day.
 *
 * Ink, like the television, because that is what ink means here. And a
 * real number rather than "now" — the screens ask the server on a timer,
 * so a flyer approved this second is in the corridor within five minutes,
 * not this second. See TV_POLL_MINUTES.
 */

const CONFETTI = [C.orange, "#FFD8AE", C.blueTint, "#7D93E8", C.green];

export function WentLive({
  items, more, short, schoolName, screenUrl, remaining, onNext, onClose,
}: {
  /** What went up. The first is the one shown. */
  items: QueueItem[];
  /** How many more went up with it, in a bulk approval. */
  more: number;
  short: string;
  schoolName: string;
  screenUrl: string;
  /** Still waiting after this one. */
  remaining: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const first = useRef<HTMLButtonElement>(null);
  const item = items[0];

  // Somebody arriving here by keyboard lands on the way out, not in the
  // middle of a sentence.
  useEffect(() => { first.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bits = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      left: (i * 37 + 11) % 100,
      delay: ((i * 13) % 20) / 10,
      spin: i % 2 === 0 ? 1 : -1,
      color: CONFETTI[i % CONFETTI.length],
      size: 7 + (i % 4) * 2,
    })),
    [],
  );

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="It's on the screen"
      style={{
        position: "fixed", inset: 0, zIndex: 80, background: C.ink,
        overflowY: "auto", padding: "28px 20px 40px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}
    >
      {/* Keyframes have to be a stylesheet; there is nowhere else to put
          them. Nothing is drawn at all when the reader has asked for less
          movement, rather than drawn and held still. */}
      {!still ? (
        <style>{`
@keyframes joc-fall {
  0%   { transform: translateY(-14vh) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(104vh) rotate(var(--joc-spin)); opacity: 0; }
}
@keyframes joc-rise {
  from { transform: translateY(14px); opacity: 0; }
  to   { transform: none; opacity: 1; }
}`}</style>
      ) : null}

      {!still ? (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {bits.map((b, i) => (
            <span
              key={i}
              style={{
                position: "absolute", top: 0, left: `${b.left}%`,
                width: b.size, height: b.size * 1.6, background: b.color, borderRadius: "2px",
                ["--joc-spin" as string]: `${b.spin * 900}deg`,
                animation: `joc-fall ${3.4 + (i % 5) * 0.4}s linear ${b.delay}s 1 both`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div
        style={{
          position: "relative", width: "100%", maxWidth: "560px", textAlign: "center",
          animation: still ? undefined : "joc-rise .45s ease-out both",
        }}
      >
        <p style={{
          fontFamily: F.data, fontSize: "11px", fontWeight: 600, letterSpacing: ".16em",
          color: C.onDarkLabel, margin: "0 0 18px", textTransform: "uppercase",
        }}>
          Live now · Main hallway
        </p>

        <div style={{
          display: "inline-flex", justifyContent: "center", padding: "10px",
          border: `3px solid rgba(255,255,255,.18)`, borderRadius: "22px", marginBottom: "22px",
          maxWidth: "100%",
        }}>
          <Shown item={item} short={short} />
        </div>

        <h2 style={{
          fontFamily: F.ui, fontWeight: 700, color: C.white, margin: "0 0 10px",
          fontSize: "clamp(32px, 9vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em",
        }}>
          It&rsquo;s on the screen.
        </h2>

        <p style={{
          fontFamily: F.ui, fontSize: "16.5px", lineHeight: 1.5, color: C.onDarkBody,
          margin: "0 auto 6px", maxWidth: "42ch",
        }}>
          Everyone who walks down {schoolName}&rsquo;s main hallway will see it in the
          next {TV_POLL_MINUTES} minutes.
        </p>

        {more > 0 ? (
          <p style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.white, margin: "0 0 4px" }}>
            And {more} more went up with it.
          </p>
        ) : null}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", margin: "18px 0 26px" }}>
          {item.by ? <Credit>Sent in by {item.by}</Credit> : null}
          {item.endorsedBy ? <Credit>Passed on by {item.endorsedBy}</Credit> : null}
          <Credit>Put up by you</Credit>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            ref={first}
            type="button"
            onClick={remaining > 0 ? onNext : onClose}
            style={{
              minHeight: "54px", padding: "0 24px", borderRadius: R.button, border: 0, cursor: "pointer",
              background: C.orange, color: C.ink,
              fontFamily: F.ui, fontSize: "16px", fontWeight: 700,
            }}
          >
            {remaining > 0 ? `Next one · ${remaining} left` : "Back to the screen"}
          </button>
          <a
            href={screenUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              minHeight: "54px", padding: "0 20px", borderRadius: R.button, textDecoration: "none",
              background: "transparent", color: C.white, border: "2px solid rgba(255,255,255,.3)",
              fontFamily: F.ui, fontSize: "16px", fontWeight: 700,
            }}
          >
            See the screen
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "19px" }}>open_in_new</span>
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: "block", margin: "14px auto 0", minHeight: HIT,
            background: "none", border: 0, cursor: "pointer",
            fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.onDarkBody,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Credit({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", borderRadius: R.chip,
      background: "rgba(255,255,255,.12)", color: C.white, padding: "6px 13px",
      fontFamily: F.ui, fontSize: "13.5px", fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

/** The thing itself, drawn the way the corridor will draw it. */
function Shown({ item, short }: { item: QueueItem; short: string }) {
  if (item.flyer) {
    return <FlyerPreview width={260} short={short} flyer={{ ...item.flyer, hasQr: Boolean(item.flyer.qrUrl) }} />;
  }
  if (item.imageUrl) {
    return (
      <Image
        src={item.imageUrl}
        alt={item.title}
        width={520}
        height={390}
        style={{ width: "100%", maxWidth: "340px", height: "auto", borderRadius: R.form, display: "block" }}
      />
    );
  }
  return (
    <div style={{ maxWidth: "340px", padding: "10px 6px" }}>
      <blockquote style={{
        margin: "0 0 8px", fontFamily: F.read, fontSize: "20px", lineHeight: 1.45, color: C.white,
      }}>
        “{item.quote}”
      </blockquote>
      {item.onScreen ? (
        <p style={{ fontFamily: F.data, fontSize: "11px", letterSpacing: ".1em", color: C.onDarkLabel, margin: 0, textTransform: "uppercase" }}>
          {item.onScreen.replace(/^— /, "")}
        </p>
      ) : null}
    </div>
  );
}
