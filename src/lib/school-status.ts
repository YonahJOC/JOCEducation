import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Where every school is up to, on one row.
 *
 * Eight questions JOC asks about a school over and over, each of which lived
 * somewhere different or nowhere at all: who paid, who sent their student
 * list, who runs it there, is the screen up, what is waiting to be approved,
 * when did we last speak, when did we last visit, is the store open.
 *
 * Answering them meant opening a school, then a subscription, then the
 * activity log, then asking somebody. This reads them together so the
 * question "which school needs us this week" has an answer on one screen.
 */

export type SchoolStatusRow = {
  id: string;
  name: string;
  status: string;

  /** 1. Paid. Granted access is not paid, and says so. */
  paid: {
    state: "paid" | "granted" | "overdue" | "trial" | "none";
    label: string;
    /** When the current period runs out, where there is one. */
    until: Date | null;
  };

  /** 2. The student list. */
  studentListAt: Date | null;

  /** 3. Who runs it at the school. */
  coordinator: { name: string; title: string | null; email: string | null; phone: string | null } | null;

  /** 4. The live screen in the building. */
  liveScreenAt: Date | null;

  /** 5. Hours waiting to be approved, and when that was last read. */
  unapproved: { hours: number | null; checkedAt: Date | null };

  /** 6 and 7. Talked to, and gone to. */
  lastConversation: { at: Date; kind: string; summary: string } | null;
  lastVisit: { at: Date; summary: string } | null;

  /** 8. The school store. */
  store: { openedAt: Date | null; orders: number; lastOrderAt: Date | null };
};

/** A conversation is something a person did, not an audit entry. */
const CONVERSATION = ["CALL", "EMAIL", "MEETING", "NOTE", "DEMO", "VISIT"] as const;

export async function getSchoolStatus(): Promise<SchoolStatusRow[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const rows = await prisma.school.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: {
        subscription: true,
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
        activities: {
          where: { type: { in: [...CONVERSATION] } },
          orderBy: { occurredAt: "desc" },
          take: 40,
        },
        orders: { orderBy: { createdAt: "desc" }, select: { createdAt: true } },
      },
    });

    return rows.map((s) => {
      const sub = s.subscription;
      const paid: SchoolStatusRow["paid"] =
        !sub
          ? { state: "none", label: "No plan", until: null }
          : sub.grantedManually
          ? { state: "granted", label: grantLabel(sub.grantKind), until: sub.currentPeriodEnd }
          : sub.status === "PAST_DUE"
          ? { state: "overdue", label: "Payment overdue", until: sub.currentPeriodEnd }
          : sub.status === "TRIALING"
          ? { state: "trial", label: "On trial", until: sub.currentPeriodEnd }
          : sub.status === "ACTIVE"
          ? { state: "paid", label: "Paid", until: sub.currentPeriodEnd }
          : { state: "none", label: String(sub.status).toLowerCase(), until: sub.currentPeriodEnd };

      const conversation = s.activities[0] ?? null;
      const visit = s.activities.find((a) => a.type === "VISIT") ?? null;
      const c = s.contacts[0] ?? null;

      return {
        id: s.id,
        name: s.name,
        status: s.status,
        paid,
        studentListAt: s.studentListAt,
        coordinator: c ? { name: c.name, title: c.title, email: c.email, phone: c.phone } : null,
        liveScreenAt: s.liveScreenAt,
        unapproved: { hours: s.unapprovedHours, checkedAt: s.unapprovedCheckedAt },
        lastConversation: conversation
          ? { at: conversation.occurredAt, kind: conversation.type, summary: conversation.summary }
          : null,
        lastVisit: visit ? { at: visit.occurredAt, summary: visit.summary } : null,
        store: {
          openedAt: s.storeOpenAt,
          orders: s.orders.length,
          lastOrderAt: s.orders[0]?.createdAt ?? null,
        },
      };
    });
  } catch {
    return [];
  }
}

function grantLabel(kind: string | null): string {
  if (kind === "SCHOLARSHIP") return "Scholarship";
  if (kind === "PILOT") return "Pilot";
  if (kind === "COMP") return "Comped";
  return "Granted";
}

/**
 * How stale a reading is, in plain words.
 *
 * Used on the hours figure, which comes from the JOC App by somebody typing
 * it in. A number with no age is a number that gets trusted long after it
 * stopped being true.
 */
export function staleness(at: Date | null): { text: string; stale: boolean } {
  if (!at) return { text: "never checked", stale: true };
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000);
  if (days <= 0) return { text: "checked today", stale: false };
  if (days === 1) return { text: "checked yesterday", stale: false };
  if (days < 14) return { text: `checked ${days} days ago`, stale: false };
  if (days < 60) return { text: `checked ${Math.floor(days / 7)} weeks ago`, stale: true };
  return { text: `checked ${Math.floor(days / 30)} months ago`, stale: true };
}
