"use client";

import { useRef, useState, useTransition } from "react";
import { uploadFile, removeFile } from "@/app/actions/files";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: 0 }}>Files</h1>
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
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled || pending ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {pending ? "Uploading…" : "Upload a file"}
        </button>
      </div>

      <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.6)", lineHeight: 1.55, margin: "0 0 20px", maxWidth: "70ch" }}>
        Every worksheet, source sheet and printable uploaded to JOC. You can attach files directly
        while editing a lesson or a resource — this page is for seeing what exists, and for
        removing what should not. Downloads are only served to signed-in accounts with access.
      </p>

      {error && (
        <p style={{ fontSize: "14px", color: RED, backgroundColor: "rgba(184,50,30,.07)", border: "1px solid rgba(184,50,30,.2)", borderRadius: "12px", padding: "12px 16px" }}>
          {error}
        </p>
      )}

      {files.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "16px", padding: "44px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15.5px", color: "rgba(16,35,63,.6)", margin: 0 }}>
            Nothing uploaded yet.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
          {files.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "14px 18px",
                borderTop: i === 0 ? "none" : "1px solid rgba(16,35,63,.07)",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "14.5px", fontWeight: 600, color: INK, margin: 0, wordBreak: "break-word" }}>{f.name}</p>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0" }}>
                  {f.size} · {f.when}
                  {f.uploadedBy ? ` · ${f.uploadedBy}` : ""}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", fontWeight: 600, color: BLUE, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
              >
                Open
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(f.url);
                  setCopied(f.id);
                  setTimeout(() => setCopied(null), 1500);
                }}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: copied === f.id ? "#1B7F4B" : INK, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                {copied === f.id ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={() => drop(f.id, f.name)}
                disabled={disabled || pending}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: RED, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", minHeight: "40px" }}
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
