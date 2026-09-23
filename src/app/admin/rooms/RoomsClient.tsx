"use client";

import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { CrudShell, crudField, crudLabel } from "@/components/admin/SimpleCrud";
import { saveRoom, deleteRoom } from "@/app/actions/rooms";

export type RoomRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  cycleSlug: string | null;
  archived: boolean;
  sort: number;
  messageCount: number;
  memberCount: number;
};

const BLANK: RoomRow = {
  id: "", slug: "", name: "", description: "", icon: "💬",
  cycleSlug: null, archived: false, sort: 0, messageCount: 0, memberCount: 0,
};

export function RoomsClient({
  rooms, cycles, disabled,
}: {
  rooms: RoomRow[];
  cycles: { slug: string; theme: string; num: number }[];
  disabled?: boolean;
}) {
  return (
    <CrudShell<RoomRow>
      title="Discussion rooms"
      subtitle={
        "Topic rooms where teachers talk to each other, at /rooms. Unlike the Teachers' Board, " +
        "nothing here waits for approval — a conversation that needs approving is not a " +
        "conversation. You can remove any message; authors can remove their own. Closing a room " +
        "stops new messages but keeps everything readable."
      }
      steps={[
        "Press “+ New room”.",
        "Give it an icon, a name, and one line saying what it is for — that line is what a teacher reads before deciding to follow it.",
        "Tie it to a Chesed Cycle if it only matters during those weeks.",
        "Save. It is open immediately.",
        "To retire a room, tick Closed rather than deleting it — everything in it stays readable.",
      ]}
      note="Nothing posted in a room waits for approval. You can remove a single message from inside the room itself."
      addLabel="+ New room"
      items={rooms}
      blank={BLANK}
      disabled={disabled}
      onSave={(d) =>
        saveRoom({
          id: d.id || undefined,
          name: d.name,
          description: d.description,
          icon: d.icon,
          cycleSlug: d.cycleSlug,
          archived: d.archived,
          sort: d.sort,
        })
      }
      onDelete={(d) => deleteRoom(d.id)}
      renderForm={(d, set) => (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={crudLabel}>Icon</label>
              <input
                value={d.icon}
                onChange={(e) => set({ icon: e.target.value })}
                maxLength={4}
                style={{ ...crudField, textAlign: "center", fontSize: "20px" }}
              />
            </div>
            <div>
              <label style={crudLabel}>Name</label>
              <input
                value={d.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Running a Kindness Booth"
                style={crudField}
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>What this room is for</label>
            <textarea
              value={d.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              placeholder="One line a teacher reads before deciding whether to follow it."
              style={{ ...crudField, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={crudLabel}>Tied to a Chesed Cycle</label>
              <select
                value={d.cycleSlug ?? ""}
                onChange={(e) => set({ cycleSlug: e.target.value || null })}
                style={crudField}
              >
                <option value="">Not tied to one</option>
                {cycles.map((c) => (
                  <option key={c.slug} value={c.slug}>Cycle {c.num} — {c.theme}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={crudLabel}>Order in the list</label>
              <input
                type="number"
                value={d.sort}
                onChange={(e) => set({ sort: Number(e.target.value) })}
                style={crudField}
              />
            </div>
          </div>

          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: C.ink }}>
            <input
              type="checkbox"
              checked={d.archived}
              onChange={(e) => set({ archived: e.target.checked })}
              style={{ width: "16px", height: "16px" }}
            />
            Closed — readable, but no new messages
          </label>
        </>
      )}
      renderRow={(r) => (
        <>
          <p style={{ fontWeight: 600, color: C.ink, margin: 0, fontSize: "14.5px" }}>
            <span style={{ marginRight: "7px" }} aria-hidden="true">{r.icon}</span>
            {r.name}
          </p>
          <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "2px 0 0" }}>
            {r.messageCount} message{r.messageCount === 1 ? "" : "s"} ·{" "}
            {r.memberCount} following
            {r.archived ? " · closed" : ""}
            {r.slug ? (
              <>
                {" · "}
                <Link href={`/rooms/${r.slug}`} style={{ color: "#2D46AF", textDecoration: "none" }}>
                  open it
                </Link>
              </>
            ) : null}
          </p>
        </>
      )}
    />
  );
}
