"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideFlyer, decidePhoto, decideShoutOut } from "@/app/actions/school-screen";
import type { ScreenEditorData } from "@/lib/school-screen/editor-data";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";

/**
 * The queue, for whichever of the two people is looking at it.
 *
 * A student ambassador sees what nobody has looked at yet and passes it on.
 * The school sees what a student passed on — with the student's name on it —
 * and puts it up. Same cards, same shape, different verbs, because it is the
 * same job twice and a second layout to learn would be a second thing to get
 * wrong.
 *
 * It is built to be worked through quickly on a phone between lessons: one
 * card at a time, two buttons, both big enough to hit without aiming, and
 * the thing being decided large enough to actually read. Nothing is more
 * than one tap from done, and nothing is one tap from gone — what a student
 * sets aside is still in the school's list, in its own section, because a
 * fast finger should not be able to lose somebody's flyer.
 */

type Mode = "endorse" | "approve";

/** One row in the queue, whatever kind of thing it started as. */
type Item = {
  id: string;
  kind: "flyer" | "photo" | "shout-out";
  title: string;
  detail: string | null;
  imageUrl: string | null;
  quote: string | null;
  by: string | null;
  endorsedBy: string | null;
  status: string;
};

const KIND: Record<Item["kind"], { label: string; icon: string; bg: string; fg: string }> = {
  flyer: { label: "Flyer", icon: "campaign", bg: C.blueTint, fg: C.blue },
  photo: { label: "Photo", icon: "photo_camera", bg: "#E8F4EC", fg: "#1F7A42" },
  "shout-out": { label: "Shout-out", icon: "favorite", bg: C.orangeTint, fg: C.orangeText },
};

const decide = (kind: Item["kind"], id: string, yes: boolean) =>
  kind === "flyer"
    ? decideFlyer(id, yes)
    : kind === "photo"
      ? decidePhoto(id, yes)
      : decideShoutOut(id, yes);

/** Everything in the editor's data, flattened into one list to work through. */
function itemsFrom(data: ScreenEditorData, want: string[]): Item[] {
  const out: Item[] = [];
  for (const f of data.flyers) {
    if (!want.includes(f.status)) continue;
    out.push({
      id: f.id, kind: "flyer", title: f.title,
      detail: [f.line, f.place, f.time].filter(Boolean).join(" · ") || null,
      imageUrl: f.imageUrl, quote: null, by: f.by, endorsedBy: f.endorsedBy, status: f.status,
    });
  }
  for (const p of data.photos) {
    if (!want.includes(p.status)) continue;
    out.push({
      id: p.id, kind: "photo", title: p.caption || "A photo for the screen",
      detail: null, imageUrl: p.imageUrl, quote: null,
      by: p.by, endorsedBy: p.endorsedBy, status: p.status,
    });
  }
  for (const s of data.shoutOuts) {
    if (!want.includes(s.status)) continue;
    const name = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
    out.push({
      id: s.id, kind: "shout-out",
      title: name ? `From ${name}${s.grade ? `, ${s.grade}` : ""}` : "Anonymous",
      detail: s.showName ? "Name may be shown" : "Name to stay off the screen",
      imageUrl: null, quote: s.text, by: name || s.email || null,
      endorsedBy: s.endorsedBy, status: s.status,
    });
  }
  return out;
}

export function ApprovalQueue({ data, mode }: { data: ScreenEditorData; mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAside, setShowAside] = useState(false);
  const [, start] = useTransition();

  // A student looks at what nobody has touched. The school looks at what a
  // student passed on — and at anything still untouched, so a school with
  // no ambassador on duty is never stuck waiting for one.
  const waiting = itemsFrom(data, mode === "endorse" ? ["PENDING"] : ["ENDORSED", "PENDING"]);
  const setAside = mode === "approve" ? itemsFrom(data, ["SET_ASIDE"]) : [];

  function act(item: Item, yes: boolean) {
    setError(null);
    setBusy(item.id);
    start(async () => {
      const res = await decide(item.kind, item.id, yes);
      setBusy(null);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  const yesLabel = mode === "endorse" ? "Pass it on" : "Put it up";
  const noLabel = mode === "endorse" ? "Set aside" : "Not this one";

  return (
    <section aria-labelledby="queue-heading" style={{ marginBottom: "34px" }}>
      <Banner mode={mode} count={waiting.length} />

      {error ? (
        <p role="alert" style={{ ...T.read, color: C.redText, margin: "0 0 14px" }}>{error}</p>
      ) : null}

      {waiting.length === 0 ? (
        <Empty mode={mode} />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "14px" }}>
          {waiting.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Card
                item={item}
                mode={mode}
                busy={busy === item.id}
                yesLabel={yesLabel}
                noLabel={noLabel}
                onYes={() => act(item, true)}
                onNo={() => act(item, false)}
              />
            </li>
          ))}
        </ul>
      )}

      {setAside.length > 0 ? (
        <div style={{ marginTop: "22px" }}>
          {/*
            Not hidden — kept separate. Somebody has to be able to see that
            eleven things went this way this week, and to put any of them
            back, without those eleven being mixed into the real queue.
          */}
          <button
            type="button"
            onClick={() => setShowAside((v) => !v)}
            aria-expanded={showAside}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px", minHeight: HIT,
              background: "none", border: "none", cursor: "pointer", padding: "0 2px",
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.muted,
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "20px" }}>
              {showAside ? "expand_less" : "expand_more"}
            </span>
            Set aside by an ambassador ({setAside.length})
          </button>

          {showAside ? (
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: "12px" }}>
              {setAside.map((item) => (
                <li key={`aside-${item.kind}-${item.id}`}>
                  <Card
                    item={item}
                    mode={mode}
                    busy={busy === item.id}
                    yesLabel="Put it up anyway"
                    noLabel="Agree, leave it"
                    onYes={() => act(item, true)}
                    onNo={() => act(item, false)}
                    dimmed
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------- pieces -- */

function Banner({ mode, count }: { mode: Mode; count: number }) {
  const none = count === 0;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px",
        background: none ? C.panel : mode === "endorse" ? C.blueTint : C.orangeTint,
        borderRadius: R.hero, padding: "16px 18px",
      }}
    >
      <span
        aria-hidden="true"
        className="material-symbols-rounded"
        style={{ fontSize: "30px", color: none ? C.muted : mode === "endorse" ? C.blue : C.orangeText }}
      >
        {none ? "check_circle" : mode === "endorse" ? "waving_hand" : "inventory"}
      </span>
      <div style={{ minWidth: 0 }}>
        <h2 id="queue-heading" style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 800, color: C.ink, margin: 0 }}>
          {none
            ? "Nothing waiting — nice work"
            : `${count} ${count === 1 ? "thing" : "things"} waiting for you`}
        </h2>
        <p style={{ ...T.small, color: C.muted, margin: "2px 0 0" }}>
          {mode === "endorse"
            ? "You get first look. Pass on what should go up; set aside what shouldn’t."
            : "Your ambassadors looked at these first. You decide what goes on the screen."}
        </p>
      </div>
    </div>
  );
}

