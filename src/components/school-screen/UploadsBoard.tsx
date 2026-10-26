"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, R, T, HIT, BP, CONTENT_MAX } from "@/lib/joc-tokens";
import {
  decideFlyer, decidePhoto, decideShoutOut, deleteFlyer, deletePhoto,
} from "@/app/actions/school-screen";
import type { ScreenEditorData, EditorFlyer } from "@/lib/school-screen/editor-data";
import {
  myUploads, needsYou, queueKey, setAsideItems, uploadProgress,
  type QueueItem, type QueueMode,
} from "@/lib/school-screen/queue";
import { PageHeader } from "@/components/ui/PageHeader";
import { useMedia } from "@/components/ui/useMedia";
import { FlyerForm } from "./FlyerForm";
import { FlyerPreview } from "./FlyerPreview";
import { PhotoUpload } from "./PhotoUpload";
import { StatusChip } from "./ui";

/**
 * Everything waiting on one person, in one place.
 *
 * The queue used to sit at the top of the Live Screen editor, above the
 * slideshow and the settings, so looking after the wall and deciding what
 * goes on it were the same page — and the deciding, which is the part with
 * a clock on it, scrolled away under the part without one.
 *
 * Two shapes, because there are two ways this gets done. At a desk it is a
 * list: tick six, approve six, go. On a phone between lessons it is one
 * card at a time with two buttons big enough to hit without aiming. The
 * phone gets the second whatever the toggle says, because the first does
 * not fit and a cramped list is worse than no list.
 *
 * Nothing in here decides anything. Every yes and no goes through the same
 * server actions as before, which check the role again and know which of
 * the two stages this person is standing at.
 */

/** White, hairline, 16px, no shadow. Ink is for the TV and nothing else. */
const card: React.CSSProperties = {
  background: C.white,
  border: `1px solid ${C.hairline}`,
  borderRadius: R.row,
};

const KIND: Record<QueueItem["kind"], { label: string; icon: string; bg: string; fg: string }> = {
  flyer: { label: "Flyer", icon: "campaign", bg: C.blueTint, fg: C.blue },
  photo: { label: "Photo", icon: "photo_camera", bg: C.greenTint, fg: C.greenText },
  "shout-out": { label: "Shout-out", icon: "favorite", bg: C.orangeTint, fg: C.orangeText },
};

const decide = (kind: QueueItem["kind"], id: string, yes: boolean) =>
  kind === "flyer"
    ? decideFlyer(id, yes)
    : kind === "photo"
      ? decidePhoto(id, yes)
      : decideShoutOut(id, yes);

type Tab = "waiting" | "aside" | "mine";

/** What happened, and the one thing a person might want to do about it. */
type Toast = { text: string; undo?: { label: string; items: QueueItem[]; yes: boolean } };

