import { DemosGuard } from "@/components/admin/Guard";
import { C } from "@/lib/joc-tokens";
import { DemoTable, type DemoRowT } from "@/components/admin/DemoTable";
import { MessagesPanel, type MessageRow } from "@/components/admin/MessagesPanel";
import { getDemoRequests, usingSampleData } from "@/lib/admin-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { PageIntro } from "@/components/admin/PageIntro";

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
  return <DemosGuard>{await Inner()}</DemosGuard>;
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
      <PageIntro
        title="Demo requests"
        what="Every school that has asked for a walkthrough, and every message sent through the contact form. This is the front door — if somebody is waiting here, nobody at JOC has replied to them yet."
        steps={[
          "Read the request. The school, who asked, and what they wrote are all in the row.",
          "Reply to them yourself, by email or phone — the console does not send the reply for you.",
          "Change the status to say where it stands: Contacted once you have written back, Booked once a walkthrough is in the diary, Closed if it came to nothing.",
          "If they are going ahead, press “Create school”. That opens a school account and carries the person who asked across as its first contact, so you do not retype anything.",
          "Contact-form messages are below. Tick one as handled once it has been answered.",
        ]}
        note="Nothing here is visible to the school. Statuses and notes are for the JOC team only."
      />
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 20px" }}>
        {waiting > 0 ? (
          <strong style={{ color: "#C96C00" }}>{waiting} waiting for a reply.</strong>
        ) : (
          "Nothing waiting for a reply."
        )}
      </p>

      <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden", marginBottom: "28px" }}>
        <DemoTable demos={demos} disabled={usingSampleData} />
      </div>

      <h2 style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: C.ink, margin: "0 0 4px" }}>
        Contact form
      </h2>
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 14px" }}>
        {unread > 0 ? (
          <strong style={{ color: "#C96C00" }}>{unread} unanswered.</strong>
        ) : (
          "Nothing unanswered."
        )}{" "}
        These used to be discarded on arrival — they are kept now whether or not mail is switched on.
      </p>

      <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
        <MessagesPanel messages={messages} disabled={usingSampleData} />
      </div>
    </div>
  );
}
