"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageUsers, CAPABILITIES, type Capability } from "@/lib/access";

/**
 * Admin types — who can do what in the console.
 *
 * This is the one place that can take everybody's access away, so it is the
 * one place with real guard rails:
 *
 *   - Only somebody who already holds "People and access" can change any of
 *     it. That capability is deliberately the keys to everything else.
 *   - The super admin role always holds every capability, and the checkboxes
 *     that would take one away are refused here as well as hidden there.
 *   - A role with people in it cannot be deleted. Move them first, so nobody
 *     silently loses access because a row disappeared.
 *   - Nobody can take away their own "People and access" — that is the one
 *     mistake with no way back.
 */

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function requireUserManager() {
  const session = await safeAuth();
  if (!openForReview && !canManageUsers(session?.user)) {
    throw new Error("Only someone with People and access can change admin types");
  }
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  return session?.user ?? null;
}

function cleanCapabilities(values: string[]): Capability[] {
  const allowed = new Set<string>(CAPABILITIES);
  return [...new Set(values.filter((v) => allowed.has(v)))] as Capability[];
}

export async function saveAdminRole(input: {
  id?: string;
  name: string;
  description?: string;
  capabilities: string[];
}): Promise<Result> {
  try {
    const me = await requireUserManager();

    const name = input.name.trim();
    if (!name) return { ok: false, error: "Give this admin type a name." };

    const capabilities = cleanCapabilities(input.capabilities);

    const existing = input.id
      ? await prisma.adminRole.findUnique({ where: { id: input.id } })
      : null;
    if (input.id && !existing) return { ok: false, error: "That admin type no longer exists." };

    // The super admin role is the way back from every other mistake here.
    if (existing?.isSuperAdmin && capabilities.length < CAPABILITIES.length) {
      return {
        ok: false,
        error: "Super admin has to keep every permission — it is what lets you undo everything else.",
      };
    }

    // You may not remove your own access to this page.
    if (
      existing &&
      !capabilities.includes("users") &&
      me?.id &&
      (await prisma.user.count({ where: { id: me.id, adminRoleId: existing.id } })) > 0
    ) {
      return {
        ok: false,
        error: "This is your own admin type — removing People and access would lock you out of this page.",
      };
    }

    const clash = await prisma.adminRole.findFirst({
      where: { name, ...(input.id ? { id: { not: input.id } } : {}) },
      select: { id: true },
    });
    if (clash) return { ok: false, error: "An admin type with that name already exists." };

    const data = {
      name,
      description: input.description?.trim() || null,
      capabilities,
    };

    const saved = existing
      ? await prisma.adminRole.update({
          where: { id: existing.id },
          // A built-in keeps its name; only its permissions and description move.
          data: existing.builtIn ? { description: data.description, capabilities } : data,
          select: { id: true },
        })
      : await prisma.adminRole.create({
          data: { ...data, sort: ((await prisma.adminRole.aggregate({ _max: { sort: true } }))._max.sort ?? 0) + 1 },
          select: { id: true },
        });

    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { ok: true, id: saved.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that admin type." };
  }
}

export async function deleteAdminRole(id: string): Promise<Result> {
  try {
    await requireUserManager();
    const role = await prisma.adminRole.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!role) return { ok: false, error: "That admin type no longer exists." };
    if (role.builtIn) {
      return { ok: false, error: "The four built-in types cannot be deleted. Change what they can do instead." };
    }
    if (role._count.members > 0) {
      return {
        ok: false,
        error: `${role._count.members} ${role._count.members === 1 ? "person holds" : "people hold"} this type. Move them to another one first.`,
      };
    }

    await prisma.adminRole.delete({ where: { id } });
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not remove that admin type." };
  }
}

/** Give one person an admin type, or take it away with an empty id. */
export async function setUserAdminRole(userId: string, adminRoleId: string | null): Promise<Result> {
  try {
    const me = await requireUserManager();

    if (me?.id === userId && adminRoleId) {
      const target = await prisma.adminRole.findUnique({
        where: { id: adminRoleId },
        select: { capabilities: true, isSuperAdmin: true },
      });
      if (target && !target.isSuperAdmin && !target.capabilities.includes("users")) {
        return {
          ok: false,
          error: "That would take away your own access to this page. Ask another super admin to do it.",
        };
      }
    }

    await prisma.user.update({ where: { id: userId }, data: { adminRoleId } });
    revalidatePath("/admin/users");
    revalidatePath("/admin/roles");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not change that person's admin type." };
  }
}
