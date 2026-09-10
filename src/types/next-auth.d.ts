import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      schoolId: string | null;
      /** True for @justonechesed.org addresses — full access, no subscription. */
      isStaff: boolean;
      /** Set when an admin issued a temporary password. */
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    schoolId?: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
    schoolId?: string | null;
    mustChangePassword?: boolean;
    suspended?: boolean;
    refreshedAt?: number;
  }
}

export {};
