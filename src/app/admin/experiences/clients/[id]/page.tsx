import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { LogForm } from "@/components/experiences/LogForm";
import { EntryCard } from "@/components/experiences/EntryCard";
import { ClientForm } from "@/components/experiences/ClientForm";
import { experiencesViewer, experienceRows, clientById, ownerOptions } from "@/lib/experiences-data";
import { STATUS_LABEL, parseStatus } from "@/lib/experiences";
import { day } from "@/lib/school-update";
import { C, F, datum, label, pageTitle, rowCard, chip, plainChip } from "@/lib/joc-tokens";

/**
 * One client: who they are, and everything that has happened with them.
 *
 * The card at the top is what somebody needs before they pick up the phone —
 * who to ask for, the number, where things stand, whose client it is. The
 * whole history is underneath, newest first, with the log form above it
 * already pointed at this client, so writing down the call you just made is
 * one box and a Save.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // The title is read before the page's own guard runs, so it checks too —
  // a client's name is not something to put in a stranger's tab.
  const viewer = await experiencesViewer();
  if (!viewer.allowed) return { title: "Experiences — JOC Console" };
  const { id } = await params;
  const c = await clientById(id);
  return { title: `${c?.name ?? "Client"} — Experiences — JOC Console` };
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await experiencesViewer();
  if (!viewer.allowed) redirect("/admin");

  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={pageTitle}>Client</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to show.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const client = await clientById(id);
  if (!client) notFound();

  const [rows, owners] = await Promise.all([
    experienceRows({ clientId: client.id, take: 500 }),
    ownerOptions(),
  ]);

  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const status = parseStatus(client.status);
  const myName = viewer.me?.name?.trim() || viewer.me?.email || "you";
  const ownerName = client.owner ? (client.owner.name?.trim() || client.owner.email) : null;

  return (
    <div style={{ maxWidth: "760px" }}>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <Link href="/admin/experiences/clients" style={{ ...label, color: C.blue, textDecoration: "none" }}>
            ← Clients
          </Link>
          <h1 style={{ ...pageTitle, margin: "6px 0 6px" }}>{client.name}</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <span style={{ ...chip, backgroundColor: C.ink, color: C.white }}>{STATUS_LABEL[status]}</span>
            {client.kind && <span style={plainChip}>{client.kind}</span>}
            {client.archivedAt && (
              <span style={{ ...chip, backgroundColor: C.orangeTint, color: C.orangeText }}>Archived</span>
            )}
          </div>
        </div>
        <SectionLinks section="experiences" />
      </div>

      {/* ── The card ────────────────────────────────────────────────── */}
      <section style={{ ...rowCard, padding: "18px", marginBottom: "24px" }}>
        <dl style={{
          display: "grid", gap: "12px 20px", margin: 0,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}>
          <Fact term="Contact">{client.contactName}</Fact>
          <Fact term="Phone">
            {client.phone && <a href={`tel:${client.phone}`} style={link}>{client.phone}</a>}
          </Fact>
          <Fact term="Email">
            {client.email && <a href={`mailto:${client.email}`} style={link}>{client.email}</a>}
          </Fact>
          <Fact term="Looked after by">{ownerName}</Fact>
        </dl>

        {client.notes && (
          <p style={{
            fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
            margin: "14px 0 0", whiteSpace: "pre-wrap", maxWidth: "62ch",
          }}>
            {client.notes}
          </p>
        )}

        <p style={{ ...datum, margin: "14px 0 0" }}>On the list since {day(client.createdAt)}</p>

        <details style={{ marginTop: "12px", borderTop: `1px solid ${C.hairline}`, paddingTop: "10px" }}>
          <summary style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.blue, cursor: "pointer", minHeight: "28px" }}>
            Edit details
          </summary>
          <div style={{ marginTop: "12px" }}>
            <ClientForm
              owners={owners}
              client={{
                id: client.id,
                name: client.name,
                kind: client.kind,
                contactName: client.contactName,
                email: client.email,
                phone: client.phone,
                notes: client.notes,
                status,
                ownerId: client.ownerId,
                archived: Boolean(client.archivedAt),
              }}
            />
          </div>
        </details>
      </section>

      {/* ── Log against this client ─────────────────────────────────── */}
      <section style={{ marginBottom: "26px" }}>
        <h2 style={h2}>Log an interaction</h2>
        <LogForm clients={[]} preset={{ id: client.id, name: client.name }} myName={myName} />
      </section>

      {/* ── Everything that has happened ────────────────────────────── */}
      <h2 style={h2}>
        History <span style={{ ...datum, fontWeight: 500 }}>{rows.length}</span>
      </h2>
      {rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "22px" }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", color: C.muted, margin: 0 }}>
            Nothing written down about {client.name} yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {rows.map((r) => (
            <EntryCard key={r.id} row={r} viewer={viewer} now={midnight} showClient={false} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One fact on the card. A blank one says so, quietly, rather than vanishing. */
function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === false || children === "";
  return (
    <div style={{ minWidth: 0 }}>
      <dt style={{ ...label, color: C.muted, marginBottom: "3px" }}>{term}</dt>
      <dd style={{
        fontFamily: F.ui, fontSize: "15px", color: empty ? C.faint : C.ink,
        margin: 0, overflowWrap: "anywhere",
      }}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}

const h2: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em",
  color: C.ink, margin: "0 0 12px",
};

const link: React.CSSProperties = { color: C.blue, textDecoration: "none", fontWeight: 600 };
