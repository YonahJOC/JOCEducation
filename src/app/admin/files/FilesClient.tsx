"use client";

import { useRef, useState, useTransition } from "react";
import { R, C } from "@/lib/joc-tokens";
import { uploadFile, removeFile } from "@/app/actions/files";
import { PageIntro } from "@/components/admin/PageIntro";

export type FileRow = {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  when: string;
  uploadedBy: string | null;
  url: string;
};

/** Everything uploaded, with the link to paste into a lesson or resource. */
export function FilesClient({ files, disabled }: { files: FileRow[]; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function add(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const r = await uploadFile(fd);
      if (!r.ok) setError(r.error);
    });
  }

  function drop(id: string, name: string) {
    if (!window.confirm(`Delete ${name}? Anything linking to it will stop working.`)) return;
    start(async () => {
      const r = await removeFile(id);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div>
      <PageIntro
        title="Files"
        what="Every worksheet, source sheet, photo and printable uploaded to JOC. You can attach files while editing a lesson, a resource or a product — this page is for seeing what exists and removing what should not."
        steps={[
          "Press “Upload a file” to add one.",
          "“Copy link” gives you its address, to paste anywhere that asks for one.",
          "“Open” checks it is the file you think it is.",
          "Delete only something nothing is using — anything pointing at it will stop working.",
        ]}
        note="Downloads are served only to signed-in accounts whose access is live. A link pasted outside the site will not open for a stranger."
      >
        <input
          ref={input}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) add(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => input.current?.click()}
          disabled={disabled || pending}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 20px",
            minHeight: "44px", cursor: disabled || pending ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {pending ? "Uploading…" : "Upload a file"}
        </button>
      </PageIntro>

      {error && (
        <p style={{ fontSize: "14px", color: C.redText, backgroundColor: "rgba(184,50,30,.07)", border: "1px solid rgba(184,50,30,.2)", borderRadius: "12px", padding: "12px 16px" }}>
          {error}
        </p>
      )}

      {files.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: `1px dashed ${C.hairline}`, borderRadius: "16px", padding: "44px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#4A5A74", margin: 0 }}>
            Nothing uploaded yet.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
          {files.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "14px 18px",
                borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: C.ink, margin: 0, wordBreak: "break-word" }}>{f.name}</p>
                <p style={{ fontSize: "13px", color: "#4A5A74", margin: "2px 0 0" }}>
                  {f.size} · {f.when}
                  {f.uploadedBy ? ` · ${f.uploadedBy}` : ""}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", fontWeight: 600, color: C.blue, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
              >
                Open
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(f.url);
                  setCopied(f.id);
                  setTimeout(() => setCopied(null), 1500);
                }}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: copied === f.id ? "#1D6B37" : C.ink, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                {copied === f.id ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={() => drop(f.id, f.name)}
                disabled={disabled || pending}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", minHeight: "40px" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
