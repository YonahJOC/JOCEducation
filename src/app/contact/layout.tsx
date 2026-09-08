import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the JOC Education team. Questions about programs, subscriptions, or bringing JOC to your school — we respond within one business day.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
