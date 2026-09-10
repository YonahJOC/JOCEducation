"use server";

import { randomBytes, createHash } from "node:crypto";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword, passwordProblem } from "@/lib/password";
import { sendEmail, emailShell, siteUrl, isEmailConfigured } from "@/lib/email";

/**
 * Password reset.
 *
 * The page used to wait 900ms and say "check your inbox" without sending
 * anything, which strands anyone actually locked out. This is the real thing,
 * and when email is not switched on it says so instead of pretending.
 *
 * Tokens are stored hashed: the database never holds a value that would let
 * someone read it and take over an account. They last 30 minutes, and
 * requesting a new one invalidates the old.
 */

const TOKEN_TTL_MINUTES = 30;
/** Namespaced so these can never be confused with an Auth.js email token. */
const SCOPE = "password-reset:";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type RequestResult =
  | { ok: true; sent: true }
  /** No mail service yet — the caller must not claim anything was sent. */
  | { ok: true; sent: false; reason: "email-not-configured" }
  | { ok: false; error: string };

export async function requestPasswordReset(email: string): Promise<RequestResult> {
  const address = email.trim().toLowerCase();
  if (!address || !address.includes("@")) {
    return { ok: false, error: "Enter the email address you sign in with." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Sign-in is not connected yet." };
  }
  if (!isEmailConfigured) {
    return { ok: true, sent: false, reason: "email-not-configured" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true, active: true, name: true },
    });

    // Always answer the same way. Otherwise this form tells a stranger which
    // addresses have accounts.
    if (!user || !user.active) return { ok: true, sent: true };

    const token = randomBytes(32).toString("hex");
    const identifier = SCOPE + address;

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier } }),
      prisma.verificationToken.create({
        data: {
          identifier,
          token: hashToken(token),
          expires: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
        },
      }),
    ]);

    const link = `${siteUrl()}/reset-password?token=${token}&email=${encodeURIComponent(address)}`;
    const firstName = user.name?.trim().split(/\s+/)[0];

    await sendEmail({
      to: address,
      subject: "Reset your JOC Education password",
      text:
        `${firstName ? `Hello ${firstName},` : "Hello,"}\n\n` +
        `Open this address to choose a new password. It stops working in ${TOKEN_TTL_MINUTES} minutes.\n\n` +
        `${link}\n\n` +
        `If you did not ask for this, nothing has changed and you can ignore this message.\n`,
      html: emailShell({
        heading: "Choose a new password",
        body: [
          `${firstName ? `Hello ${firstName},` : "Hello,"}`,
          `Use the button below to set a new password for your JOC Education account. The link stops working in ${TOKEN_TTL_MINUTES} minutes.`,
        ],
        action: { label: "Set a new password", href: link },
        footnote: "If you did not ask for this, nothing has changed and you can ignore this message.",
      }),
    });

    return { ok: true, sent: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export type ResetResult = { ok: true } | { ok: false; error: string };

export async function completePasswordReset(input: {
  email: string;
  token: string;
  password: string;
}): Promise<ResetResult> {
  const address = input.email.trim().toLowerCase();
  if (!isDatabaseConfigured()) return { ok: false, error: "Sign-in is not connected yet." };

  const problem = passwordProblem(input.password);
  if (problem) return { ok: false, error: problem };

  const identifier = SCOPE + address;

  try {
    const row = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier, token: hashToken(input.token) } },
    });
    if (!row || row.expires < new Date()) {
      return { ok: false, error: "That link has expired. Ask for a new one." };
    }

    const user = await prisma.user.findUnique({ where: { email: address }, select: { id: true } });
    if (!user) return { ok: false, error: "That link is no longer valid." };

    const passwordHash = await hashPassword(input.password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          // They chose this one themselves, so nothing to force.
          mustChangePassword: false,
        },
      }),
      // One use only.
      prisma.verificationToken.deleteMany({ where: { identifier } }),
    ]);

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
