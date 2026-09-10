import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { safeAuth, isAuthConfigured } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { PasswordForm } from "./PasswordForm";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE_TEXT = "#C96C00";
const RULE = "rgba(16,35,63,.12)";

export const metadata: Metadata = {
  title: "Change your password",
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ forced?: string }>;
}) {
  const { forced } = await searchParams;
  const session = await safeAuth();
  if (isAuthConfigured && !session?.user) redirect("/");

  let hasPassword = true;
  let mustChange = Boolean(session?.user?.mustChangePassword);
  if (isDatabaseConfigured() && session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, mustChangePassword: true },
    });
    hasPassword = Boolean(u?.passwordHash);
    mustChange = Boolean(u?.mustChangePassword);
  }
  const isForced = mustChange || forced === "1";

  return (
    <div style={{ backgroundColor: "#FBF9F4", minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "16px 26px" }}>
          <Link href="/home" style={{ display: "inline-flex", alignItems: "center", gap: "11px", textDecoration: "none" }}>
            <Image src="/brand/joc-wordmark.png" alt="JustOneChesed" width={150} height={18} style={{ height: "18px", width: "auto" }} />
            <span aria-hidden="true" style={{ width: "1px", height: "18px", backgroundColor: RULE }} />
            <span style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT }}>
              Education
            </span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "520px", margin: "0 auto", padding: "48px 26px 70px" }}>
        {isForced && (
          <div style={{ backgroundColor: "#FDEEDA", border: "1px solid rgba(154,84,5,.25)", borderRadius: "14px", padding: "14px 16px", marginBottom: "20px" }}>
            <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#9A5405", margin: 0 }}>
              <strong>Choose your own password.</strong> The one you have was issued by an administrator,
              so somebody else has seen it.
            </p>
          </div>
        )}

        <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.6vw, 34px)", lineHeight: 1.08, letterSpacing: "-0.035em", color: INK, margin: "0 0 8px" }}>
          {hasPassword ? "Change your password" : "Set a password"}
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.65)", margin: "0 0 24px" }}>
          {hasPassword
            ? "Signed in as " + (session?.user?.email ?? "your account") + "."
            : "You sign in with Google. Setting a password gives you a second way in."}
        </p>

        <PasswordForm hasPassword={hasPassword} forced={isForced} />

        {!isForced && (
          <p style={{ marginTop: "22px", fontSize: "14px" }}>
            <Link href="/home" style={{ color: BLUE, textDecoration: "none", fontWeight: 600 }}>
              ← Back to the site
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
