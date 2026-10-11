import Link from "next/link";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { ClientForm } from "@/components/experiences/ClientForm";
import { experiencesViewer, clientList, archivedCount, ownerOptions } from "@/lib/experiences-data";
import { STATUS_LABEL, TYPE_TAG, parseStatus, parseType, type ClientStatus } from "@/lib/experiences";
import { ago, shortDay } from "@/lib/school-update";
import { first } from "@/lib/buzz-feed";
import { C, F, datum, pageTitle, rowCard, TONE, chip, type Tone } from "@/lib/joc-tokens";

/**
 * Every client the Experiences department hosts, or might.
 *
 * One row each: who they are, where they stand, who looks after them, and
 * when anybody last wrote something down — which is the question a client
 * list is actually opened to answer ("when did we last speak to the
 * Levines?"). Archived clients are a link away rather than mixed in.
 */

export const metadata = { title: "Experience clients — JOC Console" };
export const dynamic = "force-dynamic";

/** Booked is the good news; gone quiet is the one to look at. */
const STATUS_TONE: Record<ClientStatus, Tone> = {
  LEAD: "info",
  BOOKED: "good",
  REGULAR: "good",
  DORMANT: "quiet",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const viewer = await experiencesViewer();
  if (!viewer.allowed) redirect("/admin");

  const sp = await searchParams;
  const archived = sp.archived === "1";

  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={pageTitle}>Clients</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to show.
        </p>
      </div>
    );
  }

  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(midnight.getTime() + 86400000);
  const [clients, hidden, owners] = await Promise.all([
    clientList({ archived }),
    archived ? Promise.resolve(0) : archivedCount(),
    ownerOptions(),
  ]);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>{archived ? "Archived clients" : "Clients"}</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {clients.length} {clients.length === 1 ? "CLIENT" : "CLIENTS"}
          </p>
        </div>
        <SectionLinks section="experiences" />
      </div>

      {!archived && (
        <details style={{ ...rowCard, padding: "14px 18px", marginBottom: "20px", overflow: "visible" }}>
          <summary style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.blue, cursor: "pointer", minHeight: "28px" }}>
            Add a client
          </summary>
          <div style={{ marginTop: "14px" }}>
            <ClientForm owners={owners} defaultOwnerId={viewer.id} />
          </div>
        </details>
      )}

      {clients.length === 0 ? (
        <div style={{ ...rowCard, padding: "22px" }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
            {archived
              ? "Nobody is archived."
              : "No clients yet. Add one above, or type a new name on the log form and it is added for you."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {clients.map((c) => {
            const status = parseStatus(c.status);
            const last = c.activities[0] ?? null;
            const lastType = last ? parseType(last.type) : null;
            const tone = TONE[STATUS_TONE[status]];
            return (
              <Link
                key={c.id}
                href={`/admin/experiences/clients/${c.id}`}
                style={{
                  ...rowCard, padding: "14px 18px", textDecoration: "none",
                  display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px",
                }}
              >
                <div style={{ flex: "100 1 220px", minWidth: 0 }}>
                  <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {c.name}
                  </p>
                  <p style={{ ...datum, margin: "3px 0 0" }}>
                    {[c.kind, c.contactName].filter(Boolean).join(" · ") || "No details yet"}
                  </p>
                </div>
                <span style={{ ...chip, backgroundColor: tone.bg, color: tone.fg }}>{STATUS_LABEL[status]}</span>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <p style={{ ...datum, color: C.ink, margin: 0 }}>
                    {/* The newest row can be a booking still ahead, which is
                        a date rather than a "days ago". */}
                    {last
                      ? `${last.occurredAt >= tomorrow ? shortDay(last.occurredAt) : ago(last.occurredAt, midnight)}${lastType ? ` · ${TYPE_TAG[lastType]}` : ""}`
                      : "Nothing written yet"}
                  </p>
                  <p style={{ ...datum, margin: "3px 0 0" }}>
                    {c._count.activities} {c._count.activities === 1 ? "entry" : "entries"}
                    {" · "}
                    {c.owner ? first(c.owner.name ?? c.owner.email) : "no owner"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p style={{ fontFamily: F.read, fontSize: "14px", color: C.muted, marginTop: "18px" }}>
        {archived ? (
          <Link href="/admin/experiences/clients" style={{ color: C.blue, fontWeight: 600 }}>Back to the client list</Link>
        ) : hidden > 0 ? (
          <Link href="/admin/experiences/clients?archived=1" style={{ color: C.blue, fontWeight: 600 }}>
            {hidden} archived {hidden === 1 ? "client" : "clients"}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
