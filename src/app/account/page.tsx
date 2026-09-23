import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { redirect } from "next/navigation";
import { safeAuth } from "@/auth";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, canRunOwnSchool, type Role } from "@/lib/access";
import { canOpenConsole } from "@/lib/program-admin";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };

const CARD: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.1)",
  borderRadius: "20px", padding: "24px", marginBottom: "16px",
};
const LABEL: React.CSSProperties = {
  fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase",
  fontWeight: 700, color: "#4A5A74", margin: "0 0 12px",
};

/**
 * What the account menu's "Account settings" points at. It pointed at a page
 * that did not exist — only /account/password did.
 */
export default async function AccountPage() {
  const session = await safeAuth();
  if (!session?.user) redirect("/login?next=%2Faccount");
  const u = session.user;
  const openConsole = await canOpenConsole(u);

  let schoolName: string | null = null;
  if (isDatabaseConfigured() && u.schoolId) {
    try {
      const s = await prisma.school.findUnique({
        where: { id: u.schoolId },
        select: { name: true },
      });
      schoolName = s?.name ?? null;
    } catch {
      // Decoration only.
    }
  }

  const role = (u.role ?? "TEACHER") as Role;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 26px 72px" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>
        YOUR ACCOUNT
      </p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: C.ink, marginBottom: "28px" }}>
        {u.name ?? u.email}
      </h1>

      <div style={CARD}>
        <p style={LABEL}>Sign-in</p>
        <Row label="Email" value={u.email ?? "Not recorded"} />
        <Row label="Name" value={u.name ?? "Not set"} />
        <Row label="Role" value={ROLE_LABELS[role] ?? role} />
        <p style={{ fontSize: "13.5px", color: "#4A5A74", lineHeight: 1.55, margin: "10px 0 0" }}>
          {ROLE_DESCRIPTIONS[role]}
        </p>
      </div>

      <div style={CARD}>
        <p style={LABEL}>School</p>
        {schoolName ? (
          <Row label="You are with" value={schoolName} />
        ) : (
          <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: 0 }}>
            Your account is not linked to a school. Signing in with your school email address
            is what makes the match — ask Just One Chesed if it should be and is not.
          </p>
        )}
      </div>

      <div style={CARD}>
        <p style={LABEL}>Password</p>
        <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: "0 0 16px" }}>
          Change the password you use to sign in.
        </p>
        <Link
          href="/account/password"
          style={{ display: "inline-block", backgroundColor: C.blue, color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 22px", textDecoration: "none" }}
        >
          Change password
        </Link>
      </div>

      {(openConsole || canRunOwnSchool(u)) && (
        <div style={CARD}>
          <p style={LABEL}>Where you can go</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {openConsole && (
              <Link href="/admin" style={{ fontSize: "14px", fontWeight: 600, color: C.blue, textDecoration: "none" }}>
                JOC Console →
              </Link>
            )}
            {canRunOwnSchool(u) && (
              <Link href="/school" style={{ fontSize: "14px", fontWeight: 600, color: C.blue, textDecoration: "none" }}>
                My school →
              </Link>
            )}
          </div>
        </div>
      )}

      <form action={signOutAction}>
        <button
          type="submit"
          style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 600, color: "#A3261A", background: "none", border: "none", padding: "8px 0", cursor: "pointer", minHeight: "44px" }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", padding: "7px 0", fontSize: "14.5px" }}>
      <span style={{ color: "#4A5A74", minWidth: "110px" }}>{label}</span>
      <span style={{ color: C.ink, fontWeight: 500, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
