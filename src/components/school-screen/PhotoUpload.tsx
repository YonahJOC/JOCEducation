"use client";

import { useState, useTransition } from "react";
import { C, R, T } from "@/lib/joc-tokens";
import { uploadScreenPhoto } from "@/app/actions/school-screen";
import { Btn, Field, Note, input, shrinkImage } from "./ui";

/**
 * A photo of students doing chesed, on its way to the wall.
 *
 * It lived inside ScreenEditor, which meant the uploads page could not
 * offer it without pulling in the whole editor. Same form, same consent
 * tick, one place.
 *
 * The consent tick is not a formality and is enforced on the server too: a
 * photograph of somebody's child goes on a wall in a corridor, and the
 * school is the only party that knows who has signed what.
 */
export function PhotoUpload({
  schoolId, approves, onDone, onUploaded,
}: {
  schoolId: string;
  /** This person's yes puts it straight up. */
  approves: boolean;
  onDone: () => void;
  /** Said after a successful upload, before the page is refreshed. */
  onUploaded?: () => void;
}) {
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
      onUploaded?.();
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
