import { ItemTools } from "@/components/buzz/ItemTools";
import { Detail } from "@/components/buzz/Detail";
import { TAG, ago } from "@/lib/school-update";
import { first, unreadFor, type BuzzRow, type BuzzViewer } from "@/lib/buzz-feed";

/**
 * One note on the Buzz, wherever it is shown.
 *
 * Built to the design handoff: an unread dot, the school, then one mono line
 * of ago · kind · program on the same baseline, the author on its own line,
 * the note itself, and the controls under a hairline.
 *
 * The feed and the desk render this same card, so a note claimed, commented
 * on or thumbed up in one place behaves exactly the same in the other.
 */
export function BuzzCard({
  row, viewer, now,
}: {
  row: BuzzRow;
  viewer: BuzzViewer;
  now: Date;
}) {
  const me = viewer.me;
  const unread = unreadFor(row, viewer);
  const byMe = Boolean(me?.id && row.takenById === me.id);
  // The task this person made from this note. Private: nobody else's card
  // carries it, and the map it comes from is only ever built for the reader.
  const takenToDesk = viewer.onDesk.get(row.id) ?? null;

  return (
    <article style={{
      background: "#fff", borderRadius: "16px",
      boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
      padding: "16px 18px 12px",
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px",
      }}>
        {unread > 0 && (
          <span aria-hidden="true" style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#2D46AF", alignSelf: "center", flex: "0 0 auto",
          }} />
        )}
        <div style={{ font: "600 16px/1.25 var(--font-outfit)", color: "#10233F" }}>
          {row.school.name}
        </div>
        <div style={{
          font: "500 10.5px/1.3 var(--font-mono)", letterSpacing: ".05em", color: "#5A6782",
          textTransform: "uppercase",
        }}>
          {ago(row.occurredAt, now)} · {TAG[row.type] ?? "UPDATE"}
          {row.program?.name ? ` · ${row.program.name}` : ""}
        </div>
      </div>

      <div style={{ font: "400 12.5px/1.3 var(--font-outfit)", color: "#5A6782", marginTop: "3px" }}>
        by {byMe ? "you" : first(row.author?.name ?? row.author?.email)}
      </div>

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
        unread={unread}
        likes={row.likes.length}
        liked={Boolean(me?.id && row.likes.some((l) => l.userId === me.id))}
        takenBy={row.takenById ? first(row.takenBy?.name ?? row.takenBy?.email) : null}
        mine={byMe}
        canPick={viewer.canPick}
        canComment
        superAdmin={viewer.superAdmin}
        people={viewer.taggable}
        doneBy={row.doneAt ? first(row.doneBy?.name ?? row.doneBy?.email) : null}
        school={row.school.name}
        /* The two private states and the one public one. */
        onDesk={takenToDesk ? { id: takenToDesk.id, text: takenToDesk.text } : null}
        doneForMe={viewer.doneForMe.has(row.id)}
        closedBy={row.closedAt ? first(row.closedBy?.name ?? row.closedBy?.email) : null}
      />
    </article>
  );
}
