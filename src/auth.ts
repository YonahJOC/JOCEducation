import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  initialRoleFor, isStaffEmail, isSuperAdminEmail,
  emailDomain, isConsumerEmail,
} from "@/lib/access";

/**
 * Two ways in.
 *
 *   Google      — the intended long-term method. Needs AUTH_GOOGLE_ID and
 *                 AUTH_GOOGLE_SECRET; absent those it simply is not offered.
 *   Password    — interim, so the JOC team can use the site before Google
 *                 Cloud is set up. Accounts are created by a super admin;
 *                 there is no public password signup, because without email
 *                 verification anyone could otherwise claim a JOC address.
 *
 * Sessions are JWT rather than database-backed: the Credentials provider
 * requires it. Role and school are refreshed from the database periodically
 * so a role change takes effect without signing out.
 *
 * Anyone with a @justonechesed.org address is JOC staff — full free access to
 * the site, no ability to change anyone's account. See src/lib/access.ts.
 */

export const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

/** Password sign-in needs only a database and a signing secret. */
export const isPasswordConfigured = Boolean(
  isDatabaseConfigured() && process.env.AUTH_SECRET
);

export const isAuthConfigured = isPasswordConfigured || Boolean(
  isGoogleConfigured && process.env.AUTH_SECRET && isDatabaseConfigured()
);

/** How long before the JWT re-reads role and school from the database. */
const REFRESH_MS = 5 * 60 * 1000;

const providers: NextAuthConfig["providers"] = [];

if (isGoogleConfigured) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { prompt: "select_account", scope: "openid email profile" } },
    })
  );
}

if (isPasswordConfigured) {
  providers.push(
    Credentials({
      id: "password",
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Same failure for "no such user" and "wrong password", so the form
        // cannot be used to discover which addresses have accounts.
        if (!user || !user.passwordHash || !user.active) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    })
  );
}

const config: NextAuthConfig = {
  adapter: isDatabaseConfigured() ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/", error: "/" },
  providers,

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role ?? "TEACHER";
        token.schoolId = (user as { schoolId?: string | null }).schoolId ?? null;
        token.refreshedAt = Date.now();
      }

      const stale = Date.now() - Number(token.refreshedAt ?? 0) > REFRESH_MS;
      if ((stale || trigger === "update") && token.uid && isDatabaseConfigured()) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: String(token.uid) },
            select: { role: true, schoolId: true, active: true, mustChangePassword: true },
          });
          if (fresh) {
            token.role = fresh.role;
            token.schoolId = fresh.schoolId;
            token.mustChangePassword = fresh.mustChangePassword;
            token.suspended = !fresh.active;
          }
          token.refreshedAt = Date.now();
        } catch {
          // Keep the existing claims rather than signing someone out.
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;

      session.user.id = String(token.uid ?? "");
      session.user.role = String(token.role ?? "TEACHER");
      session.user.schoolId = (token.schoolId as string | null) ?? null;
      session.user.mustChangePassword = Boolean(token.mustChangePassword);

      const staffEmail = isStaffEmail(session.user.email);
      session.user.isStaff = staffEmail;

      // A JOC address always resolves to at least STAFF, even if the stored
      // row is stale. It never grants ADMIN — that is assigned by hand.
      if (staffEmail && (!session.user.role || session.user.role === "TEACHER")) {
        session.user.role = "STAFF";
      }
      if (isSuperAdminEmail(session.user.email)) session.user.role = "SUPER_ADMIN";

      return session;
    },
  },

  events: {
    /**
     * First Google sign-in. Sets the role, and joins the user to a school if
     * their email domain matches one a school has registered. Password
     * accounts are created by an admin, so they skip this.
     */
    async createUser({ user }) {
      if (!isDatabaseConfigured()) return;
      const role = initialRoleFor(user.email);

      let schoolId: string | null = null;
      if (!isStaffEmail(user.email) && !isConsumerEmail(user.email)) {
        const domain = emailDomain(user.email);
        if (domain) {
          try {
            const school = await prisma.school.findFirst({
              where: { emailDomains: { has: domain } },
              select: { id: true },
            });
            schoolId = school?.id ?? null;
          } catch {
            // Convenience only — never block sign-in on it.
          }
        }
      }

      if (role === "TEACHER" && !schoolId) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { ...(role !== "TEACHER" ? { role } : {}), ...(schoolId ? { schoolId } : {}) },
        });
      } catch {
        // The session callback still resolves staff by email.
      }
    },

    /**
     * Every sign-in: note when, and consume any invitation waiting for this
     * address. Without this an invitation is created and then does nothing —
     * the person signs in and lands nowhere.
     */
    async signIn({ user }) {
      if (!isDatabaseConfigured() || !user.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });
      } catch {
        // Never block sign-in on bookkeeping.
      }

      if (!user.email) return;
      try {
        const invite = await prisma.invitation.findFirst({
          where: {
            email: user.email.toLowerCase(),
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (!invite) return;

        const current = await prisma.user.findUnique({
          where: { id: user.id },
          select: { schoolId: true, role: true },
        });
        // Never demote someone who already holds a higher role.
        const keepRole = current?.role === "ADMIN" || current?.role === "SUPER_ADMIN" || current?.role === "STAFF";

        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: {
              schoolId: current?.schoolId ?? invite.schoolId,
              ...(keepRole ? {} : { role: invite.role }),
            },
          }),
          prisma.invitation.update({
            where: { id: invite.id },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
          }),
          prisma.schoolActivity.create({
            data: {
              schoolId: invite.schoolId,
              type: "ACCESS_GRANTED",
              summary: `${user.email} accepted their invitation`,
              authorId: null,
            },
          }),
        ]);
      } catch {
        // An unconsumed invitation is recoverable; a failed sign-in is not.
      }
    },
  },
};

const nextAuth = NextAuth(config);

export const { auth, signIn, signOut } = nextAuth;
export const { GET, POST } = nextAuth.handlers;

/**
 * `auth()` throws when AUTH_SECRET is missing, which is the normal state
 * before credentials are configured. Use this for "who is signed in, if
 * anyone" reads that must not blow up.
 */
export async function safeAuth() {
  if (!isAuthConfigured) return null;
  try {
    return await auth();
  } catch {
    return null;
  }
}