export function UploadsBoard({
  data, mode, short, onApproved,
}: {
  data: ScreenEditorData;
  mode: QueueMode;
  /** The school's short name, for drawing a flyer as the TV draws it. */
  short: string;
  /** Said when a teacher's yes has just put something in a hallway. */
  onApproved?: (items: QueueItem[]) => void;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const wide = useMedia(`(min-width: ${BP.cards}px)`);

  const [tab, setTab] = useState<Tab>("waiting");
  const [view, setView] = useState<"list" | "one">("list");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [at, setAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [adding, setAdding] = useState<"flyer" | "photo" | null>(null);
  // Changing one of your own, while it is still waiting. The editor used to
  // offer this on the slideshow; the slideshow is what is on the wall now,
  // so it belongs beside the thing it is about.
  const [editing, setEditing] = useState<EditorFlyer | null>(null);

  const teacher = mode === "approve";
  const waiting = useMemo(() => needsYou(data, mode), [data, mode]);
  const aside = useMemo(() => (teacher ? setAsideItems(data) : []), [data, teacher]);
  const mine = useMemo(() => (teacher ? [] : myUploads(data)), [data, teacher]);

  // A phone has no room for a list of rows with a checkbox and two buttons
  // on each, so the toggle is a desk thing and the phone is always cards.
  const oneAtATime = !wide || view === "one";

  const yesLabel = teacher ? "Put it up" : "Pass it on";
  const noLabel = teacher ? "Not this one" : "Set aside";

  function run(items: QueueItem[], yes: boolean, said: string, undoLabel: string) {
    if (items.length === 0) return;
    setError(null);
    setBusy(true);
    start(async () => {
      let failed: string | null = null;
      const done: QueueItem[] = [];
      // One at a time rather than all at once: these are three different
      // tables and a school approving forty things should not open forty
      // connections to do it.
      for (const item of items) {
        const res = await decide(item.kind, item.id, yes);
        if (!res.ok) { failed = res.error; break; }
        done.push(item);
      }
      setBusy(false);
      setPicked(new Set());
      setAt(0);
      if (failed) setError(failed);
      if (done.length > 0) {
        setToast({
          text: `${said} · ${done.length === 1 ? done[0].title : `${done.length} things`}`,
          undo: { label: undoLabel, items: done, yes: !yes },
        });
        if (yes && teacher) onApproved?.(done);
      }
      router.refresh();
    });
  }

  /** Take back something of your own that nobody has decided on yet. */
  function remove(item: QueueItem) {
    if (!confirm(`Take “${item.title}” back? It will not go to anybody.`)) return;
    setError(null);
    setBusy(true);
    start(async () => {
      const res = item.kind === "photo" ? await deletePhoto(item.id) : await deleteFlyer(item.id);
      setBusy(false);
      if (!res.ok) { setError(res.error); return; }
      setToast({ text: `Taken back · ${item.title}` });
      router.refresh();
    });
  }

  const items = tab === "waiting" ? waiting : tab === "aside" ? aside : mine;
  const shown = oneAtATime ? items.slice(at, at + 1) : items;

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title="Uploads & approvals"
        sub={teacher
          ? "What your ambassadors passed on, and anything nobody has reached yet. Your yes is what puts it in the hallway."
          : "You get first look. Pass on what should go up, and send in your own."}
        actions={
          <button
            type="button"
            onClick={() => { setEditing(null); setAdding((a) => (a ? null : "flyer")); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px", minHeight: HIT,
              padding: "0 18px", borderRadius: R.button, border: 0, cursor: "pointer",
              background: C.blue, color: C.white,
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "20px" }}>
              {adding ? "close" : "add"}
            </span>
            {adding ? "Close" : "Upload"}
          </button>
        }
      />

      {editing ? (
        <div style={{ ...card, padding: "18px", marginBottom: "22px" }}>
          <FlyerForm
            key={editing.id}
            schoolId={editing.schoolId}
            short={short}
            flyer={editing}
            approves={teacher}
            onDone={() => { setEditing(null); router.refresh(); }}
          />
        </div>
      ) : null}

      {adding && !editing ? (
        <div style={{ ...card, padding: "18px", marginBottom: "22px" }}>
          <div role="tablist" aria-label="What to upload" style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["flyer", "photo"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={adding === k}
                onClick={() => setAdding(k)}
                style={{
                  minHeight: HIT, padding: "0 16px", borderRadius: R.chip, cursor: "pointer",
                  border: `1px solid ${adding === k ? C.ink : C.hairline}`,
                  background: adding === k ? C.ink : C.white,
                  color: adding === k ? C.white : C.ink,
                  fontFamily: F.ui, fontSize: "14.5px", fontWeight: 700,
                }}
              >
                {k === "flyer" ? "A flyer" : "A photo"}
              </button>
            ))}
          </div>

          {adding === "flyer" ? (
            <FlyerForm
              schoolId={data.school.id}
              short={short}
              approves={teacher}
              onDone={() => { setAdding(null); router.refresh(); }}
            />
          ) : (
            <PhotoUpload
              schoolId={data.school.id}
              approves={teacher}
              onDone={() => { setAdding(null); router.refresh(); }}
            />
          )}
        </div>
      ) : null}

      {/* ---- tabs ---- */}
      <div
        style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          gap: "12px", flexWrap: "wrap", borderBottom: `1px solid ${C.hairline}`, marginBottom: "18px",
        }}
      >
        <div role="tablist" aria-label="Uploads" style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
          <Tab on={tab === "waiting"} onClick={() => { setTab("waiting"); setAt(0); }} count={waiting.length}>
            Waiting for you
          </Tab>
          {teacher ? (
            <Tab on={tab === "aside"} onClick={() => { setTab("aside"); setAt(0); }} count={aside.length}>
              Set aside
            </Tab>
          ) : (
            <Tab on={tab === "mine"} onClick={() => { setTab("mine"); setAt(0); }} count={mine.length}>
              Your uploads
            </Tab>
          )}
        </div>

        {/* The toggle is a desk thing: a phone has no list to switch to. */}
        {wide && tab !== "mine" ? (
          <div style={{ display: "flex", gap: "2px", padding: "0 0 8px" }}>
            {(["list", "one"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => { setView(v); setAt(0); setPicked(new Set()); }}
                style={{
                  minHeight: HIT, padding: "0 14px", borderRadius: R.sm, cursor: "pointer", border: 0,
                  background: view === v ? C.panel : "transparent",
                  color: view === v ? C.ink : C.muted,
                  fontFamily: F.ui, fontSize: "14px", fontWeight: 700,
                }}
              >
                {v === "list" ? "List" : "One by one"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" style={{ ...T.read, color: C.redText, margin: "0 0 14px" }}>{error}</p>
      ) : null}

      {/* ---- the work ---- */}
      {items.length === 0 ? (
        <Empty tab={tab} mode={mode} />
      ) : tab === "mine" ? (
        <MyUploads
          items={mine}
          short={short}
          busy={busy}
          onEdit={(f) => { setAdding(null); setEditing(f); }}
          onRemove={remove}
        />
      ) : oneAtATime ? (
        <OneByOne
          item={shown[0]}
          index={at}
          total={items.length}
          short={short}
          teacher={teacher}
          busy={busy}
          yesLabel={tab === "aside" ? "Put it up anyway" : yesLabel}
          noLabel={tab === "aside" ? "Agree, leave it" : noLabel}
          onYes={() => run([shown[0]], true, teacher ? "Put up" : "Passed on", teacher ? "Take it down" : "Set it aside")}
          onNo={() => run([shown[0]], false, teacher ? "Not put up" : "Set aside", teacher ? "Put it up after all" : "Pass it on after all")}
          onSkip={() => setAt((i) => Math.min(i + 1, items.length - 1))}
          canSkip={at < items.length - 1}
        />
      ) : (
        <>
          {picked.size > 0 ? (
            <BulkBar
              n={picked.size}
              busy={busy}
              yesLabel={tab === "aside" ? "Put them up anyway" : yesLabel}
              noLabel={tab === "aside" ? "Agree, leave them" : noLabel}
              onClear={() => setPicked(new Set())}
              onYes={() => run(items.filter((i) => picked.has(queueKey(i))), true, teacher ? "Put up" : "Passed on", teacher ? "Take them down" : "Set them aside")}
              onNo={() => run(items.filter((i) => picked.has(queueKey(i))), false, teacher ? "Not put up" : "Set aside", teacher ? "Put them up after all" : "Pass them on after all")}
            />
          ) : null}

          <ul style={{ ...card, listStyle: "none", margin: 0, padding: 0, overflow: "hidden" }}>
            {items.map((item, i) => (
              <li key={queueKey(item)} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.rule}` }}>
                <ListRow
                  item={item}
                  short={short}
                  teacher={teacher}
                  busy={busy}
                  checked={picked.has(queueKey(item))}
                  onCheck={(on) => setPicked((s) => {
                    const next = new Set(s);
                    if (on) next.add(queueKey(item)); else next.delete(queueKey(item));
                    return next;
                  })}
                  yesLabel={tab === "aside" ? "Put it up anyway" : yesLabel}
                  noLabel={tab === "aside" ? "Agree, leave it" : noLabel}
                  onYes={() => run([item], true, teacher ? "Put up" : "Passed on", teacher ? "Take it down" : "Set it aside")}
                  onNo={() => run([item], false, teacher ? "Not put up" : "Set aside", teacher ? "Put it up after all" : "Pass it on after all")}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {toast ? (
        <ToastPill
          toast={toast}
          busy={busy}
          onClose={() => setToast(null)}
          onUndo={() => {
            const u = toast.undo;
            setToast(null);
            if (u) run(u.items, u.yes, u.yes ? "Put up" : "Taken down", u.yes ? "Take it down" : "Put it up after all");
          }}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- tabs -- */

function Tab({ on, count, onClick, children }: {
  on: boolean; count: number; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        minHeight: HIT, padding: "0 14px", marginBottom: "-1px",
        background: "none", border: "none", cursor: "pointer",
        borderBottom: `3px solid ${on ? C.blue : "transparent"}`,
        color: on ? C.ink : C.muted,
        fontFamily: F.ui, fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap",
      }}
    >
      {children}
      {count > 0 ? (
        <span style={{
          ...T.meta, color: on ? C.blue : C.muted, background: on ? C.blueTint : C.panel,
          borderRadius: R.chip, padding: "2px 8px", fontWeight: 700,
        }}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* --------------------------------------------------------------- list -- */

function Thumb({ item, short, size = 52 }: { item: QueueItem; short: string; size?: number }) {
  if (item.flyer) {
    return (
      <div style={{ flex: "none", borderRadius: R.sm, overflow: "hidden" }}>
        <FlyerPreview width={size} short={short} flyer={{ ...item.flyer, hasQr: Boolean(item.flyer.qrUrl) }} />
      </div>
    );
  }
  if (item.imageUrl) {
    return (
      <Image
        src={item.imageUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: R.sm, background: C.panel, flex: "none" }}
      />
    );
  }
  const k = KIND[item.kind];
  return (
    <span
      aria-hidden="true"
      className="material-symbols-rounded"
      style={{
        width: size, height: size, flex: "none", borderRadius: R.sm,
        background: k.bg, color: k.fg,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45,
      }}
    >
      {k.icon}
    </span>
  );
}

/**
 * Who sent it and who has looked at it, in one line.
 *
 * A teacher looking at something nobody has endorsed is told so plainly —
 * the card must never imply a student checked it when none did.
 */
function credit(item: QueueItem, teacher: boolean): string {
  const parts = [KIND[item.kind].label];
  parts.push(`Sent in by ${item.by ?? "somebody"}`);
  if (item.endorsedBy) parts.push(`Passed on by ${item.endorsedBy}`);
  else if (teacher && item.status === "PENDING") parts.push("Passed on by nobody yet — you’re first");
  return parts.join(" · ");
}

function ListRow({
  item, short, teacher, busy, checked, onCheck, yesLabel, noLabel, onYes, onNo,
}: {
  item: QueueItem; short: string; teacher: boolean; busy: boolean;
  checked: boolean; onCheck: (on: boolean) => void;
  yesLabel: string; noLabel: string; onYes: () => void; onNo: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", padding: "12px 16px" }}>
      {/* A 20px box with a 44px reach around it. The name is on the input
          itself rather than in a hidden span beside it, which left the
          checkbox nameless and the span announced on its own. */}
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: HIT, height: HIT, flex: "none", margin: "0 -10px",
      }}>
        <input
          type="checkbox"
          aria-label={`Choose ${item.title}`}
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
        />
      </span>

      <Thumb item={item} short={short} />

      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        {item.quote ? (
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.45, color: C.ink, margin: "0 0 3px" }}>
            “{item.quote}”
          </p>
        ) : (
          <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.3 }}>
            {item.title}
          </p>
        )}
        <p style={{ ...T.meta, margin: "3px 0 0" }}>{credit(item, teacher)}</p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Small onClick={onNo} disabled={busy}>{noLabel}</Small>
        <Small onClick={onYes} disabled={busy} primary={teacher ? "orange" : "blue"}>{yesLabel}</Small>
      </div>
    </div>
  );
}

function Small({ children, onClick, disabled, primary }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: "orange" | "blue";
}) {
  // Orange with ink text for the school, blue for a student: the two yeses
  // mean different things and should not look like the same button.
  const look = primary === "orange"
    ? { background: C.orange, color: C.ink, border: "1px solid transparent" }
    : primary === "blue"
      ? { background: C.blue, color: C.white, border: "1px solid transparent" }
      : { background: C.white, color: C.ink, border: `1px solid ${C.outline}` };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...look, minHeight: HIT, padding: "0 14px", borderRadius: R.button,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
        fontFamily: F.ui, fontSize: "14.5px", fontWeight: 700, whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function BulkBar({ n, busy, yesLabel, noLabel, onClear, onYes, onNo }: {
  n: number; busy: boolean; yesLabel: string; noLabel: string;
  onClear: () => void; onYes: () => void; onNo: () => void;
}) {
  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
        background: C.blueTint, borderRadius: R.row, padding: "10px 16px", marginBottom: "12px",
      }}
    >
      <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.blue }}>
        {n} selected
      </span>
      <button
        type="button"
        onClick={onClear}
        style={{
          minHeight: HIT, background: "none", border: "none", cursor: "pointer", padding: "0 4px",
          fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.muted,
        }}
      >
        Clear
      </button>
      <span style={{ flex: 1 }} />
      <Small onClick={onNo} disabled={busy}>{noLabel}</Small>
      <Small onClick={onYes} disabled={busy} primary="orange">{busy ? "Working…" : yesLabel}</Small>
    </div>
  );
}

/* ---------------------------------------------------------- one by one -- */

function OneByOne({
  item, index, total, short, teacher, busy, yesLabel, noLabel, onYes, onNo, onSkip, canSkip,
}: {
  item: QueueItem; index: number; total: number; short: string; teacher: boolean; busy: boolean;
  yesLabel: string; noLabel: string; onYes: () => void; onNo: () => void;
  onSkip: () => void; canSkip: boolean;
}) {
  const k = KIND[item.kind];
  return (
    <div style={{ position: "relative", maxWidth: "520px" }}>
      {/* The stack behind it: how many more there are, without a number. */}
      {total > 1 ? (
        <>
          <div style={{ ...card, position: "absolute", inset: "0 0 auto", height: "40px", transform: "translateY(-10px) scale(0.96)", zIndex: 0 }} />
          {total > 2 ? (
            <div style={{ ...card, position: "absolute", inset: "0 0 auto", height: "40px", transform: "translateY(-19px) scale(0.92)", zIndex: 0 }} />
          ) : null}
        </>
      ) : null}

      <article style={{ ...card, position: "relative", zIndex: 1, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: k.bg, color: k.fg, borderRadius: R.chip, padding: "5px 11px",
            fontFamily: F.data, fontSize: "11px", fontWeight: 700,
            letterSpacing: ".06em", textTransform: "uppercase",
          }}>
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "15px" }}>{k.icon}</span>
            {k.label}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ ...T.meta }}>{index + 1} OF {total}</span>
        </div>

        {/* Ink is the television. Nothing else in the portal wears it, which
            is how somebody learns what dark navy means here. */}
        {item.flyer ? (
          <div style={{ background: C.ink, borderRadius: R.row, padding: "14px", display: "flex", justifyContent: "center", marginBottom: "14px" }}>
            <FlyerPreview width={300} short={short} flyer={{ ...item.flyer, hasQr: Boolean(item.flyer.qrUrl) }} />
          </div>
        ) : item.imageUrl ? (
          <div style={{ background: C.ink, borderRadius: R.row, padding: "14px", marginBottom: "14px" }}>
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={600}
              height={450}
              style={{ width: "100%", height: "auto", borderRadius: R.form, display: "block" }}
            />
          </div>
        ) : null}

        {item.quote ? (
          <>
            <blockquote style={{
              margin: "0 0 10px", fontFamily: F.read, fontSize: "19px", lineHeight: 1.5, color: C.ink,
            }}>
              “{item.quote}”
            </blockquote>
            {item.onScreen ? (
              <p style={{ ...T.small, color: C.muted, margin: "0 0 10px" }}>
                On the screen it will say <span style={{ color: C.ink }}>{item.onScreen}</span>
              </p>
            ) : null}
          </>
        ) : (
          <h2 style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, color: C.ink, margin: "0 0 4px", lineHeight: 1.25 }}>
            {item.title}
          </h2>
        )}

        {item.detail ? <p style={{ ...T.small, color: C.muted, margin: "0 0 10px" }}>{item.detail}</p> : null}
        <p style={{ ...T.meta, margin: "0 0 16px" }}>{credit(item, teacher)}</p>

        <div style={{ display: "flex", gap: "12px" }}>
          <Big tone="no" onClick={onNo} disabled={busy}>{noLabel}</Big>
          <Big tone={teacher ? "yesTeacher" : "yesAmbassador"} onClick={onYes} disabled={busy}>{yesLabel}</Big>
        </div>

        {canSkip ? (
          <button
            type="button"
            onClick={onSkip}
            style={{
              display: "block", width: "100%", minHeight: HIT, marginTop: "6px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.muted,
            }}
          >
            Decide later — show me the next one
          </button>
        ) : null}
      </article>
    </div>
  );
}

function Big({ tone, onClick, disabled, children }: {
  tone: "no" | "yesTeacher" | "yesAmbassador"; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  const look = tone === "no"
    ? { background: C.white, color: C.ink, border: `2px solid ${C.outline}` }
    : tone === "yesTeacher"
      ? { background: C.orange, color: C.ink, border: "2px solid transparent" }
      : { background: C.blue, color: C.white, border: "2px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...look, flex: 1, minHeight: "60px", borderRadius: R.button,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
        fontFamily: F.ui, fontSize: "16px", fontWeight: 700,
      }}
    >
      <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "21px" }}>
        {tone === "no" ? "close" : "check"}
      </span>
      {children}
    </button>
  );
}

/* ------------------------------------------------------ your uploads -- */

function MyUploads({ items, short, busy, onEdit, onRemove }: {
  items: QueueItem[]; short: string; busy: boolean;
  onEdit: (f: EditorFlyer) => void;
  onRemove: (item: QueueItem) => void;
}) {
  return (
    <ul style={{ ...card, listStyle: "none", margin: 0, padding: 0, overflow: "hidden" }}>
      {items.map((item, i) => {
        const step = uploadProgress(item.status);
        return (
          <li key={queueKey(item)} style={{
            display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
            padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.rule}`,
          }}>
            <Thumb item={item} short={short} />
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0 }}>
                {item.title}
              </p>
              <p style={{ ...T.small, color: step.stopped ? C.muted : C.ink, margin: "3px 0 7px" }}>
                {step.label}
              </p>
              {/* Sent in → passed on → on the screen. Three pips answer
                  "has anything happened to it?" the way a word does not. */}
              <div aria-hidden="true" style={{ display: "flex", gap: "4px", maxWidth: "220px" }}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    style={{
                      flex: 1, height: "4px", borderRadius: "999px",
                      background: step.stopped
                        ? (n <= step.done ? C.muted : C.rule)
                        : n <= step.done
                          ? (step.done === 3 ? C.orange : C.blue)
                          : C.rule,
                    }}
                  />
                ))}
              </div>
            </div>
            <StatusChip status={item.status} />

            {/* Yours, and nobody has decided on it yet: still yours to
                change or take back. Once a teacher has put it up, changing
                it would put words on a wall nobody approved — the server
                refuses that, and so does this. */}
            {item.status === "PENDING" ? (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {item.flyer ? (
                  <Small onClick={() => onEdit(item.flyer as EditorFlyer)} disabled={busy}>Edit</Small>
                ) : null}
                <Small onClick={() => onRemove(item)} disabled={busy}>Take it back</Small>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------- rest -- */

function Empty({ tab, mode }: { tab: Tab; mode: QueueMode }) {
  const [title, line] =
    tab === "aside"
      ? ["Nothing has been set aside", "When an ambassador says no to something, it waits here for you rather than disappearing."]
      : tab === "mine"
        ? ["You haven’t sent anything in yet", "Use Upload to put a flyer or a photo of your program on the hallway screen."]
        : mode === "endorse"
          ? ["Nothing waiting — nice work", "When somebody sends in a flyer, a photo or a shout-out, it turns up here first."]
          : ["Nothing waiting — nice work", "Anything your ambassadors pass on will appear here."];

  return (
    <div style={{ ...card, padding: "40px 24px", textAlign: "center" }}>
      <span
        aria-hidden="true"
        className="material-symbols-rounded"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "56px", height: "56px", borderRadius: R.row,
          background: C.greenTint, color: C.greenText, fontSize: "30px", marginBottom: "12px",
        }}
      >
        check
      </span>
      <h2 style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>{title}</h2>
      <p style={{ ...T.read, color: C.muted, margin: "0 auto", maxWidth: "46ch" }}>{line}</p>
    </div>
  );
}

