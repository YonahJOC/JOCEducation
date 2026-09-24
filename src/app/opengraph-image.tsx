import { ImageResponse } from "next/og";
import { C } from "@/lib/joc-tokens";

export const runtime = "nodejs";
export const alt = "JOC Education — Educating Towards Chesed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          backgroundColor: C.ink,
          fontFamily: "sans-serif",
        }}
      >
        {/* Orange accent bar */}
        <div style={{ display: "flex", width: "64px", height: "6px", backgroundColor: C.orange, borderRadius: "3px", marginBottom: "28px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: C.orange }}>
            JOC EDUCATION
          </div>
          <div style={{ fontSize: "64px", fontWeight: 800, color: C.white, lineHeight: 1.05, letterSpacing: "-0.04em", maxWidth: "14ch" }}>
            Educating Towards Chesed.
          </div>
          <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, maxWidth: "52ch" }}>
            Lesson plans, programs, and resources for Jewish day schools — Just One Student at a Time.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: C.white, fontWeight: 900, fontSize: "22px" }}>J</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", fontWeight: 500 }}>
            education.justonechesed.org
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
