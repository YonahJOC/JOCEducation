"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, R, T } from "@/lib/joc-tokens";
import { saveFlyer } from "@/app/actions/school-screen";
import { dayKey, flyerWarnings } from "@/lib/school-screen/rules";
import type { EditorFlyer } from "@/lib/school-screen/editor-data";
import { FlyerPreview } from "./FlyerPreview";
import { Btn, Field, Note, input, shrinkImage } from "./ui";

/**
 * Make a flyer, or change one, with the real thing beside the form.
 *
 * The guidelines (design/Screen Flyer Guidelines.dc.html) come up as
 * warnings while typing — too many words, a name too long for its line, no
 * date — and never stop a save: whoever is making it may know something the
 * checklist doesn't.
 */

type Template = "EVENT" | "PROGRAM" | "BANNER";

const TEMPLATES: { id: Template; name: string; what: string; icon: string }[] = [
  { id: "EVENT", name: "Event", what: "A photo, a date sticker, the name, time and place.", icon: "event" },
  { id: "PROGRAM", name: "Program", what: "No photo. A big icon, the name huge, one line, a QR code.", icon: "campaign" },
  { id: "BANNER", name: "Banner", what: "Finished artwork, shown whole, with the name and a QR code under it.", icon: "image" },
];

const ICONS = ["volunteer_activism", "school", "mic", "favorite", "celebration", "directions_run", "bakery_dining", "bed", "groups", "public"];

function plusDays(n: number): string {
  return dayKey(new Date(Date.now() + n * 86400000));
}