/**
 * What just happened, and the one way back from it.
 *
 * Not called Undo, because it is not one. The decide actions take a yes or
 * a no, so the only thing this can do is say the opposite — a teacher's
 * "Take it down" rejects it rather than returning it to the queue, and a
 * student's would set aside something that had only been waiting. Labelling
 * that Undo would promise a state these actions cannot reach.
 */
function ToastPill({ toast, busy, onClose, onUndo }: {
  toast: Toast; busy: boolean; onClose: () => void; onUndo: () => void;
}) {
  return (
    <div
      role="status"
      style={{
        position: "fixed", left: "50%", bottom: "22px", transform: "translateX(-50%)",
        zIndex: 60, maxWidth: "min(540px, calc(100vw - 32px))",
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
        background: C.ink, color: C.white, borderRadius: R.chip, padding: "8px 10px 8px 18px",
        boxShadow: "0 10px 30px rgba(16,35,63,.28)",
      }}
    >
      <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600 }}>{toast.text}</span>
      {toast.undo ? (
        <button
          type="button"
          onClick={onUndo}
          disabled={busy}
          style={{
            minHeight: HIT, padding: "0 14px", borderRadius: R.chip, border: 0, cursor: "pointer",
            background: C.white, color: C.ink,
            fontFamily: F.ui, fontSize: "14.5px", fontWeight: 700,
          }}
        >
          {toast.undo.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          minHeight: HIT, minWidth: HIT, background: "none", border: 0, cursor: "pointer", color: C.onDarkBody,
        }}
      >
        <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "20px" }}>close</span>
      </button>
    </div>
  );
}

export type { EditorFlyer };
