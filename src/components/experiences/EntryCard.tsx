import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { Detail } from "@/components/buzz/Detail";
import { EntryTools } from "@/components/experiences/EntryTools";
import { ago, day } from "@/lib/school-update";
import { first } from "@/lib/buzz-feed";
import { TYPE_TAG, clockOf, mayChange, parseType, takesGroupSize } from "@/lib/experiences";
import type { ExperienceRow, ExperiencesViewer } from "@/lib/experiences-data";

/**
 * One entry, on the department's feed or on a client's own card.
 *
 * Drawn to the Buzz card: the client, then one mono line of ago · kind · date
 * on the same baseline, the author on its own line, what happened, and the
 * controls under a hairline. On a client's card the client's name is the page
 * title already, so it is left off.
 */
export function EntryCard({
  row, viewer, now, showClient = true,
}: {
  row: ExperienceRow;
  viewer: ExperiencesViewer;
  now: Date;
  showClient?: boolean;
}) {
  const type = parseType(row.type);
  const tag = type ? TYPE_TAG[type] : "UPDATE";
  const time = clockOf(row.occurredAt);
  const byMe = Boolean(viewer.id && row.authorId === viewer.id);
  const booked = row.type === "EXPERIENCE_BOOKED";

  return (
    <article style={{
      background: "#fff", borderRadius: "16px",
      boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
      padding: "16px 18px 8px",
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
        {showClient && (
          <Link
            href={`/admin/experiences/clients/${row.client.id}`}
            style={{ font: "600 16px/1.25 var(--font-outfit)", color: C.ink, textDecoration: "none" }}
          >
            {row.client.name}
          </Link>
        )}
        <div style={{
          font: "500 10.5px/1.3 var(--font-mono)", letterSpacing: ".05em",
          color: C.faint, textTransform: "uppercase",
        }}>
          {/* A booking is about a date ahead, so it says the date rather than
              how long ago somebody wrote it down. */}
          {booked ? day(row.occurredAt) : ago(row.occurredAt, now)}
          {time ? ` · ${time}` : ""}
          {" · "}
          <span style={{ color: booked ? C.greenText : row.type === "EXPERIENCE_DONE" ? C.blue : C.faint }}>
            {tag}
          </span>
          {row.groupSize ? ` · ${row.groupSize} people` : ""}
        </div>
      </div>

      <div style={{ font: "400 12.5px/1.3 var(--font-outfit)", color: C.faint, marginTop: "3px" }}>
        by {byMe ? "you" : first(row.author?.name ?? row.author?.email)}
      </div>

      <p style={{ font: "600 15px/1.4 var(--font-outfit)", color: C.ink, margin: "8px 0 0" }}>
        {row.summary}
      </p>

      {row.detail && <Detail text={row.detail} />}

      <EntryTools
        activityId={row.id}
        summary={row.summary}
        detail={row.detail}
        groupSize={row.groupSize}
        showsGroup={type ? takesGroupSize(type) : false}
        canChange={mayChange(row, viewer)}
        notes={row.notes.map((n) => ({
          id: n.id,
          body: n.body,
          who: first(n.author?.name ?? n.author?.email),
          when: ago(n.createdAt, now),
          mine: Boolean(viewer.id && n.authorId === viewer.id),
        }))}
      />
    </article>
  );
}
