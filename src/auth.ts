import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { initialRoleFor, isStaffEmail, isSuperAdminEmail } from "@/lib/access";

/**
 * Google sign-in.
 *
 * Everything degrades gracefully: with no AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
 * / DATABASE_URL the app still builds and runs, `auth()` simply returns null
 * and the sign-in card explains that sign-in is not switched on yet.
 *
 * Anyone signing in with a @justonechesed.org address is JOC staff — created
 * as ADMIN (or SUPER_ADMIN if listed in SUPER_ADMIN_EMAILS) and given full
 * access to the whole site with no subscription. See src/lib/access.ts.
 */

export const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const isAuthConfigured = Boolean(
  isGoogleConfigured && process.env.AUTH_SECRET && isDatabaseConfigured()
);

const config: NextAuthConfig = {
  // The adapter needs a live database; without one, sign-in stays off.
  adapter: isDatabaseConfigured() ? PrismaAdapter(prisma) : undefined,
  session: { strategy: isDatabaseConfigured() ? "database" : "jwt" },
  trustHost: true,

  // The educator landing page is the sign-in page.
  pages: { signIn: "/", error: "/" },

  providers: isGoogleConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          // Google verifies the address, so linking to an existing user with
          // the same email is safe and avoids duplicate accounts.
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: { prompt: "select_account", scope: "openid email profile" },
          },
        }),
      ]
    : [],

  callbacks: {
    async session({ session, user }) {
      if (!session.user) return session;

      // Database strategy hands us the persisted user; that role is the truth.
      if (user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? "TEACHER";
        session.user.schoolId = (user as { schoolId?: string | null }).schoolId ?? null;
      }

      const staffEmail = isStaffEmail(session.user.email);
      session.user.isStaff = staffEmail;

      // A JOC address guarantees STAFF — free access to everything — even if
      // the stored row is stale or the database is unreachable. It never
      // grants ADMIN: that is assigned by a super admin, so an existing
      // higher role is left alone and never downgraded here.
      if (staffEmail && !session.user.role) session.user.role = "STAFF";
      if (staffEmail && session.user.role === "TEACHER") session.user.role = "STAFF";

      // Bootstrap: the configured owners are always super admins.
      if (isSuperAdminEmail(session.user.email)) session.user.role = "SUPER_ADMIN";

      return session;
    },
  },

  events: {
    /**
     * Stamp the right role on first sign-in. The adapter creates everyone as
     * TEACHER; a @justonechesed.org address becomes STAFF (free access to
     * everything, no ability to change anything). ADMIN is never automatic.
     */
    async createUser({ user }) {
      const role = initialRoleFor(user.email);
      if (role === "TEACHER" || !isDatabaseConfigured()) return;
      try {
        await prisma.user.update({ where: { id: user.id }, data: { role } });
      } catch {
        // Non-fatal: the session callback still resolves staff by email.
      }
    },

    async signIn({ user }) {
      if (!isDatabaseConfigured() || !user.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });
      } catch {
        // Never block sign-in on a bookkeeping write.
      }
    },
  },
};

const nextAuth = NextAuth(config);

export const { auth, signIn, signOut } = nextAuth;
export const { GET, POST } = nextAuth.handlers;

/**
 * `auth()` throws when AUTH_SECRET is missing, which is the normal state
 * before credentials are configured. Callers that just want "who is signed in,
 * if anyone" should use this instead.
 */
export async function safeAuth() {
  if (!isAuthConfigured) return null;
  try {
    return await auth();
  } catch {
    return null;
  }
}
