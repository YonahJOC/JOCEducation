import Link from "next/link";
import { getPublishedResources } from "@/lib/content";
import { getCycles } from "@/lib/cycle-data";
import { siteContent } from "@/lib/site-content";
import { safeAuth } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { ResourceLibrary } from "./ResourceLibrary";
import { sectionHeading, label, C, R } from "@/lib/joc-tokens";

export const metadata = { title: "Resources" };

/**
 * The real library. Counts come from what the Education Team has actually
 * published — an empty library says so rather than advertising a number
 * nobody can verify.
 */
export default async function ResourcesPage() {
  const [resources, session] = await Promise.all([getPublishedResources(), safeAuth()]);
  const canDownload = hasSiteAccess(session?.user);
  const cycles = (await getCycles()).map((x) => ({ slug: x.slug, theme: x.theme, num: x.num }));
  const c = await siteContent("resources");

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      <p style={{ ...label, color: C.orangeText, marginBottom: "10px" }}>
        {c.text("hero.eyebrow", "RESOURCE LIBRARY")}
      </p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: C.ink, marginBottom: "14px" }}>
        {c.text("hero.headline", "Everything for the classroom, all in one place.")}
      </h1>
      <p style={{ fontSize: "17px", color: C.muted, lineHeight: 1.6, maxWidth: "58ch", marginBottom: "16px" }}>
        {c.text(
          "hero.standfirst",
          "Worksheets, activities, posters, videos and source sheets — tied to the Chesed Cycles and included with any JOC Education subscription."
        )}
      </p>

      {!canDownload && (
        <div style={{ backgroundColor: C.panel, borderRadius: "14px", padding: "14px 20px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <p style={{ fontSize: "15px", color: C.ink, margin: 0 }}>
            <strong>Full access</strong> is included with any JOC Education subscription.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/login" style={{ backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "12px 20px", textDecoration: "none" }}>
              Sign in to download
            </Link>
            <Link href="/pricing" style={{ color: C.blue, fontWeight: 600, fontSize: "15px", borderRadius: R.chip, padding: "12px 20px", textDecoration: "none", border: "1px solid #2D46AF" }}>
              See plans
            </Link>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div style={{ backgroundColor: C.white, border: `1px dashed ${C.hairline}`, borderRadius: "22px", padding: "56px 32px", textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ ...sectionHeading, color: C.ink, margin: "0 0 10px" }}>
            {c.text("empty.heading", "The library is being built.")}
          </h2>
          <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, maxWidth: "52ch", margin: "0 auto" }}>
            {c.text(
              "empty.body",
              "The JOC Education team is preparing the first set of worksheets, activities and source sheets. They will appear here as they are published — nothing is hidden behind a paywall that is not yet ready."
            )}
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: "48px" }}>
          <ResourceLibrary resources={resources} cycles={cycles} canDownload={canDownload} />
        </div>
      )}

      <div style={{ backgroundColor: C.ink, borderRadius: "26px", padding: "44px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
        <div>
          <h2 style={{ ...sectionHeading, color: C.white, marginBottom: "8px" }}>Ready to access the full library?</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,.65)", maxWidth: "50ch", lineHeight: 1.55 }}>
            Every resource is included in any JOC Education subscription.
          </p>
        </div>
        <Link href="/pricing" style={{ backgroundColor: C.orange, color: C.ink, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
          See plans and pricing →
        </Link>
      </div>
    </div>
  );
}
