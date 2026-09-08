// Auth configuration — requires DATABASE_URL + DIRECT_URL in .env.local.
// Once the database is connected and `prisma generate` / `prisma migrate dev` have run,
// uncomment the Prisma adapter block below and remove the stub export.

// import NextAuth from "next-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import Google from "next-auth/providers/google";
// import Credentials from "next-auth/providers/credentials";
// import { prisma } from "@/lib/prisma";
//
// export const { handlers, auth, signIn, signOut } = NextAuth({
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     Google({
//       clientId: process.env.AUTH_GOOGLE_ID!,
//       clientSecret: process.env.AUTH_GOOGLE_SECRET!,
//     }),
//     Credentials({
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null;
//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//         });
//         return user ?? null;
//       },
//     }),
//   ],
//   session: { strategy: "database" },
//   callbacks: {
//     async session({ session, user }) {
//       if (session.user) {
//         session.user.id = user.id;
//         (session.user as Record<string, unknown>).role = (user as { role?: string }).role;
//       }
//       return session;
//     },
//   },
//   pages: { signIn: "/login", error: "/login" },
// });

// Stub — replace with the real NextAuth export above once the DB is ready
export const GET = () => new Response();
export const POST = () => new Response();
export const handlers = { GET, POST };
export const auth = async () => null;
export const signIn = async () => {};
export const signOut = async () => {};