export function FlyerForm({ schoolId, short, flyer, canChooseEvery, approves, onDone }: {
  /** Null for a flyer on every school's screen. */
  schoolId: string | null;
  short: string;
  flyer?: EditorFlyer;
  /** JOC can put one flyer on every screen at once. */
  canChooseEvery?: boolean;
  /** A teacher's or JOC's flyer goes straight up; an ambassador's waits. */
  approves: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [overflow, setOverflow] = useState<string[]>([]);

  const [template, setTemplate] = useState<Template>(flyer?.template ?? "EVENT");
  const [title, setTitle] = useState(flyer?.title ?? "");
  const [line, setLine] = useState(flyer?.line ?? "");
  const [date, setDate] = useState(flyer?.startsAt ? dayKey(new Date(flyer.startsAt)) : "");
  const [time, setTime] = useState(flyer?.time ?? "");
  const [place, setPlace] = useState(flyer?.place ?? "");
  const [ambassadors, setAmbassadors] = useState(flyer?.ambassadors ?? "");
  const [icon, setIcon] = useState(flyer?.icon ?? "volunteer_activism");
  const [qrUrl, setQrUrl] = useState(flyer?.qrUrl ?? "");
  const [qrLabel, setQrLabel] = useState(flyer?.qrLabel ?? "");
  const [showFrom, setShowFrom] = useState(flyer?.showFrom ?? plusDays(0));
  const [showUntil, setShowUntil] = useState(flyer?.showUntil ?? plusDays(14));
  const [every, setEvery] = useState(flyer ? flyer.schoolId === null : false);
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [dropImage, setDropImage] = useState(false);

  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);


  const imageUrl = dropImage ? null : localUrl ?? flyer?.imageUrl ?? null;
  const startsAt = date ? new Date(`${date}T12:00:00Z`).toISOString() : null;

  const warnings = useMemo(() => [
    ...flyerWarnings({ template, title, line, place, time, startsAt, hasImage: Boolean(imageUrl), qrUrl }),
    ...overflow,
  ], [template, title, line, place, time, startsAt, imageUrl, qrUrl, overflow]);

  const onOverflow = useCallback((p: string[]) => {
    setOverflow((prev) => (prev.join("|") === p.join("|") ? prev : p));
  }, []);

  async function pick(f: File | undefined) {
    if (!f) return;
    const small = await shrinkImage(f);
    setFile(small);
    setDropImage(false);
    setLocalUrl(URL.createObjectURL(small));
  }

  function submit() {
    setError(null);
    const form = new FormData();
    if (flyer) form.set("id", flyer.id);
    form.set("schoolId", every ? "" : schoolId ?? "");
    form.set("template", template);
    form.set("title", title);
    form.set("line", line);
    form.set("startsAt", date);
    form.set("time", time);
    form.set("place", place);
    form.set("ambassadors", ambassadors);
    form.set("icon", icon);
    form.set("qrUrl", qrUrl);
    form.set("qrLabel", qrLabel);
    form.set("showFrom", showFrom);
    form.set("showUntil", showUntil);
    if (file) form.set("image", file);
    if (dropImage) form.set("removeImage", "1");
    start(async () => {
      const res = await saveFlyer(form);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
      onDone();
    });
  }

  const usesImage = template !== "PROGRAM";

  return (
    <div style={{ border: `1.5px solid ${C.hairline}`, borderRadius: R.hero, padding: "20px", marginBottom: "18px", background: C.paper }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }} role="radiogroup" aria-label="Kind of flyer">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={template === t.id}
            onClick={() => setTemplate(t.id)}
            style={{
              flex: "1 1 180px", textAlign: "left", cursor: "pointer", padding: "12px 14px",
              borderRadius: R.form, border: `2px solid ${template === t.id ? C.blue : C.hairline}`,
              background: template === t.id ? C.blueTint : C.white, color: C.ink,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: F.ui, fontWeight: 700, fontSize: "15px" }}>
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "20px", color: C.blue }}>{t.icon}</span>
              {t.name}
            </div>
            <div style={{ ...T.small, color: C.muted, marginTop: "4px", fontSize: "13px" }}>{t.what}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <Field label="Name" hint="big, in capitals on the screen">
            <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
              placeholder={template === "EVENT" ? "Kindness Booth" : template === "PROGRAM" ? "Just One Tutor" : "Run for Chesed"} />
          </Field>
          <Field label={template === "PROGRAM" ? "One short line" : "Line above the name"} hint="optional">
            <input style={input} value={line} onChange={(e) => setLine(e.target.value)} maxLength={120}
              placeholder={template === "PROGRAM" ? "Share what you know. Help someone learn." : template === "EVENT" ? `Coming up at ${short}` : "Join the team"} />
          </Field>

          {template !== "BANNER" ? (
            <Field label={template === "EVENT" ? "Date of the event" : "Launch date"} hint={template === "EVENT" ? "" : "optional"}>
              <input type="date" style={input} value={date} onChange={(e) => {
                setDate(e.target.value);
                // An event comes down the day after it happens, so on a new
                // flyer its date sets the window's end too.
                if (template === "EVENT" && e.target.value && !flyer) setShowUntil(e.target.value);
              }} />
            </Field>
          ) : null}
          {template !== "PROGRAM" ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <Field label="Time" hint="optional">
                  <input style={input} value={time} onChange={(e) => setTime(e.target.value)} maxLength={40} placeholder="12:30 – 1:30 PM" />
                </Field>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <Field label="Place" hint="optional">
                  <input style={input} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={60} placeholder="Main lobby" />
                </Field>
              </div>
            </div>
          ) : null}
          {template === "EVENT" ? (
            <Field label="Ask our ambassadors" hint="optional, first names">
              <input style={input} value={ambassadors} onChange={(e) => setAmbassadors(e.target.value)} maxLength={60} placeholder="Maya K. · Eli R." />
            </Field>
          ) : null}
          {template === "PROGRAM" ? (
            <Field label="Icon">
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {ICONS.map((i) => (
                  <button key={i} type="button" onClick={() => setIcon(i)} aria-label={i} aria-pressed={icon === i}
                    style={{
                      width: "44px", height: "44px", borderRadius: "12px", cursor: "pointer",
                      border: `2px solid ${icon === i ? C.blue : C.hairline}`, background: icon === i ? C.blueTint : C.white,
                    }}>
                    <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "22px", color: C.orangeText }}>{i}</span>
                  </button>
                ))}
              </div>
            </Field>
          ) : null}

          {usesImage ? (
            <Field label={template === "EVENT" ? "Photo" : "The artwork"} hint="JPG or PNG. Real JOC or school photos only">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void pick(e.target.files?.[0])}
                style={{ ...input, padding: "8px" }} />
              {imageUrl ? (
                <button type="button" onClick={() => { setDropImage(true); setFile(null); setLocalUrl(null); }}
                  style={{ background: "none", border: 0, color: C.destructive, cursor: "pointer", padding: "6px 0", ...T.small }}>
                  Remove the picture
                </button>
              ) : null}
            </Field>
          ) : null}

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 200px" }}>
              <Field label="QR code opens" hint="optional, a page that works on a phone">
                <input style={input} value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} maxLength={500} placeholder="https://" inputMode="url" />
              </Field>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <Field label="QR label">
                <input style={input} value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} maxLength={30} placeholder="Scan to sign up" />
              </Field>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px" }}>
              <Field label="Goes up">
                <input type="date" style={input} value={showFrom} onChange={(e) => setShowFrom(e.target.value)} />
              </Field>
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <Field label="Comes down" hint={template === "EVENT" ? "the day after the event at the latest" : ""}>
                <input type="date" style={input} value={showUntil} onChange={(e) => setShowUntil(e.target.value)} />
              </Field>
            </div>
          </div>

          {canChooseEvery ? (
            <label style={{ display: "flex", gap: "10px", alignItems: "center", ...T.small, color: C.ink, margin: "4px 0 12px", cursor: "pointer" }}>
              <input type="checkbox" checked={every} onChange={(e) => setEvery(e.target.checked)} style={{ width: "20px", height: "20px" }} />
              Put this on every school&apos;s screen
            </label>
          ) : null}
        </div>

        <div style={{ flex: "0 1 372px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ ...T.meta }}>HOW IT LOOKS ON THE TV</div>
          <FlyerPreview
            short={short}
            onOverflow={onOverflow}
            flyer={{
              id: flyer?.id ?? "draft", template, title: title || "Name", line: line || null, startsAt,
              time: time || null, place: place || null, ambassadors: ambassadors || null,
              icon, imageUrl, qrLabel: qrLabel || null, hasQr: Boolean(qrUrl),
            }}
          />
        </div>
      </div>

      {warnings.length ? (
        <Note tone="warn">
          <strong>Against the flyer guidelines:</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Note>
      ) : null}
      {!approves ? <Note>A teacher looks at it before it goes on the screen.</Note> : null}
      {error ? <Note tone="error">{error}</Note> : null}

      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        <Btn onClick={submit} disabled={pending}>
          {pending ? "Saving…" : flyer ? "Save changes" : approves ? "Put it on the screen" : "Send it to a teacher"}
        </Btn>
        <Btn tone="quiet" onClick={onDone} disabled={pending}>Cancel</Btn>
      </div>
    </div>
  );
}
