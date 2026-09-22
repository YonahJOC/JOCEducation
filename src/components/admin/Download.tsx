/**
 * "Download the answers" — a plain link, deliberately.
 *
 * The browser does the whole job: no fetch, no blob, no button that can sit
 * there spinning. If the person is not allowed the file, the route says so
 * rather than this component guessing.
 */
export function Download({ formId, label = "Download as a spreadsheet" }: { formId: string; label?: string }) {
  return (
    <a
      href={`/api/forms/${formId}/export`}
      download
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
        color: "#2D46AF", backgroundColor: "rgba(45,70,175,.08)",
        borderRadius: "9999px", padding: "9px 16px", minHeight: "40px",
        textDecoration: "none", marginBottom: "14px",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5v9m0 0L4.5 7M8 10.5 11.5 7M2 12.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </a>
  );
}
