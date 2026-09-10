import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { DemoTable, type DemoRowT } from "@/components/admin/DemoTable";
import { getDemoRequests, usingSampleData } from "@/lib/admin-data";

const INK = "#10233F";

export const metadata = { title: "Demo requests — JOC Console" };

export default async function DemosPage() {
  return <AccountsGuard>{await Inner()}</AccountsGuard>;
}

async function Inner() {
  const demos = (await getDemoRequests()) as DemoRowT[];
  const waiting = demos.filter((d) => d.status === "NEW").length;

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Demo requests
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>
        Every booking from the landing page.{" "}
        {waiting > 0 ? (
          <strong style={{ color: "#C96C00" }}>{waiting} waiting for a reply.</strong>
        ) : (
          "Nothing waiting for a reply."
        )}{" "}
        Creating a school carries the requester across as the first contact.
      </p>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
        <DemoTable demos={demos} disabled={usingSampleData} />
      </div>
    </div>
  );
}
