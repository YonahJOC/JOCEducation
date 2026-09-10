"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/home" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Email and password sign-in.
 *
 * Returns a message on failure rather than throwing, so the card can show it
 * in place. The message is deliberately the same whether the address is
 * unknown or the password is wrong — otherwise the form becomes a way to
 * discover which addresses have accounts.
 */
export async function signInWithPassword(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  try {
    await signIn("password", { email, password, redirectTo: "/home" });
    return {};
  } catch (err) {
    // A successful sign-in redirects by throwing NEXT_REDIRECT — let it pass.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;

    if (err instanceof AuthError) {
      return { error: "That email and password do not match an account." };
    }
    return { error: "Could not sign you in. Please try again." };
  }
}
