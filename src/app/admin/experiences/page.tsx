import Link from "next/link";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { ClientTabs } from "@/components/admin/ClientTabs";
import { LogForm } from "@/components/experiences/LogForm";
import { EntryCard } from "@/components/experiences/EntryCard";
import { experiencesViewer, experienceRows, clientOptions } from "@/lib/experiences-data";
import { FILTER_LABEL, parseFilter, clockOf, type Filter } from "@/lib/experiences";
import { shortDay, away } from "@/lib/school-update";
import { C, F, datum, label, pageTitle, filterChip, field } from "@/lib/joc-tokens";

/**
 * The Experiences department's Buzz.
 *
 * Everything anybody in the department has written down about any client,
 * newest first, with the comments under each — the way the Buzz does it for
 * schools. The form to add to it sits on top rather than on its own page:
 * three people at desks write something down several times a day, and a
 * form one click away is a form that gets skipped.
 *
 * Experiences in the diary sit above the feed in date order, because those
 * are the only rows anybody can still act on. They are left out once a
 * filter or a search is on — somebody looking for "that call in March" is
 * not asking what is coming up.
 */

export const metadata = { title: "Client relations — JOC Console" };
export const dynamic = "force-dynamic";

const FEED = 120;

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const viewer = await experiencesViewer();
  if (!viewer.allowed) redirect("/admin");

  const sp = await searchParams;
  const filter = parseFilter(sp.type);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const filtered = filter !== "all" || Boolean(q);

  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={pageTitle}>Client relations</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to show.
        </p>
      </div>
    );
  }

  const [rows, clients] = await Promise.all([
    experienceRows({ filter, q, take: FEED }),
    clientOptions(),
  ]);

  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const ahead = filtered
    ? []
    : rows
        .filter((r) => r.type === "EXPERIENCE_BOOKED" && r.occurredAt >= midnight)
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  /** A link that keeps the search where it was. */
  const href = (f: Filter) => {
    const next = new URLSearchParams();
    if (f !== "all") next.set("type", f);
    if (q) next.set("q", q);
    const s = next.toString();
    return s ? `/admin/experiences?${s}` : "/admin/experiences";
  };

  const myName = viewer.me?.name?.trim() || viewer.me?.email || "you";

  return (
    <div style={{ maxWidth: "760px" }}>
      <ClientTabs active="experiences" />
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>Client relations</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {clients.length} {clients.length === 1 ? "CLIENT" : "CLIENTS"}
            {ahead.length > 0 ? ` · ${ahead.length} IN THE DIARY` : ""}
          </p>
        </div>
        <SectionLinks section="experiences" />
      </div>

      {/* ── Log an interaction ──────────────────────────────────────── */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={h2}>Log an interaction</h2>
        <LogForm clients={clients} myName={myName} />
      </section>

      {/* ── Still ahead ─────────────────────────────────────────────── */}
      {ahead.length > 0 && (
        <section style={{ marginBottom: "28px" }}>
          <h2 style={h2}>Coming up</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {ahead.map((r) => (
              <Link
                key={r.id}
                href={`/admin/experiences/clients/${r.client.id}`}
                style={{
                  display: "flex", flexWrap: "wrap", textDecoration: "none", overflow: "hidden",
                  background: "#fff", borderRadius: "16px",
                  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
                }}
              >
                <div style={{
                  flex: "0 0 140px", boxSizing: "border-box", padding: "12px 16px",
                  backgroundColor: C.greenTint, color: C.greenText,
                  display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px",
                }}>
                  <span style={{ ...label, color: C.greenText }}>{away(r.occurredAt, midnight)}</span>
                  <span style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, lineHeight: 1.2 }}>
                    {shortDay(r.occurredAt)}
                    {clockOf(r.occurredAt) ? `, ${clockOf(r.occurredAt)}` : ""}
                  </span>
                </div>
                <div style={{ flex: "100 1 220px", minWidth: 0, padding: "12px 16px" }}>
                  <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {r.client.name}
                  </p>
                  <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: "3px 0 0" }}>
                    {r.summary}
                    {r.groupSize ? ` · about ${r.groupSize}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── The feed ────────────────────────────────────────────────── */}
      <h2 style={h2}>What&rsquo;s been happening</h2>

      <form action="/admin/experiences" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        {filter !== "all" && <input type="hidden" name="type" value={filter} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Client, or anything written"
          aria-label="Search"
          style={{ ...field, flex: "1 1 220px", minWidth: 0, width: "auto" }}
        />
        <button
          type="submit"
          style={{
            fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white,
            backgroundColor: C.ink, border: "none", borderRadius: "12px",
            padding: "0 18px", minHeight: "44px", cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
        {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
          <Link key={f} href={href(f)} style={{ ...filterChip(filter === f), textDecoration: "none" }}>
            {FILTER_LABEL[f]}
          </Link>
        ))}
        {filtered && (
          <Link href="/admin/experiences" style={{ ...filterChip(false), textDecoration: "none", color: C.blue }}>
            Clear
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: "16px", padding: "22px",
          boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
        }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
            {filtered ? "Nothing matches that." : "Nothing written down yet. The first one goes in the form above."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {rows.map((r) => <EntryCard key={r.id} row={r} viewer={viewer} now={midnight} />)}
        </div>
      )}

      {rows.length >= FEED && (
        <p style={{ fontFamily: F.read, fontSize: "14px", color: C.muted, textAlign: "center", marginTop: "18px" }}>
          The newest {FEED}. Search, or open a client, for anything older.
        </p>
      )}
    </div>
  );
}

const h2: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em",
  color: C.ink, margin: "0 0 12px",
};
