"use client";

import { useState, useTransition } from "react";
import { setBoardPostApproved, deleteBoardPost } from "@/app/actions/content";

const INK = "#10233F";

export type BoardRow = {
  id: string;
  title: string;
  body: string;
  author: string | null;
  schoolName: string;
  region: string;
  approved: boolean;
  createdAt: Date | string;
};

function ago(d: Date | string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function BoardClient({ posts, disabled }: { posts: BoardRow[]; disabled?: boolean }) {
  const pending = posts.filter((p) => !p.approved);
  const live = posts.filter((p) => p.approved);

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Teachers&rsquo; Board
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>
        {pending.length > 0 ? (
          <strong style={{ color: "#C96C00" }}>{pending.length} waiting for approval.</strong>
        ) : (
          "Nothing waiting for approval."
        )}{" "}
        {live.length} live on the board. New posts stay hidden until approved.
      </p>

      {pending.length > 0 && (
        <>
          <SectionHead label={`Waiting for approval (${pending.length})`} accent />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {pending.map((p) => <PostCard key={p.id} post={p} disabled={disabled} />)}
          </div>
        </>
      )}

      <SectionHead label={`Live on the board (${live.length})`} />
      {live.length === 0 ? (
        <p style={{ fontSize: "14px", color: "rgba(16,35,63,.5)" }}>Nothing published yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {live.map((p) => <PostCard key={p.id} post={p} disabled={disabled} />)}
        </div>
      )}
    </div>
  );
}

function SectionHead({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <p style={{
      fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700,
      color: accent ? "#C96C00" : "rgba(16,35,63,.45)", margin: "0 0 10px",
    }}>
      {label}
    </p>
  );
}

function PostCard({ post, disabled }: { post: BoardRow; disabled?: boolean }) {
  const [approved, setApproved] = useState(post.approved);
  const [removed, setRemoved] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (removed) return null;

  function toggle() {
    const next = !approved;
    setApproved(next);
    setMsg(null);
    start(async () => {
      const r = await setBoardPostApproved(post.id, next);
      if (!r.ok) { setApproved(!next); setMsg(r.error ?? "Failed"); }
    });
  }

  function remove() {
    if (!window.confirm("Delete this post permanently?")) return;
    start(async () => {
      const r = await deleteBoardPost(post.id);
      if (r.ok) setRemoved(true);
      else setMsg(r.error ?? "Failed");
    });
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: approved ? "1px solid rgba(16,35,63,.09)" : "1px solid rgba(250,145,45,.45)",
        borderRadius: "14px", padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
        <p style={{ fontWeight: 700, fontSize: "15px", color: INK, margin: 0 }}>{post.title}</p>
        <span style={{ fontSize: "12px", color: "rgba(16,35,63,.45)", whiteSpace: "nowrap" }}>{ago(post.createdAt)}</span>
      </div>
      <p style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", margin: "0 0 9px" }}>
        {post.author ?? "Unknown"} · {post.schoolName} · {post.region}
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(16,35,63,.78)", margin: "0 0 14px" }}>{post.body}</p>

      <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={toggle}
          disabled={disabled || pending}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13px",
            color: "#fff", backgroundColor: approved ? "#7A8699" : "#1B7F4B",
            border: "none", borderRadius: "9999px", padding: "9px 16px", minHeight: "40px",
            cursor: disabled ? "not-allowed" : "pointer", opacity: disabled || pending ? 0.6 : 1,
          }}
        >
          {approved ? "Unpublish" : "Approve"}
        </button>
        <button
          onClick={remove}
          disabled={disabled || pending}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13px", color: "#B8321E",
            background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, minHeight: "40px",
          }}
        >
          Delete
        </button>
        {msg && <span style={{ fontSize: "12.5px", color: "#B8321E" }}>{msg}</span>}
      </div>
    </div>
  );
}
