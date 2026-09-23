import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      schoolId: string | null;
      /** Runs their school's JOC App — see canRunSchoolApp. */
      schoolAppAdmin?: boolean;
      /** True for @justonechesed.org addresses — full access, no subscription. */
      isStaff: boolean;
      /** Set when an admin issued a temporary password. */
      mustChangePassword: boolean;
      /**
       * What their admin role lets them do. Null means they hold no admin
       * role, and access falls back to the built-in default for their role.
       */
      capabilities: string[] | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    schoolId?: string | null;
    schoolAppAdmin?: boolean;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
    schoolId?: string | null;
    schoolAppAdmin?: boolean;
    mustChangePassword?: boolean;
    capabilities?: string[] | null;
    suspended?: boolean;
    refreshedAt?: number;
  }
}

export {};
