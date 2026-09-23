"use client";

import Link from "next/link";
import { R, C } from "@/lib/joc-tokens";
import { useState, useTransition } from "react";
import { toggleRoomMembership } from "@/app/actions/rooms";

export type RoomCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  archived: boolean;
  joined: boolean;
  messageCount: number;
  memberCount: number;
  unread: number;
  lastAt: string | null;
  lastBy: string | null;
  lastBody: string | null;
};

function ago(iso: string | null) {
  if (!iso) return "quiet so far";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
}

export function RoomList({ rooms }: { rooms: RoomCard[] }) {
  const [joined, setJoined] = useState<Record<string, boolean>>(
    Object.fromEntries(rooms.map((r) => [r.id, r.joined]))
  );
  const [pending, start] = useTransition();
  const [onlyMine, setOnlyMine] = useState(false);

  const shown = onlyMine ? rooms.filter((r) => joined[r.id]) : rooms;
  const mineCount = rooms.filter((r) => joined[r.id]).length;

  function toggle(id: string) {
    const next = !joined[id];
    setJoined((j) => ({ ...j, [id]: next }));
    start(async () => {
      const r = await toggleRoomMembership(id);
      if (!r.ok) setJoined((j) => ({ ...j, [id]: !next }));
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <Chip label={`All rooms (${rooms.length})`} active={!onlyMine} onClick={() => setOnlyMine(false)} />
        <Chip label={`Following (${mineCount})`} active={onlyMine} onClick={() => setOnlyMine(true)} />
      </div>

      {shown.length === 0 ? (
        <p style={{ fontSize: "16px", color: "#4A5A74", padding: "40px 0", textAlign: "center" }}>
          You are not following any rooms yet. Follow one and it will show up here.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {shown.map((r) => (
            <div
              key={r.id}
              style={{
                backgroundColor: "#fff", border: `1px solid ${C.hairline}`,
                borderRadius: "18px", padding: "20px",
                opacity: r.archived ? 0.72 : 1,
              }}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ fontSize: "26px", lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{r.icon}</span>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                    <Link
                      href={`/rooms/${r.slug}`}
                      style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.02em", color: C.ink, textDecoration: "none" }}
                    >
                      {r.name}
                    </Link>
                    {r.unread > 0 && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", backgroundColor: "#FA912D", borderRadius: R.chip, padding: "2px 9px" }}>
                        {r.unread} new
                      </span>
                    )}
                    {r.archived && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#4A5A74", backgroundColor: "#F4F7FD", borderRadius: R.chip, padding: "2px 9px" }}>
                        closed
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.55, margin: "0 0 10px" }}>
                    {r.description}
                  </p>

                  {r.lastBody ? (
                    <p style={{ fontSize: "15px", color: "#4A5A74", margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: "#4A5A74", fontWeight: 600 }}>{r.lastBy}</strong>
                      {" · "}{ago(r.lastAt)}{" — "}
                      {r.lastBody}
                      {r.lastBody.length >= 140 ? "…" : ""}
                    </p>
                  ) : (
                    <p style={{ fontSize: "15px", color: "#4A5A74", margin: 0 }}>
                      Nothing said yet — be the first.
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
                  <button
                    onClick={() => toggle(r.id)}
                    disabled={pending}
                    style={{
                      fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
                      padding: "9px 16px", minHeight: "42px", borderRadius: R.chip,
                      border: joined[r.id] ? `1px solid ${C.hairline}` : `1.5px solid ${C.blue}`,
                      backgroundColor: joined[r.id] ? "#F4F7FD" : "#fff",
                      color: joined[r.id] ? "#4A5A74" : C.blue,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {joined[r.id] ? "Following" : "Follow"}
                  </button>
                  <span style={{ fontSize: "12px", color: "#4A5A74", whiteSpace: "nowrap" }}>
                    {r.messageCount} message{r.messageCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "15px",
        padding: "9px 18px", minHeight: "44px", borderRadius: R.chip,
        border: active ? "1.5px solid #10233F" : `1px solid ${C.hairline}`,
        backgroundColor: active ? "#10233F" : "#fff",
        color: active ? "#fff" : "#10233F", cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
