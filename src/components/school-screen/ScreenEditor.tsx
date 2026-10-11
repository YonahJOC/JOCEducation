"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, R, T } from "@/lib/joc-tokens";
import {
  decideFlyer, decidePhoto, decideShoutOut, deleteDedication, deleteFlyer, deletePhoto,
  saveScreenSettings, setDedication, setUpScreen, uploadScreenPhoto,
} from "@/app/actions/school-screen";
import type { ScreenEditorData, EditorFlyer } from "@/lib/school-screen/editor-data";
import { dayKey, shortName, shoutOutFrom } from "@/lib/school-screen/rules";
import { FlyerForm } from "./FlyerForm";
import { FlyerPreview } from "./FlyerPreview";
import { Btn, Field, Note, Section, StatusChip, input, shrinkImage } from "./ui";

/**
 * One school's screen, to look after.
 *
 * The same component for JOC (any school), a teacher (their own) and an
 * ambassador (theirs, adding only). What each can do is decided on the
 * server — the actions check again whatever this page offers — and this
 * shows each person only the buttons that will work for them.
 *
 * Order: what is waiting first, because a shout-out sitting in a queue for a
 * week is the one way this screen goes stale; then what is on the wall; then
 * the dedication and the settings.
 */
export function ScreenEditor({ data, staff }: { data: ScreenEditorData; staff?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditorFlyer | "new" | null>(null);

  const { school, canApprove: approves, role } = data;
  const short = shortName(school.name, school.shortName);
  const screenUrl = `/school-screen/${school.slug}`;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "That didn't work.");
      router.refresh();
    });
  }

  const waitingFlyers = data.flyers.filter((f) => f.status === "PENDING");
  const waitingPhotos = data.photos.filter((p) => p.status === "PENDING");
  const waitingShouts = data.shoutOuts.filter((s) => s.status === "PENDING");
  const waiting = waitingFlyers.length + waitingPhotos.length + waitingShouts.length;

  return (
    <div>
      {/* ---- head ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ ...T.meta }}>{role === "ambassador" ? "AMBASSADOR" : staff ? "JOC" : "YOUR SCHOOL"} · LIVE SCREEN</div>
          <h1 style={{ ...T.title, margin: "4px 0 0", color: C.ink }}>{school.name}</h1>
        </div>
        <a href={screenUrl} target="_blank" rel="noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "44px", padding: "0 16px",
          borderRadius: R.button, background: C.blue, color: C.white, textDecoration: "none",
          fontFamily: F.ui, fontWeight: 600, fontSize: "14.5px",
        }}>
          Open the screen
          <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "18px" }}>open_in_new</span>
        </a>
        {staff && !school.screenUp ? (
          <Btn tone="quiet" disabled={pending} onClick={() => run(() => setUpScreen(school.id))}>Mark the screen as up</Btn>
        ) : null}
      </div>

      {error ? <Note tone="error">{error}</Note> : null}
      {staff && school.emailDomains.length === 0 ? (
        <Note tone="warn">No school email domain is set, so any signed-in account can send a shout-out. Set one under Settings.</Note>
      ) : null}

      {/* ---- waiting ---- */}
      {approves && waiting > 0 ? (
        <Section title={`Waiting for you · ${waiting}`} icon="pending_actions"
          note="Nothing here is on the screen yet. Approve it and it goes up within five minutes.">
          {waitingShouts.map((s) => (
            <Row key={s.id}
              main={<>
                <div style={{ ...T.body, color: C.ink }}>“{s.text}”</div>
                <div style={{ ...T.meta, marginTop: "4px" }}>
                  {shoutOutFrom(s).replace(/^— /, "").toUpperCase() || "NO GRADE"} · {s.showName ? "NAME MAY BE SHOWN" : "GRADE ONLY"} · {s.email}
                </div>
              </>}
              tag="Shout-out"
              actions={<>
                <Btn tone="green" disabled={pending} onClick={() => run(() => decideShoutOut(s.id, true))}>Approve</Btn>
                <Btn tone="danger" disabled={pending} onClick={() => run(() => decideShoutOut(s.id, false))}>Reject</Btn>
              </>}
            />
          ))}
          {waitingPhotos.map((p) => (
            <Row key={p.id}
              thumb={p.imageUrl}
              main={<>
                <div style={{ ...T.body, color: C.ink }}>{p.caption || "No caption"}</div>
                <div style={{ ...T.meta, marginTop: "4px" }}>PHOTO{p.by ? ` · FROM ${p.by.toUpperCase()}` : ""} · CONSENT CONFIRMED</div>
              </>}
              tag="Photo"
              actions={<>
                <Btn tone="green" disabled={pending} onClick={() => run(() => decidePhoto(p.id, true))}>Approve</Btn>
                <Btn tone="danger" disabled={pending} onClick={() => run(() => decidePhoto(p.id, false))}>Reject</Btn>
              </>}
            />
          ))}
          {waitingFlyers.map((f) => (
            <Row key={f.id}
              preview={<FlyerPreview width={150} short={short} flyer={{ ...f, hasQr: Boolean(f.qrUrl) }} />}
              main={<>
                <div style={{ ...T.body, color: C.ink, fontWeight: 600 }}>{f.title}</div>
                <div style={{ ...T.meta, marginTop: "4px" }}>{f.template} FLYER{f.by ? ` · FROM ${f.by.toUpperCase()}` : ""} · {f.showFrom} → {f.showUntil}</div>
              </>}
              tag="Flyer"
              actions={<>
                <Btn tone="green" disabled={pending} onClick={() => run(() => decideFlyer(f.id, true))}>Approve</Btn>
                <Btn tone="quiet" disabled={pending} onClick={() => setEditing(f)}>Edit</Btn>
                <Btn tone="danger" disabled={pending} onClick={() => run(() => decideFlyer(f.id, false))}>Reject</Btn>
              </>}
            />
          ))}
        </Section>
      ) : null}

      {/* ---- slideshow: flyers ---- */}
      <Section
        title="Flyers"
        icon="slideshow"
        note="The slideshow on the left of the screen: about eight seconds each. Name, date, place and a QR code is all a flyer needs."
        tools={editing === null ? <Btn onClick={() => setEditing("new")}>New flyer</Btn> : null}
      >
        {editing ? (
          <FlyerForm
            key={editing === "new" ? "new" : editing.id}
            schoolId={editing === "new" ? school.id : editing.schoolId}
            short={short}
            flyer={editing === "new" ? undefined : editing}
            canChooseEvery={staff && editing === "new"}
            approves={approves}
            onDone={() => setEditing(null)}
          />
        ) : null}

        {data.flyers.filter((f) => f.status !== "PENDING" || !approves).length === 0 ? (
          <p style={{ ...T.small, color: C.muted, margin: 0 }}>
            No flyers yet. Until there are, the screen shows JOC&apos;s Chesed Minute.
          </p>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "16px" }}>
          {data.flyers.filter((f) => f.status !== "PENDING" || !approves).map((f) => {
            const mayEdit = approves ? f.schoolId !== null || staff : f.mine && f.status === "PENDING";
            const mayDelete = approves ? f.schoolId !== null || staff : f.mine && f.status !== "APPROVED";
            const past = f.showUntil < dayKey(new Date());
            return (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: "8px", opacity: past || f.status === "REJECTED" ? 0.55 : 1 }}>
                <FlyerPreview width={190} short={short} flyer={{ ...f, hasQr: Boolean(f.qrUrl) }} />
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <StatusChip status={f.status} label={f.status === "APPROVED" && past ? "Came down" : undefined} />
                  {f.schoolId === null ? <StatusChip status="APPROVED" label="Every school" /> : null}
                </div>
                <div style={{ ...T.meta }}>{f.showFrom} → {f.showUntil}</div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {mayEdit ? <Btn tone="quiet" disabled={pending} onClick={() => setEditing(f)}>Edit</Btn> : null}
                  {mayDelete ? <Btn tone="danger" disabled={pending} onClick={() => {
                    if (confirm(`Take “${f.title}” off the screen for good?`)) run(() => deleteFlyer(f.id));
                  }}>Delete</Btn> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ---- slideshow: photos ---- */}
      <Section
        title="Photos"
        icon="photo_camera"
        note="Students doing chesed. The two newest approved photos start the slideshow, with a caption."
      >
        <PhotoUpload schoolId={school.id} approves={approves} onDone={() => router.refresh()} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px", marginTop: "14px" }}>
          {data.photos.filter((p) => p.status !== "PENDING" || !approves).map((p) => (
            <figure key={p.id} style={{ margin: 0, opacity: p.status === "REJECTED" ? 0.55 : 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.caption ?? "Chesed photo"} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: R.form, display: "block" }} />
              <figcaption style={{ ...T.small, color: C.ink, margin: "6px 0" }}>{p.caption || "No caption"}</figcaption>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <StatusChip status={p.status} />
                {(approves || (p.mine && p.status !== "APPROVED")) ? (
                  <Btn tone="danger" disabled={pending} onClick={() => {
                    if (confirm("Delete this photo?")) run(() => deletePhoto(p.id));
                  }}>Delete</Btn>
                ) : null}
              </div>
            </figure>
          ))}
        </div>
      </Section>

      {/* ---- shout-outs ---- */}
      {approves ? (
        <Section title="Shout-outs" icon="campaign"
          note={`Students scan the code on the screen, sign in with their school email and write one. The ten newest approved take turns on the screen. A name shows only if the student said it may.`}>
          <div style={{ ...T.small, color: C.muted, marginBottom: "10px" }}>
            The link behind the QR code: <a href={`/shout-out/${school.slug}`} style={{ color: C.blue }}>/shout-out/{school.slug}</a>
          </div>
          {data.shoutOuts.filter((s) => s.status !== "PENDING").length === 0 ? (
            <p style={{ ...T.small, color: C.muted, margin: 0 }}>None decided this month yet.</p>
          ) : null}
          {data.shoutOuts.filter((s) => s.status !== "PENDING").map((s) => (
            <Row key={s.id}
              main={<>
                <div style={{ ...T.body, color: C.ink }}>“{s.text}”</div>
                <div style={{ ...T.meta, marginTop: "4px" }}>{shoutOutFrom(s).replace(/^— /, "").toUpperCase()}</div>
              </>}
              tag={<StatusChip status={s.status} />}
              actions={s.status === "APPROVED"
                ? <Btn tone="danger" disabled={pending} onClick={() => run(() => decideShoutOut(s.id, false))}>Take down</Btn>
                : <Btn tone="quiet" disabled={pending} onClick={() => run(() => decideShoutOut(s.id, true))}>Approve after all</Btn>}
            />
          ))}
        </Section>
      ) : null}

      {/* ---- dedication ---- */}
      {approves ? (
        <Section title="Dedication" icon="favorite"
          note="“Today’s chesed is dedicated to a refuah shleima for …” at the top of the screen. A day with none set shows no dedication.">
          <DedicationForm schoolId={school.id} staff={staff} onDone={() => router.refresh()} />
          {data.dedications.map((d) => (
            <Row key={d.id}
              main={<>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: "20px", color: C.ink }} dir="rtl">{d.hebrewName}</div>
                <div style={{ ...T.meta, marginTop: "4px" }}>{d.date}{d.everySchool ? " · EVERY SCHOOL" : ""}{d.text ? ` · ${d.text}` : ""}</div>
              </>}
              actions={(!d.everySchool || staff)
                ? <Btn tone="danger" disabled={pending} onClick={() => run(() => deleteDedication(d.id))}>Remove</Btn>
                : null}
            />
          ))}
        </Section>
      ) : null}

      {/* ---- settings ---- */}
      {approves ? (
        <Section title="Settings" icon="tune">
          <SettingsForm data={data} onDone={() => router.refresh()} />
        </Section>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- pieces -- */

function Row({ main, tag, actions, thumb, preview }: {
  main: React.ReactNode; tag?: React.ReactNode; actions?: React.ReactNode; thumb?: string; preview?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
      padding: "12px 0", borderTop: `1px solid ${C.rule}`,
    }}>
      {preview}
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" style={{ width: "96px", height: "72px", objectFit: "cover", borderRadius: "10px", flex: "none" }} />
      ) : null}
      <div style={{ flex: "1 1 240px", minWidth: 0 }}>{main}</div>
      {typeof tag === "string" ? <span style={{ ...T.meta }}>{tag.toUpperCase()}</span> : tag}
      {actions ? <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}

