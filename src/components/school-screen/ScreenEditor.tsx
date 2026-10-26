"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, R, T, HIT, BP, CONTENT_MAX } from "@/lib/joc-tokens";
import {
  decideShoutOut, deleteDedication, deleteFlyer, deletePhoto, moveFlyer,
  saveScreenSettings, setDedication,
} from "@/app/actions/school-screen";
import type { ScreenEditorData, EditorFlyer } from "@/lib/school-screen/editor-data";
import { dayKey, shortName, shoutOutFrom } from "@/lib/school-screen/rules";
import { SLIDE_SECONDS, slideState, type SlideState } from "@/lib/school-screen/slideshow";
import { PageHeader } from "@/components/ui/PageHeader";
import { useMedia } from "@/components/ui/useMedia";
import { FlyerForm } from "./FlyerForm";
import { FlyerPreview } from "./FlyerPreview";
import { PhotoUpload } from "./PhotoUpload";
import { Btn, Field, Note, StatusChip, input } from "./ui";

/**
 * One school's screen, to look after.
 *
 * Five things live on a hallway TV — the slideshow, the photos, the
 * shout-outs, today's dedication and the handful of settings behind them —
 * and they used to be five sections stacked down one page, with the
 * approval queue on top of the lot. So the job with a clock on it scrolled
 * away under the job without one, and a teacher who came to change the
 * dedication scrolled past everything else to do it.
 *
 * Tabs, now, and the queue has its own page. An ambassador sees the first
 * two and may not change them: what they add goes through Uploads, where
 * the two stages are, and the server would refuse anything else whatever
 * this file drew.
 */

export type Tab = "slideshow" | "photos" | "shouts" | "dedication" | "settings";

const TABS: Tab[] = ["slideshow", "photos", "shouts", "dedication", "settings"];

/** The ?tab= a link may carry, and nothing else. */
export function screenTabFromQuery(v: string | string[] | undefined): Tab | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return TABS.includes(s as Tab) ? (s as Tab) : undefined;
}

/** White, hairline, 16px, no shadow. Ink is the television and nothing else. */
const card: React.CSSProperties = {
  background: C.white,
  border: `1px solid ${C.hairline}`,
  borderRadius: R.row,
};

/** "2026-10-22" → "Oct 22". */
function shortDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const TEMPLATE: Record<EditorFlyer["template"], string> = {
  EVENT: "Event",
  PROGRAM: "Program",
  BANNER: "Banner",
};

