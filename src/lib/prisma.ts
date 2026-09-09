import { PrismaClient } from "@prisma/client";

/**
 * Lazily constructed Prisma client.
 *
 * PrismaClient throws at construction when DATABASE_URL is missing, so the
 * client is only built on first actual use. That keeps the app importable —
 * and buildable — before Supabase is connected.
 */

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not set. Connect Supabase before using the database."
    );
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

/** Proxy so `prisma.user.findMany()` reads naturally while staying lazy. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
