import { ItemTools } from "@/components/buzz/ItemTools";
import { Detail } from "@/components/buzz/Detail";
import { TAG, day, ago } from "@/lib/school-update";
import { first, unreadFor, type BuzzRow, type BuzzViewer } from "@/lib/buzz-feed";
import { C, F, label } from "@/lib/joc-tokens";

/**
 * One item on the Buzz, wherever it is shown.
 *
 * The feed and the window on the console home render this same card, so an
 * update picked up, commented on or thumbed up in one place behaves exactly
 * the same in the other. They were two components with two ideas of what an
 * item is, and one of them had no comment box.
 */
export function BuzzCard({
  row, viewer, now,
}: {
  row: BuzzRow;
  viewer: BuzzViewer;
  now: Date;
}) {
  const me = viewer.me;

  return (
    <article style={card}>
      <div style={{
        display: "flex", justifyContent: "space-between", gap: "10px",
        flexWrap: "wrap", alignItems: "baseline",
      }}>
        <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
          {row.school.name}
        </p>
        <span style={{ ...label, color: C.muted }} title={day(row.occurredAt)}>
          {ago(row.occurredAt, now).toUpperCase()}
        </span>
      </div>

      <p style={{ ...label, color: C.muted, margin: "4px 0 0" }}>
        <span style={{ color: C.ink }}>{TAG[row.type] ?? "UPDATE"}</span>
        {" · "}
        {row.program?.name ?? "No program"}
        {" · "}
        {first(row.author?.name ?? row.author?.email)}
      </p>

      {row.detail && <Detail text={row.detail} />}

      <ItemTools
        activityId={row.id}
        detail={row.detail}
        notes={row.notes.map((n) => ({
          id: n.id,
          body: n.body,
          who: first(n.author?.name ?? n.author?.email),
          when: ago(n.createdAt, now),
          mine: Boolean(me?.id && n.authorId === me.id),
        }))}
        unread={unreadFor(row, viewer)}
        likes={row.likes.length}
        liked={Boolean(me?.id && row.likes.some((l) => l.userId === me.id))}
        takenBy={row.takenById ? first(row.takenBy?.name ?? row.takenBy?.email) : null}
        mine={Boolean(me?.id && row.takenById === me.id)}
        canPick={viewer.canPick}
        canComment
        superAdmin={viewer.superAdmin}
        people={viewer.taggable}
      />
    </article>
  );
}

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: "16px", padding: "16px 18px",
  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
};
