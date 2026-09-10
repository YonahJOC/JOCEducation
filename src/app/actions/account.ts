"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword, verifyPassword, passwordProblem } from "@/lib/password";

/**
 * A person's own account. Nothing here touches anyone else's.
 */

type Result = { ok: true } | { ok: false; error: string };

export async function changeOwnPassword(input: {
  current: string;
  next: string;
  confirm: string;
}): Promise<Result> {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) return { ok: false, error: "Sign in first" };
    if (!isDatabaseConfigured()) return { ok: false, error: "Database not connected" };

    if (input.next !== input.confirm) return { ok: false, error: "The two new passwords do not match" };

    const problem = passwordProblem(input.next);
    if (problem) return { ok: false, error: problem };

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!me) return { ok: false, error: "Account not found" };

    // Someone who signed in with Google has no password to confirm against.
    if (me.passwordHash) {
      const ok = await verifyPassword(input.current, me.passwordHash);
      if (!ok) return { ok: false, error: "That is not your current password" };
      if (input.current === input.next) return { ok: false, error: "That is the password you already have" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await hashPassword(input.next), mustChangePassword: false },
    });

    revalidatePath("/account/password");
    revalidatePath("/home");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateOwnName(name: string): Promise<Result> {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) return { ok: false, error: "Sign in first" };
    if (!isDatabaseConfigured()) return { ok: false, error: "Database not connected" };
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() || null },
    });
    revalidatePath("/account/password");
    revalidatePath("/home");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
