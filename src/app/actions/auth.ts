"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  // Staff and teachers both land on /home; the gate lets them through from there.
  await signIn("google", { redirectTo: "/home" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
