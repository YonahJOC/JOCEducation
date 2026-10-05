"use client";

import { useActionState, useState, useTransition } from "react";
import {
  savePost, setPostPublished, deletePost, type PostResult,
} from "@/app/actions/program-posts";
import { C, R, F, label, datum, rowCard, primaryButton, secondaryButton } from "@/lib/joc-tokens";

/**
 * Writing what every school on this program reads.
 *
 * One editor for all three kinds, because they are the same act with a
 * different shape: an update has a heading and a note, a question has a
 * question and an answer, a resource has a name and a link. Three separate
 * editors would be the same form three times.
 *
 * Everything lands unpublished. Publishing is a second press, so nothing
 * half-written appears on thirty-nine school portals.
 */

type Kind = "UPDATE" | "QA" | "RESOURCE";

const KINDS: { key: Kind; label: string; blurb: string }[] = [
  { key: "UPDATE", label: "What's new", blurb: "Something that changed. Schools see the newest first." },
  { key: "QA", label: "Question and answer", blurb: "A question schools keep asking, answered once." },
  { key: "RESOURCE", label: "Something to open", blurb: "A handbook, a video, the app in the stores." },
];

const day = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function ProgramPostsEditor({
  programId, posts,
}: {
  programId: number;
  posts: {
    id: string; kind: string; title: string; body: string;
    url: string | null; published: boolean; publishedAt: Date | null;
  }[];
}) {
  const [kind, setKind] = useState<Kind>("UPDATE");
  const bound = savePost.bind(null, programId, kind);
  const [state, action, pending] = useActionState<PostResult | null, FormData>(bound, null);
  const [busy, start] = useTransition();

  const spec = KINDS.find((k) => k.key === kind)!;

  return (
    <section style={{ marginTop: "20px" }}>
      <h2 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
        What your schools read
      </h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "60ch" }}>
        Written once here and shown to every school on this program. Nothing is emailed — they
        see it when they open their own portal.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
        {KINDS.map((k) => {
          const on = k.key === kind;
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => setKind(k.key)}
              aria-pressed={on}
              style={{
                fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                color: on ? C.white : C.ink,
                backgroundColor: on ? C.ink : C.white,
                border: on ? "none" : `1px solid ${C.hairline}`,
                borderRadius: "999px", padding: "0 16px", minHeight: "44px", cursor: "pointer",
              }}
            >
              {k.label}
            </button>
          );
        })}
      </div>

      <form action={action} style={{ ...rowCard, padding: "18px 20px", marginBottom: "18px" }}>
        <p style={{ ...datum, color: C.muted, margin: "0 0 12px" }}>{spec.blurb}</p>

        <input
          name="title"
          required
          placeholder={kind === "QA" ? "The question" : kind === "RESOURCE" ? "What it is called" : "Heading"}
          style={field}
        />

        {kind === "RESOURCE" && (
          <input name="url" required placeholder="https://…" style={field} />
        )}

        <textarea
          name="body"
          rows={kind === "RESOURCE" ? 2 : 4}
          required={kind !== "RESOURCE"}
          placeholder={
            kind === "QA" ? "The answer" : kind === "RESOURCE" ? "One line about it" : "The note"
          }
          style={{ ...field, resize: "vertical" }}
        />

        {state && !state.ok && (
          <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "0 0 10px" }}>
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p style={{ fontFamily: F.read, fontSize: "14px", color: C.greenText, margin: "0 0 10px" }}>
            Saved as a draft. Publish it below when it is ready.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{ ...primaryButton, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Saving…" : "Save as a draft"}
        </button>
      </form>

      {posts.length === 0 ? (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.5 }}>
          Nothing written yet. Until something is published here, your schools see none of these
          sections at all — an empty heading is a promise you have not kept.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {posts.map((p) => (
            <div key={p.id} style={{ ...rowCard, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                <span style={{ ...label, color: p.published ? C.greenText : C.orangeText }}>
                  {KINDS.find((k) => k.key === p.kind)?.label ?? p.kind}
                  {p.published
                    ? ` · live${p.publishedAt ? ` since ${day(p.publishedAt)}` : ""}`
                    : " · draft, nobody sees it"}
                </span>

                <span style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => start(() => { void setPostPublished(programId, p.id, !p.published); })}
                    style={{ ...secondaryButton, minHeight: "38px", padding: "0 14px", cursor: "pointer" }}
                  >
                    {p.published ? "Take it down" : "Publish"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => start(() => { void deletePost(programId, p.id); })}
                    style={{
                      fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.redText,
                      background: "none", border: "none", cursor: "pointer", minHeight: "38px",
                    }}
                  >
                    Delete
                  </button>
                </span>
              </div>

              <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: "8px 0 4px" }}>
                {p.title}
              </p>
              {p.url && (
                <p style={{ ...datum, color: C.blue, margin: "0 0 4px", wordBreak: "break-all" }}>{p.url}</p>
              )}
              {p.body && (
                <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.muted, margin: 0, maxWidth: "62ch" }}>
                  {p.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "15px",
  lineHeight: 1.55, color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: R.form,
  padding: "10px 12px", marginBottom: "10px",
};
