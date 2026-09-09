import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      schoolId: string | null;
      /** True for @justonechesed.org addresses — full access, no subscription. */
      isStaff: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    schoolId?: string | null;
  }
}

export {};
