import Link from "next/link";
import { getPublishedResources } from "@/lib/content";
import { CYCLES } from "@/lib/cycles";
import { safeAuth } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { ResourceLibrary } from "./ResourceLibrary";

export const metadata = { title: "Resources" };

/**
 * The real library. Counts come from what the Education Team has actually
 * published — an empty library says so rather than advertising a number
 * nobody can verify.
 */
export default async function ResourcesPage() {
  const [resources, session] = await Promise.all([getPublishedResources(), safeAuth()]);
  const canDownload = hasSiteAccess(session?.user);
  const cycles = CYCLES.map((c) => ({ slug: c.slug, theme: c.theme, num: c.num }));

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>RESOURCE LIBRARY</p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "14px" }}>
        Everything for the classroom,<br />all in one place.
      </h1>
      <p style={{ fontSize: "17px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "58ch", marginBottom: "16px" }}>
        Worksheets, activities, posters, videos and source sheets — tied to the Chesed Cycles and
        included with any JOC Education subscription.
      </p>

      {!canDownload && (
        <div style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "14px 20px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <p style={{ fontSize: "14.5px", color: "#10233F", margin: 0 }}>
            <strong>Full access</strong> is included with any JOC Education subscription.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/login" style={{ backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "13.5px", borderRadius: "9999px", padding: "12px 20px", textDecoration: "none" }}>
              Sign in to download
            </Link>
            <Link href="/pricing" style={{ color: "#2D46AF", fontWeight: 600, fontSize: "13.5px", borderRadius: "9999px", padding: "12px 20px", textDecoration: "none", border: "1px solid #2D46AF" }}>
              See plans
            </Link>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "22px", padding: "56px 32px", textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontWeight: 700, fontSize: "21px", color: "#10233F", margin: "0 0 10px" }}>
            The library is being built.
          </h2>
          <p style={{ fontSize: "15.5px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "52ch", margin: "0 auto" }}>
            The JOC Education team is preparing the first set of worksheets, activities and source
            sheets. They will appear here as they are published — nothing is hidden behind a
            paywall that is not yet ready.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: "48px" }}>
          <ResourceLibrary resources={resources} cycles={cycles} canDownload={canDownload} />
        </div>
      )}

      <div style={{ backgroundColor: "#10233F", borderRadius: "26px", padding: "44px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "26px", color: "#fff", marginBottom: "8px" }}>Ready to access the full library?</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,.65)", maxWidth: "50ch", lineHeight: 1.55 }}>
            Every resource is included in any JOC Education subscription.
          </p>
        </div>
        <Link href="/pricing" style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
          See plans and pricing →
        </Link>
      </div>
    </div>
  );
}