export function ScreenEditor({ data, staff, initialTab }: {
  data: ScreenEditorData;
  staff?: boolean;
  /** Which tab a link asked for — "Set one" on the home page wants Dedication. */
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditorFlyer | "new" | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab ?? "slideshow");

  const { school, canApprove: approves } = data;
  const short = shortName(school.name, school.shortName);
  const screenUrl = `/school-screen/${school.slug}`;
  const wide = useMedia(`(min-width: ${BP.desk}px)`);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "That didn't work.");
      router.refresh();
    });
  }

  const tabs: { id: Tab; label: string }[] = approves
    ? [
        { id: "slideshow", label: "Slideshow" },
        { id: "photos", label: "Photos" },
        { id: "shouts", label: "Shout-outs" },
        { id: "dedication", label: "Dedication" },
        { id: "settings", label: "Settings" },
      ]
    : [
        { id: "slideshow", label: "Slideshow" },
        { id: "photos", label: "Photos" },
      ];

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title="Live Screen"
        sub={approves
          ? `${school.name} — what is playing in the hallway, in the order it plays.`
          : `${school.name} — what is playing in the hallway. A teacher decides what goes up.`}
        actions={
          <>
            <a
              href={screenUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px", minHeight: HIT,
                padding: "0 16px", borderRadius: R.button, textDecoration: "none",
                background: C.white, color: C.ink, border: `1px solid ${C.outline}`,
                fontFamily: F.ui, fontSize: "14.5px", fontWeight: 700,
              }}
            >
              Open the TV
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "18px" }}>open_in_new</span>
            </a>
            <button
              type="button"
              onClick={() => { setTab("slideshow"); setEditing("new"); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px", minHeight: HIT,
                padding: "0 18px", borderRadius: R.button, border: 0, cursor: "pointer",
                background: C.blue, color: C.white,
                fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
              }}
            >
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "19px" }}>add</span>
              New flyer
            </button>
          </>
        }
      />

      {staff ? (
        <div style={{ marginBottom: "16px" }}>
          <StatusChip status={school.screenUp ? "APPROVED" : "REJECTED"} label={school.screenUp ? "Screen up" : "Not up yet"} />
        </div>
      ) : null}

      {/* ---- tabs ---- */}
      <div role="tablist" aria-label="Live screen" style={{
        display: "flex", gap: "2px", flexWrap: "wrap",
        borderBottom: `1px solid ${C.hairline}`, marginBottom: "20px",
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              minHeight: HIT, padding: "0 14px", marginBottom: "-1px",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: `3px solid ${tab === t.id ? C.blue : "transparent"}`,
              color: tab === t.id ? C.ink : C.muted,
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <Note tone="error">{error}</Note> : null}

      {tab === "slideshow" ? (
        <Slideshow
          data={data}
          short={short}
          staff={staff}
          wide={wide}
          pending={pending}
          editing={editing}
          setEditing={setEditing}
          onDelete={(f) => {
            if (confirm(`Take “${f.title}” off the screen for good?`)) run(() => deleteFlyer(f.id));
          }}
          onMove={(f, dir) => run(() => moveFlyer(f.id, dir))}
        />
      ) : null}

      {tab === "photos" ? (
        <Photos data={data} pending={pending} onDelete={(id) => {
          if (confirm("Delete this photo?")) run(() => deletePhoto(id));
        }} onDone={() => router.refresh()} />
      ) : null}

      {tab === "shouts" && approves ? (
        <ShoutOuts data={data} pending={pending} onDecide={(id, yes) => run(() => decideShoutOut(id, yes))} />
      ) : null}

      {tab === "dedication" && approves ? (
        <Dedications data={data} staff={staff} pending={pending}
          onDelete={(id) => run(() => deleteDedication(id))}
          onDone={() => router.refresh()} />
      ) : null}

      {tab === "settings" && approves ? (
        <SettingsTab data={data} onDone={() => router.refresh()} />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------- slideshow -- */

function Slideshow({
  data, short, staff, wide, pending, editing, setEditing, onDelete, onMove,
}: {
  data: ScreenEditorData; short: string; staff?: boolean; wide: boolean; pending: boolean;
  editing: EditorFlyer | "new" | null;
  setEditing: (f: EditorFlyer | "new" | null) => void;
  onDelete: (f: EditorFlyer) => void;
  onMove: (f: EditorFlyer, dir: "up" | "down") => void;
}) {
  const [filter, setFilter] = useState<SlideState>("showing");
  const today = dayKey(new Date());
  const approves = data.canApprove;

  const stated = useMemo(
    () => data.flyers.map((f) => ({
      f,
      state: slideState(
        {
          status: f.status,
          template: f.template,
          showFrom: f.showFrom,
          showUntil: f.showUntil,
          startsOn: f.startsAt ? dayKey(new Date(f.startsAt)) : null,
        },
        today,
      ),
    })),
    [data.flyers, today],
  );

  const counts = {
    showing: stated.filter((x) => x.state === "showing").length,
    coming: stated.filter((x) => x.state === "coming").length,
    down: stated.filter((x) => x.state === "down").length,
  };
  const rows = stated.filter((x) => x.state === filter);
  const showing = stated.filter((x) => x.state === "showing").map((x) => x.f);

  return (
    <div style={{ display: "flex", gap: "22px", alignItems: "flex-start", flexWrap: wide ? "nowrap" : "wrap" }}>
      <div style={{ flex: "1 1 420px", minWidth: 0 }}>
        {editing ? (
          <div style={{ ...card, padding: "18px", marginBottom: "18px" }}>
            <FlyerForm
              key={editing === "new" ? "new" : editing.id}
              schoolId={editing === "new" ? data.school.id : editing.schoolId}
              short={short}
              flyer={editing === "new" ? undefined : editing}
              canChooseEvery={staff && editing === "new"}
              approves={approves}
              onDone={() => setEditing(null)}
            />
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {([["showing", "On the screen"], ["coming", "Coming up"], ["down", "Came down"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              style={{
                minHeight: HIT, padding: "0 15px", borderRadius: R.chip, cursor: "pointer",
                border: `1px solid ${filter === id ? C.ink : C.hairline}`,
                background: filter === id ? C.ink : C.white,
                color: filter === id ? C.white : C.ink,
                fontFamily: F.ui, fontSize: "14px", fontWeight: 700,
              }}
            >
              {label} {counts[id] > 0 ? <span style={{ opacity: 0.7 }}>· {counts[id]}</span> : null}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ ...card, padding: "28px 20px" }}>
            <p style={{ ...T.read, color: C.muted, margin: 0 }}>
              {filter === "showing"
                ? "Nothing is on the screen yet. Until a flyer goes up, the TV shows JOC’s Chesed Minute."
                : filter === "coming"
                  ? "Nothing is waiting for its day to come round."
                  : "Nothing has come down in the last month."}
            </p>
          </div>
        ) : (
          <ul style={{ ...card, listStyle: "none", margin: 0, padding: 0, overflow: "hidden" }}>
            {rows.map(({ f, state }, i) => {
              const mayEdit = approves ? f.schoolId !== null || staff : false;
              const mayDelete = approves ? f.schoolId !== null || staff : false;
              return (
                <li key={f.id} style={{
                  display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
                  padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.rule}`,
                }}>
                  <span style={{ ...T.meta, width: "20px", flex: "none", textAlign: "right" }}>{i + 1}</span>

                  <div style={{ flex: "none", borderRadius: R.sm, overflow: "hidden" }}>
                    <FlyerPreview width={52} short={short} flyer={{ ...f, hasQr: Boolean(f.qrUrl) }} />
                  </div>

                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.3 }}>
                      {f.title}
                    </p>
                    <p style={{ ...T.meta, margin: "3px 0 0" }}>
                      Flyer · {TEMPLATE[f.template]} · {shortDay(f.showFrom)} → {shortDay(f.showUntil)}
                      {f.schoolId === null ? " · Every school" : ""}
                    </p>
                  </div>

                  <StatusChip
                    status={f.status}
                    label={state === "coming" ? "Coming up" : state === "down" ? "Came down" : undefined}
                  />

                  {/* Order is only meaningful among the ones playing. */}
                  {approves && state === "showing" ? (
                    <div style={{ display: "flex", gap: "2px" }}>
                      <IconBtn label={`Move ${f.title} up`} icon="arrow_upward" disabled={pending || i === 0} onClick={() => onMove(f, "up")} />
                      <IconBtn label={`Move ${f.title} down`} icon="arrow_downward" disabled={pending || i === rows.length - 1} onClick={() => onMove(f, "down")} />
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {mayEdit ? <Btn tone="quiet" disabled={pending} onClick={() => setEditing(f)}>Edit</Btn> : null}
                    {mayDelete ? <Btn tone="danger" disabled={pending} onClick={() => onDelete(f)}>Delete</Btn> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p style={{ ...T.small, color: C.muted, margin: "12px 2px 0", maxWidth: "62ch" }}>
          About {SLIDE_SECONDS} seconds a slide, in this order. An event comes down the day after it happens.
        </p>
      </div>

      {/* The television, and the only ink on the page. */}
      <LivePanel flyers={showing} short={short} sticky={wide} />
    </div>
  );
}

function IconBtn({ label, icon, onClick, disabled }: {
  label: string; icon: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: HIT, height: HIT, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", borderRadius: R.sm,
        cursor: disabled ? "default" : "pointer", color: disabled ? C.ringQuiet : C.muted,
      }}
    >
      <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "20px" }}>{icon}</span>
    </button>
  );
}

/**
 * What is in the corridor at this moment, cycling as the TV cycles.
 *
 * Dark navy, like the screen itself and like nothing else in the portal —
 * that is how somebody learns what ink means here without being told.
 */
function LivePanel({ flyers, short, sticky }: { flyers: EditorFlyer[]; short: string; sticky: boolean }) {
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (flyers.length < 2) return;
    const t = setInterval(() => setAt((i) => (i + 1) % flyers.length), SLIDE_SECONDS * 1000);
    return () => clearInterval(t);
  }, [flyers.length]);

  const i = flyers.length === 0 ? 0 : at % flyers.length;
  const f = flyers[i];

  return (
    <aside
      style={{
        flex: "0 0 322px", maxWidth: "322px", minWidth: "260px",
        background: C.ink, borderRadius: R.row, padding: "16px",
        position: sticky ? "sticky" : "static", top: "18px",
      }}
    >
      <p style={{ ...T.meta, color: C.onDarkLabel, margin: "0 0 12px" }}>ON THE SCREEN NOW</p>

      {f ? (
        <>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FlyerPreview width={288} short={short} flyer={{ ...f, hasQr: Boolean(f.qrUrl) }} />
          </div>
          <p style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white, margin: "12px 0 2px" }}>
            {f.title}
          </p>
          <p style={{ ...T.meta, color: C.onDarkBody, margin: 0 }}>
            SLIDE {i + 1} OF {flyers.length}
          </p>
        </>
      ) : (
        <div style={{
          border: `2px dashed ${C.onDarkBody}`, borderRadius: R.form, padding: "28px 16px", textAlign: "center",
        }}>
          <p style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.onDarkBody, margin: 0, lineHeight: 1.5 }}>
            JOC’s Chesed Minute — until your first flyer goes up.
          </p>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------------------------------------- photos -- */

function Photos({ data, pending, onDelete, onDone }: {
  data: ScreenEditorData; pending: boolean; onDelete: (id: string) => void; onDone: () => void;
}) {
  const approves = data.canApprove;
  // What is on the wall. Anything still waiting is on the uploads page,
  // where somebody is deciding about it.
  const photos = data.photos.filter((p) => p.status === "APPROVED");

  return (
    <div style={{ ...card, padding: "18px" }}>
      <PhotoUpload schoolId={data.school.id} approves={approves} onDone={onDone} />

      <p style={{ ...T.small, color: C.muted, margin: "16px 0 12px", maxWidth: "62ch" }}>
        Students doing chesed. The two newest start the slideshow, with their caption.
      </p>

      {photos.length === 0 ? (
        <p style={{ ...T.read, color: C.muted, margin: 0 }}>No photos are on the screen yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px" }}>
          {photos.map((p) => (
            <figure key={p.id} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.caption ?? "Chesed photo"} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: R.form, display: "block" }} />
              <figcaption style={{ ...T.small, color: C.ink, margin: "6px 0" }}>{p.caption || "No caption"}</figcaption>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <StatusChip status={p.status} />
                {approves ? (
                  <Btn tone="danger" disabled={pending} onClick={() => onDelete(p.id)}>Delete</Btn>
                ) : null}
              </div>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- shout-outs -- */

function ShoutOuts({ data, pending, onDecide }: {
  data: ScreenEditorData; pending: boolean; onDecide: (id: string, yes: boolean) => void;
}) {
  // Decided ones only: what is still waiting belongs to the uploads page.
  const decided = data.shoutOuts.filter((s) => s.status !== "PENDING" && s.status !== "ENDORSED");

  return (
    <div style={{ ...card, padding: "18px" }}>
      <p style={{ ...T.small, color: C.muted, margin: "0 0 6px", maxWidth: "62ch" }}>
        Students scan the code on the screen and write one. The ten newest approved take turns.
        A name shows only if the student said it may.
      </p>
      <p style={{ ...T.small, color: C.muted, margin: "0 0 16px" }}>
        The link behind the QR code:{" "}
        <Link href={`/shout-out/${data.school.slug}`} style={{ color: C.blue }}>/shout-out/{data.school.slug}</Link>
      </p>

      {decided.length === 0 ? (
        <p style={{ ...T.read, color: C.muted, margin: 0 }}>None decided this month yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {decided.map((s, i) => (
            <li key={s.id} style={{
              display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
              padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${C.rule}`,
            }}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.5, color: C.ink, margin: 0 }}>
                  “{s.text}”
                </p>
                <p style={{ ...T.meta, margin: "4px 0 0" }}>
                  ON THE SCREEN: {shoutOutFrom(s).replace(/^— /, "").toUpperCase() || "NO NAME SHOWN"}
                </p>
              </div>
              <StatusChip status={s.status} />
              {s.status === "APPROVED" ? (
                <Btn tone="danger" disabled={pending} onClick={() => onDecide(s.id, false)}>Take down</Btn>
              ) : (
                <Btn tone="quiet" disabled={pending} onClick={() => onDecide(s.id, true)}>Approve after all</Btn>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------------------------------- dedication -- */

function Dedications({ data, staff, pending, onDelete, onDone }: {
  data: ScreenEditorData; staff?: boolean; pending: boolean;
  onDelete: (id: string) => void; onDone: () => void;
}) {
  return (
    <div style={{ ...card, padding: "18px" }}>
      <p style={{ ...T.small, color: C.muted, margin: "0 0 14px", maxWidth: "62ch" }}>
        “Today’s chesed is dedicated to a refuah shleima for …” across the top of the screen.
        A day with none set shows no dedication.
      </p>

      <DedicationForm schoolId={data.school.id} staff={staff} onDone={onDone} />

      {data.dedications.length === 0 ? (
        <p style={{ ...T.read, color: C.muted, margin: "10px 0 0" }}>Nothing is set for today or the days ahead.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
          {data.dedications.map((d, i) => (
            <li key={d.id} style={{
              display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
              padding: "12px 0", borderTop: i === 0 ? `1px solid ${C.rule}` : `1px solid ${C.rule}`,
            }}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: "20px", color: C.ink }} dir="rtl">{d.hebrewName}</div>
                <div style={{ ...T.meta, marginTop: "4px" }}>
                  {d.date}{d.everySchool ? " · EVERY SCHOOL" : ""}{d.text ? ` · ${d.text}` : ""}
                </div>
              </div>
              {!d.everySchool || staff ? (
                <Btn tone="danger" disabled={pending} onClick={() => onDelete(d.id)}>Remove</Btn>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DedicationForm({ schoolId, staff, onDone }: { schoolId: string; staff?: boolean; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [date, setDate] = useState(dayKey(new Date()));
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [every, setEvery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const form = new FormData();
    form.set("schoolId", every ? "" : schoolId);
    form.set("date", date);
    form.set("hebrewName", name);
    form.set("text", text);
    setError(null);
    start(async () => {
      const res = await setDedication(form);
      if (!res.ok) { setError(res.error); return; }
      setName(""); setText("");
      onDone();
    });
  }

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
      <div style={{ flex: "0 1 170px" }}>
        <Field label="Day"><input type="date" style={input} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <div style={{ flex: "1 1 220px" }}>
        <Field label="Name, in Hebrew"><input dir="rtl" style={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="פלוני בן פלונית" /></Field>
      </div>
      <div style={{ flex: "1 1 220px" }}>
        <Field label="Line under it" hint="optional, e.g. the sponsor"><input style={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={120} /></Field>
      </div>
      <div style={{ marginBottom: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {staff ? (
          <label style={{ display: "flex", gap: "8px", alignItems: "center", ...T.small, color: C.ink }}>
            <input type="checkbox" checked={every} onChange={(e) => setEvery(e.target.checked)} style={{ width: "18px", height: "18px" }} />
            Every school
          </label>
        ) : null}
        <Btn onClick={submit} disabled={pending}>{pending ? "Saving…" : "Set it"}</Btn>
      </div>
      {error ? <div style={{ flexBasis: "100%" }}><Note tone="error">{error}</Note></div> : null}
    </div>
  );
}

/* ----------------------------------------------------------- settings -- */

function SettingsTab({ data, onDone }: { data: ScreenEditorData; onDone: () => void }) {
  const { school } = data;
  const [pending, start] = useTransition();
  const [shortN, setShortN] = useState(school.shortName ?? "");
  const [logo, setLogo] = useState(school.logoUrl ?? "");
  const [domains, setDomains] = useState(school.emailDomains.join(", "));
  const [goal, setGoal] = useState(school.gradeGoal ? String(school.gradeGoal) : "");
  const [msg, setMsg] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  function submit() {
    const form = new FormData();
    form.set("schoolId", school.id);
    form.set("shortName", shortN);
    form.set("logoUrl", logo);
    form.set("emailDomains", domains);
    form.set("gradeGoal", goal);
    start(async () => {
      const res = await saveScreenSettings(form);
      setMsg(res.ok ? { tone: "info", text: "Saved." } : { tone: "error", text: res.error });
      if (res.ok) onDone();
    });
  }

  return (
    <div style={{ ...card, padding: "18px", maxWidth: "660px" }}>
      {/* It belongs beside the field that fixes it, not at the top of a page
          somebody opened to do something else. */}
      {school.emailDomains.length === 0 ? (
        <Note tone="warn">
          No school email domain is set, so any signed-in account can send a shout-out. Set one below.
        </Note>
      ) : null}

      <Field label="Name on the screen" hint={`shown as “${shortName(school.name, shortN)} Chesed”`}>
        <input style={input} value={shortN} onChange={(e) => setShortN(e.target.value)} maxLength={24} placeholder="HAFTR" />
      </Field>
      <Field label="Logo" hint="a link to a square image, https://">
        <input style={input} value={logo} onChange={(e) => setLogo(e.target.value)} maxLength={500} placeholder="https://" inputMode="url" />
      </Field>
      <Field label="School email domains" hint="students sign in with one of these to send a shout-out">
        <input style={input} value={domains} onChange={(e) => setDomains(e.target.value)} maxLength={300} placeholder="haftr.org, students.haftr.org" />
      </Field>
      <Field label="Hours goal per grade" hint="for when the app sends hours by grade">
        <input style={input} value={goal} onChange={(e) => setGoal(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="250" />
      </Field>
      <Btn onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save settings"}</Btn>
      {msg ? <Note tone={msg.tone} >{msg.text}</Note> : null}
    </div>
  );
}