function Empty({ mode }: { mode: Mode }) {
  return (
    <p style={{ ...T.read, color: C.muted, margin: 0, padding: "4px 2px" }}>
      {mode === "endorse"
        ? "When somebody sends in a flyer, a photo or a shout-out, it turns up here first."
        : "Nothing is waiting for you. Anything your ambassadors pass on will appear here."}
    </p>
  );
}

function Card({
  item, mode, busy, yesLabel, noLabel, onYes, onNo, dimmed,
}: {
  item: Item; mode: Mode; busy: boolean;
  yesLabel: string; noLabel: string;
  onYes: () => void; onNo: () => void; dimmed?: boolean;
}) {
  const k = KIND[item.kind];
  return (
    <article
      style={{
        background: C.white, borderRadius: R.hero, padding: "16px",
        boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
        opacity: dimmed ? 0.82 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: k.bg, color: k.fg, borderRadius: "999px", padding: "5px 11px",
            fontFamily: F.data, fontSize: "11px", fontWeight: 700,
            letterSpacing: ".06em", textTransform: "uppercase",
          }}
        >
          <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "15px" }}>{k.icon}</span>
          {k.label}
        </span>
      </div>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            width={104}
            height={104}
            style={{
              width: "104px", height: "104px", objectFit: "cover",
              borderRadius: "14px", background: C.panel, flex: "0 0 auto",
            }}
          />
        ) : null}

        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          {item.quote ? (
            <blockquote
              style={{
                margin: "0 0 8px", fontFamily: F.read, fontSize: "18px", lineHeight: 1.45,
                color: C.ink, fontStyle: "italic",
              }}
            >
              “{item.quote}”
            </blockquote>
          ) : null}

          <h3 style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.3 }}>
            {item.title}
          </h3>
          {item.detail ? (
            <p style={{ ...T.small, color: C.muted, margin: "3px 0 0" }}>{item.detail}</p>
          ) : null}

          {/*
            The two names the school asked to see. The endorser's line only
            appears once somebody has endorsed it, so an item an
            administrator is approving straight through does not claim a
            student looked at it when none did.
          */}
          <dl style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", margin: "10px 0 0" }}>
            <Who label="Sent in by" name={item.by} />
            {item.endorsedBy ? <Who label="Passed on by" name={item.endorsedBy} /> : null}
            {mode === "approve" && !item.endorsedBy && item.status === "PENDING" ? (
              <Who label="Passed on by" name={null} note="nobody yet — you’re first" />
            ) : null}
          </dl>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
        <Action tone="yes" onClick={onYes} disabled={busy}>{busy ? "…" : yesLabel}</Action>
        <Action tone="no" onClick={onNo} disabled={busy}>{noLabel}</Action>
      </div>
    </article>
  );
}

function Who({ label, name, note }: { label: string; name: string | null; note?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <dt style={{ ...T.meta, color: C.muted, fontSize: "10.5px", margin: 0 }}>{label.toUpperCase()}</dt>
      <dd
        style={{
          fontFamily: F.ui, fontSize: "14px", fontWeight: 700,
          color: name ? C.ink : C.muted, margin: "1px 0 0",
        }}
      >
        {name ?? note ?? "Unknown"}
      </dd>
    </div>
  );
}

function Action({
  tone, onClick, disabled, children,
}: {
  tone: "yes" | "no"; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  const yes = tone === "yes";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
        minHeight: HIT, padding: "11px 20px", borderRadius: R.button, cursor: disabled ? "default" : "pointer",
        fontFamily: F.ui, fontSize: "15.5px", fontWeight: 700,
        background: yes ? C.blue : C.white,
        color: yes ? C.white : C.ink,
        border: yes ? "2px solid transparent" : `2px solid ${C.hairline}`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "19px" }}>
        {yes ? "check" : "close"}
      </span>
      {children}
    </button>
  );
}
