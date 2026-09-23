"use client";

import { useRef, useState, useTransition } from "react";
import { R, C } from "@/lib/joc-tokens";
import { uploadFile } from "@/app/actions/files";

/**
 * Attach a file to whatever is being edited.
 *
 * Uploads immediately and hands the caller back a URL, so the surrounding
 * form only ever stores a string. Also accepts a pasted link, for material
 * that already lives somewhere else.
 */
export function FilePicker({
  value, onChange, disabled, label = "File",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const isUpload = Boolean(value && /^\/api\/files\//.test(value));

  function choose(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const r = await uploadFile(fd);
      if (!r.ok) { setError(r.error); return; }
      setName(r.name);
      onChange(r.url);
    });
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#4A5A74", marginBottom: "5px" }}>
        {label}
      </label>

      <input
        ref={input}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) choose(f);
          e.target.value = "";
        }}
      />

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled || pending}
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 600,
            color: disabled ? C.muted : C.blue, backgroundColor: "#F4F7FD",
            border: "none", borderRadius: R.chip, padding: "10px 18px", minHeight: "42px",
            cursor: disabled || pending ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Uploading…" : isUpload ? "Replace file" : "Upload a file"}
        </button>

        {value && (
          <>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "13px", fontWeight: 600, color: C.blue, textDecoration: "none" }}
            >
              {name ?? (isUpload ? "View attached file" : "Open link")}
            </a>
            <button
              type="button"
              onClick={() => { onChange(null); setName(null); }}
              disabled={disabled}
              style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: "pointer", minHeight: "36px" }}
            >
              Remove
            </button>
          </>
        )}
      </div>

      <input
        value={isUpload ? "" : value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="…or paste a link to a file hosted elsewhere"
        disabled={disabled || isUpload}
        style={{
          width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
          fontSize: "15px", color: C.ink, backgroundColor: isUpload ? "#FBF9F4" : "#fff",
          border: `1px solid ${C.hairline}`, borderRadius: "10px",
          padding: "10px 12px", minHeight: "42px", outline: "none",
        }}
      />

      {isUpload && (
        <p style={{ fontSize: "12px", color: C.greenText, margin: "6px 0 0" }}>
          Uploaded to JOC. Only signed-in accounts with access can open it.
        </p>
      )}
      {error && <p style={{ fontSize: "13px", color: C.redText, margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
