import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { DemoTable, type DemoRowT } from "@/components/admin/DemoTable";
import { MessagesPanel, type MessageRow } from "@/components/admin/MessagesPanel";
import { getDemoRequests, usingSampleData } from "@/lib/admin-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const INK = "#10233F";

export const metadata = { title: "Demo requests — JOC Console" };

function when(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

async function getMessages(): Promise<MessageRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.contactMessage.findMany({
      orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      schoolName: m.schoolName,
      role: m.role,
      subject: m.subject,
      message: m.message,
      handled: m.handled,
      emailed: m.emailed,
      when: when(m.createdAt),
    }));
  } catch {
    return [];
  }
}

export default async function DemosPage() {
  return <AccountsGuard>{await Inner()}</AccountsGuard>;
}

async function Inner() {
  const [demos, messages] = await Promise.all([
    getDemoRequests() as Promise<DemoRowT[]>,
    getMessages(),
  ]);
  const waiting = demos.filter((d) => d.status === "NEW").length;
  const unread = messages.filter((m) => !m.handled).length;

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

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden", marginBottom: "28px" }}>
        <DemoTable demos={demos} disabled={usingSampleData} />
      </div>

      <h2 style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Contact form
      </h2>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 14px" }}>
        {unread > 0 ? (
          <strong style={{ color: "#C96C00" }}>{unread} unanswered.</strong>
        ) : (
          "Nothing unanswered."
        )}{" "}
        These used to be discarded on arrival — they are kept now whether or not mail is switched on.
      </p>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
        <MessagesPanel messages={messages} disabled={usingSampleData} />
      </div>
    </div>
  );
}
