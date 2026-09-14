"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hasSiteAccess, canManageContent } from "@/lib/access";

/**
 * The staff room.
 *
 * Anyone signed in with live access can read and post. Nothing waits for
 * approval — a conversation that has to be approved before anyone sees it is
 * not a conversation. The education team can remove a message; so can whoever
 * wrote it.
 */

type Result = { ok: true } | { ok: false; error: string };

async function requireMember() {
  const session = await safeAuth();
  if (!session?.user?.id) return null;
  if (!hasSiteAccess(session.user)) return null;
  return session.user;
}

export async function postMessage(input: {
  roomId: string;
  body: string;
  parentId?: string | null;
}): Promise<Result> {
  const user = await requireMember();
  if (!user) return { ok: false, error: "Sign in to join the conversation." };
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  const body = input.body.trim();
  if (!body) return { ok: false, error: "Write something first." };
  if (body.length > 5000) return { ok: false, error: "That is longer than a message should be." };

  try {
    const room = await prisma.room.findUnique({
      where: { id: input.roomId },
      select: { id: true, slug: true, archived: true },
    });
    if (!room) return { ok: false, error: "That room no longer exists." };
    if (room.archived) return { ok: false, error: "This room is closed to new messages." };

    // A reply must belong to the room it claims, and cannot reply to a reply.
    let parentId: string | null = null;
    if (input.parentId) {
      const parent = await prisma.roomMessage.findUnique({
        where: { id: input.parentId },
        select: { id: true, roomId: true, parentId: true },
      });
      if (!parent || parent.roomId !== room.id) {
        return { ok: false, error: "That message is not in this room." };
      }
      parentId = parent.parentId ?? parent.id;
    }

    await prisma.roomMessage.create({
      data: { roomId: room.id, userId: user.id, body, parentId },
    });

    // Posting counts as having read it.
    await prisma.roomMember.upsert({
      where: { userId_roomId: { userId: user.id, roomId: room.id } },
      create: { userId: user.id, roomId: room.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });

    revalidatePath(`/rooms/${room.slug}`);
    revalidatePath("/rooms");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not post that. Please try again." };
  }
}

export async function removeMessage(messageId: string): Promise<Result> {
  const user = await requireMember();
  if (!user) return { ok: false, error: "Sign in first." };

  try {
    const message = await prisma.roomMessage.findUnique({
      where: { id: messageId },
      select: { id: true, userId: true, room: { select: { slug: true } } },
    });
    if (!message) return { ok: false, error: "That message is already gone." };

    const mine = message.userId === user.id;
    if (!mine && !canManageContent(user)) {
      return { ok: false, error: "You can only remove your own messages." };
    }

    // Kept as a tombstone so a thread does not lose its shape.
    await prisma.roomMessage.update({
      where: { id: messageId },
      data: { removed: true, removedBy: mine ? "author" : "moderator" },
    });

    revalidatePath(`/rooms/${message.room.slug}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove that." };
  }
}

/** Follow or unfollow a room. Following is what puts it on your home page. */
export async function toggleRoomMembership(roomId: string): Promise<
  { ok: true; joined: boolean } | { ok: false; error: string }
> {
  const user = await requireMember();
  if (!user) return { ok: false, error: "Sign in first." };

  try {
    const existing = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    });

    if (existing) {
      await prisma.roomMember.delete({ where: { userId_roomId: { userId: user.id, roomId } } });
    } else {
      await prisma.roomMember.create({ data: { userId: user.id, roomId } });
    }

    revalidatePath("/rooms");
    return { ok: true, joined: !existing };
  } catch {
    return { ok: false, error: "Could not save that." };
  }
}

/** Mark a room read up to now. */
export async function markRoomRead(roomId: string): Promise<Result> {
  const user = await requireMember();
  if (!user) return { ok: false, error: "Sign in first." };
  try {
    await prisma.roomMember.upsert({
      where: { userId_roomId: { userId: user.id, roomId } },
      create: { userId: user.id, roomId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save that." };
  }
}

// ─── Running the rooms — education team and above ────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function saveRoom(input: {
  id?: string;
  name: string;
  description: string;
  icon: string;
  cycleSlug?: string | null;
  archived: boolean;
  sort: number;
}): Promise<Result> {
  const session = await safeAuth();
  if (!canManageContent(session?.user)) {
    return { ok: false, error: "You need educational team access to change the rooms." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "A room needs a name." };

  try {
    const slug = slugify(name);
    const clash = await prisma.room.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== input.id) {
      return { ok: false, error: "There is already a room with that name." };
    }

    const data = {
      slug,
      name,
      description: input.description.trim(),
      icon: input.icon.trim() || "💬",
      cycleSlug: input.cycleSlug || null,
      archived: input.archived,
      sort: Number(input.sort) || 0,
    };

    if (input.id) await prisma.room.update({ where: { id: input.id }, data });
    else await prisma.room.create({ data });

    revalidatePath("/rooms");
    revalidatePath("/admin/rooms");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save that room." };
  }
}

export async function deleteRoom(id: string): Promise<Result> {
  const session = await safeAuth();
  if (!canManageContent(session?.user)) {
    return { ok: false, error: "You need educational team access to remove a room." };
  }
  try {
    await prisma.room.delete({ where: { id } });
    revalidatePath("/rooms");
    revalidatePath("/admin/rooms");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove that room." };
  }
}
