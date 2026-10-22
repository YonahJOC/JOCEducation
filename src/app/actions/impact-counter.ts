"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { readDoc } from "@/lib/lobby/store";
import { counterUnlocked } from "@/lib/counter/lock";
import { sanitizeDoc } from "@/lib/lobby/config";
import { DOC_ID } from "@/lib/lobby/store";

/**
 * The counter in the centre, pushing a group's work onto the lobby wall.
 *
 * What arrives is a change, never a total: a group has made four more
 * pizzas since the last time somebody pressed the button. The running
 * totals belong to the lobby document, which is also what the panel beside
 * this edits, so a number pushed from an iPad and a number typed by hand
 * are the same number in the same place.
 *
 * Two iPads can be at two tables in the same building. The write is
 * conditional on the version it read, so the second one to arrive is told
 * to try again rather than quietly overwriting the first — the danger here
 * is not a lost click, it is a lost group.
 */

export type Project = "pizzas" | "beds";

type Result =
  | { ok: true; total: number }
  | { ok: false; error: string };

const PROJECTS: Project[] = ["pizzas", "beds"];

/** As many goes as a busy afternoon could plausibly need, and no more. */
const TRIES = 5;

export async function submitToScreen(input: {
  project: Project;
  /** The change since this iPad last submitted. May be negative. */
  delta: number;
  /** Shown on the wall as "+4 pizzas from Bnei Akiva" when set. */
  groupName?: string;
}): Promise<Result> {
  if (!isDatabaseConfigured()) return { ok: false, error: "The database is not connected." };

  const session = await safeAuth();
  const me = session?.user;
  /**
   * Either the device typed the word, or the person is signed in and looks
   * after the lobby screen. The same two ways the page lets somebody in,
   * checked again here: a page that renders is not an authorisation, and
   * this is the call that moves a number on a wall.
   */
  const unlocked = await counterUnlocked();
  if (!openForReview && !unlocked && !can(me, "lobby")) {
    return { ok: false, error: "This counter is locked." };
  }

  if (!PROJECTS.includes(input.project)) return { ok: false, error: "That is not something we count." };

  const delta = Math.trunc(Number(input.delta));
  if (!Number.isFinite(delta)) return { ok: false, error: "That is not a number." };
  // Nothing to do, and saying so matters: a no-op must not replace the last
  // group's name on the wall with this one's.
  if (delta === 0) return { ok: false, error: "Nothing new to send yet." };
  // A whole afternoon of pizzas is not a thousand. A number this big is a
  // thumb on a key, and the wall is the wrong place to find that out.
  if (Math.abs(delta) > 500) return { ok: false, error: "That is more than a single session can add. Check the count." };

  const groupName = (input.groupName ?? "").replace(/\s+/g, " ").trim().slice(0, 48);

  for (let attempt = 0; attempt < TRIES; attempt++) {
    const current = await readDoc().catch(() => null);
    if (!current) return { ok: false, error: "The lobby screen could not be read." };

    const next = sanitizeDoc(current);
    const was = next.counters.values[input.project];
    // Never below nothing, however somebody got here.
    const total = Math.max(0, was + delta);
    next.counters.values[input.project] = total;
    next.version = current.version + 1;
    next.updatedAt = new Date().toISOString();

    const done = await prisma.lobbyDoc
      .updateMany({
        where: { id: DOC_ID, version: current.version },
        data: {
          version: next.version,
          data: next as unknown as object,
          updatedAt: new Date(),
          updatedById: me?.id ?? null,
        },
      })
      .catch(() => null);

    // Somebody else wrote between the read and the write. Read again and
    // apply the same change to their number, rather than to the stale one.
    if (!done || done.count !== 1) continue;

    await prisma.impactSubmit
      .create({
        data: {
          project: input.project,
          delta,
          total,
          groupName: groupName || null,
          byId: me?.id ?? null,
        },
      })
      .catch(() => null);

    revalidatePath("/lobby");
    revalidatePath("/admin/lobby");
    return { ok: true, total };
  }

  return { ok: false, error: "The screen was busy. Try that again." };
}

/** The last few pushes, for the console to show and for undoing a mistake. */
export async function recentSubmits(limit = 20) {
  if (!isDatabaseConfigured()) return [];
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "lobby")) return [];
  return prisma.impactSubmit
    .findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(100, Math.max(1, limit)),
      select: {
        id: true, project: true, delta: true, total: true,
        groupName: true, createdAt: true,
        by: { select: { name: true, email: true } },
      },
    })
    .catch(() => []);
}
