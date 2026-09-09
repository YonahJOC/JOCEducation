import { getDemoRequests } from "@/lib/admin-data";

const INK = "#10233F";

export const metadata = { title: "Demo requests — JOC Console" };

const STATUS_COLOR: Record<string, string> = {
  NEW: "#FA912D", CONTACTED: "#2C7AC9", SCHEDULED: "#2D46AF",
  COMPLETED: "#1B7F4B", CONVERTED: "#1B7F4B", LOST: "#7A8699",
};

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

export default async function DemosPage() {
  const demos = await getDemoRequests();
  const isNew = demos.filter((d) => d.status === "NEW");

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Demo requests
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 22px" }}>
        Every booking from the landing page scheduler. {isNew.length} waiting for a reply.
      </p>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
        {demos.length === 0 ? (
          <p style={{ padding: "24px 20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>
            No demo requests yet. They arrive here when someone books on the landing page.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "680px" }}>
              <thead>
                <tr>
                  {["Who", "School", "Requested slot", "Received", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demos.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                      <span style={{ fontWeight: 600, color: INK, display: "block" }}>{r.name}</span>
                      <a href={`mailto:${r.email}`} style={{ fontSize: "12.5px", color: "#2D46AF", textDecoration: "none", wordBreak: "break-all" }}>
                        {r.email}
                      </a>
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)" }}>
                      {r.schoolName ?? "—"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)", whiteSpace: "nowrap" }}>
                      {fmt(r.requestedFor)}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.6)", whiteSpace: "nowrap" }}>
                      {fmt(r.createdAt)}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                      <span style={{ display: "inline-block", fontSize: "11.5px", fontWeight: 700, padding: "3px 10px", borderRadius: "9999px", color: STATUS_COLOR[r.status], backgroundColor: `${STATUS_COLOR[r.status]}1a`, whiteSpace: "nowrap" }}>
                        {r.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
