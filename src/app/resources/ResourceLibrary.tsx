"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { PublicResource } from "@/lib/content";

const TAG_COLORS: Record<string, string> = {
  "Worksheet": "#2D46AF",
  "Activity": "#2C7AC9",
  "Design": "#FA912D",
  "Video": "#10233F",
  "Source sheet": "#1B7F4B",
};
const FALLBACK_COLOR = "#2D46AF";

/** Three letters for the coloured square, from whatever the category is called. */
function abbrev(tag: string) {
  return tag.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
}

export function ResourceLibrary({
  resources, cycles, canDownload,
}: {
  resources: PublicResource[];
  cycles: { slug: string; theme: string; num: number }[];
  canDownload: boolean;
}) {
  const [tag, setTag] = useState("All");
  const [cycle, setCycle] = useState("all");
  const [query, setQuery] = useState("");

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of resources) counts.set(r.tag, (counts.get(r.tag) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (tag !== "All" && r.tag !== tag) return false;
      if (cycle !== "all" && r.cycleSlug !== cycle) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [resources, tag, cycle, query]);

  const cycleName = (slug: string | null) => {
    if (!slug) return null;
    const c = cycles.find((x) => x.slug === slug);
    return c ? `Cycle ${c.num} · ${c.theme}` : null;
  };

  return (
    <>
      {/* Counts by category, from what is actually published */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "28px", padding: "22px 28px", backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)" }}>
        {tags.map(([t, n]) => (
          <div key={t} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", backgroundColor: TAG_COLORS[t] ?? FALLBACK_COLOR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em" }}>{abbrev(t)}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#10233F" }}>{n}</div>
              <div style={{ fontSize: "12px", color: "rgba(16,35,63,.5)" }}>{t.toLowerCase()}{n === 1 ? "" : "s"}</div>
            </div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: "24px", letterSpacing: "-0.04em", color: "#10233F", alignSelf: "center" }}>
          {resources.length}
          <span style={{ fontWeight: 500, fontSize: "14px", color: "rgba(16,35,63,.5)", letterSpacing: 0 }}> total</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "20px 24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources…"
          style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", fontSize: "15px", color: "#10233F", backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.15)", borderRadius: "12px", outline: "none", fontFamily: "var(--font-outfit)", minHeight: "44px" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <Chip label="All" active={tag === "All"} onClick={() => setTag("All")} />
          {tags.map(([t]) => (
            <Chip key={t} label={t} active={tag === t} onClick={() => setTag(t)} />
          ))}
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            style={{ marginLeft: "auto", fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: "#10233F", backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.2)", borderRadius: "9999px", padding: "9px 14px", minHeight: "44px", cursor: "pointer" }}
          >
            <option value="all">Every Chesed Cycle</option>
            {cycles.map((c) => (
              <option key={c.slug} value={c.slug}>Cycle {c.num} — {c.theme}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p style={{ fontSize: "16px", color: "rgba(16,35,63,.55)", textAlign: "center", padding: "56px 0" }}>
          Nothing matches those filters.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map((r) => {
            const color = TAG_COLORS[r.tag] ?? FALLBACK_COLOR;
            const cn = cycleName(r.cycleSlug);
            return (
              <div key={r.id} style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "9px", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: "9.5px", letterSpacing: "0.05em" }}>{abbrev(r.tag)}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.5)" }}>{r.tag}</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: "17.5px", lineHeight: 1.25, letterSpacing: "-0.02em", color: "#10233F", margin: 0 }}>{r.title}</h2>
                <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.55, margin: 0, flex: 1 }}>{r.description}</p>
                {cn && (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#C96C00" }}>{cn}</span>
                )}
                <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "12px" }}>
                  {!canDownload ? (
                    <Link href="/login" style={{ fontWeight: 700, fontSize: "14px", color: "#2D46AF", textDecoration: "none" }}>
                      Sign in to download →
                    </Link>
                  ) : r.fileUrl ? (
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: "14px", color: "#2D46AF", textDecoration: "none" }}>
                      Download →
                    </a>
                  ) : (
                    <span style={{ fontSize: "13.5px", color: "rgba(16,35,63,.45)" }}>File coming soon</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13.5px", padding: "9px 16px", minHeight: "44px", borderRadius: "9999px", border: active ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: active ? "#10233F" : "#fff", color: active ? "#fff" : "#10233F", cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {label}
    </button>
  );
}
