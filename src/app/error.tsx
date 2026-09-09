"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 26px", textAlign: "center" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "18px", backgroundColor: "#FDEEDA", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", fontSize: "28px" }}>
        ⚠
      </div>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.035em", color: "#10233F", marginBottom: "12px" }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "44ch", marginBottom: "32px" }}>
        An unexpected error occurred. If this keeps happening, please reach out to JOC Education support.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{ backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "13px 26px", border: "none", cursor: "pointer" }}
        >
          Try again
        </button>
        <Link href="/" style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "15px", borderRadius: "9999px", padding: "13px 26px", textDecoration: "none" }}>
          Go home
        </Link>
      </div>
      {error.digest && (
        <p style={{ marginTop: "24px", fontSize: "12px", color: "rgba(16,35,63,.35)", fontFamily: "monospace" }}>
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