function PhotoUpload({ schoolId, approves, onDone }: { schoolId: string; approves: boolean; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  async function pick(f: File | undefined) {
    if (!f) return;
    const small = await shrinkImage(f);
    setFile(small);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(small));
  }

  function submit() {
    if (!file) { setMsg({ tone: "error", text: "Choose a photo first." }); return; }
    const form = new FormData();
    form.set("schoolId", schoolId);
    form.set("image", file);
    form.set("caption", caption);
    form.set("consent", consent ? "1" : "0");
    start(async () => {
      const res = await uploadScreenPhoto(form);
      if (!res.ok) { setMsg({ tone: "error", text: res.error }); return; }
      setMsg({ tone: "info", text: approves ? "It's on the screen." : "Sent. A teacher looks at it before it goes up." });
      setFile(null); setCaption(""); setConsent(false);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      onDone();
    });
  }

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start", background: C.paper, borderRadius: R.form, padding: "16px" }}>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" style={{ width: "160px", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "10px" }} />
      ) : null}
      <div style={{ flex: "1 1 260px" }}>
        <Field label="Photo" hint="JPG or PNG">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void pick(e.target.files?.[0])} style={{ ...input, padding: "8px" }} />
        </Field>
        <Field label="Caption" hint="what they're doing, in a line">
          <input style={input} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={90}
            placeholder="Packing chesed packages for families in Israel" />
        </Field>
        <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", ...T.small, color: C.ink, cursor: "pointer", margin: "4px 0 10px" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: "20px", height: "20px", flex: "none", marginTop: "1px" }} />
          Every student whose face is in this photo has a signed media consent on file with the school.
        </label>
        <Btn onClick={submit} disabled={pending || !file || !consent}>
          {pending ? "Uploading…" : approves ? "Put it on the screen" : "Send it to a teacher"}
        </Btn>
        {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      </div>
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
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "8px" }}>
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

function SettingsForm({ data, onDone }: { data: ScreenEditorData; onDone: () => void }) {
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
    <div style={{ maxWidth: "640px" }}>
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
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
    </div>
  );
}
