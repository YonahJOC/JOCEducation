import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedForm } from "@/lib/forms";
import { money } from "@/lib/payments";
import { safeAuth } from "@/auth";
import { FormFill } from "./FormFill";

const INK = "#10233F";
const BLUE = "#2D46AF";
const PAPER = "#FBF9F4";
const RULE = "rgba(16,35,63,.12)";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ paid?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = await getPublishedForm(slug);
  return form ? { title: form.title, description: form.description || undefined } : {};
}

export const dynamic = "force-dynamic";

export default async function FormPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { paid } = await searchParams;
  const form = await getPublishedForm(slug);
  if (!form) notFound();

  const session = await safeAuth();
  const needsSignIn = form.requiresSignIn && !session?.user?.id;

  return (
    <div style={{ backgroundColor: PAPER, minHeight: "70vh" }}>
      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 26px 70px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.08, letterSpacing: "-0.035em", color: INK, margin: "0 0 14px" }}>
          {form.title}
        </h1>

        {form.description && (
          <p style={{ fontSize: "16.5px", lineHeight: 1.65, color: "#4A5A74", margin: "0 0 18px", maxWidth: "58ch", whiteSpace: "pre-wrap" }}>
            {form.description}
          </p>
        )}

        {form.feeCents && (
          <p style={{ display: "inline-block", fontSize: "14.5px", fontWeight: 600, color: "#C96C00", backgroundColor: "rgba(250,145,45,.14)", borderRadius: "9999px", padding: "8px 16px", margin: "0 0 22px" }}>
            {money(form.feeCents)}{form.feeLabel ? ` — ${form.feeLabel}` : ""}
          </p>
        )}

        {/* A closed form says so. Somebody was sent this link last week and
            needs to be told it has shut, not shown a page that is not found. */}
        {form.closed ? (
          <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "18px", padding: "30px 26px", maxWidth: "58ch" }}>
            <h2 style={{ fontWeight: 800, fontSize: "19px", color: INK, margin: "0 0 8px" }}>This has closed</h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>
              It is no longer taking answers. If you think it should be open, email{" "}
              <a href="mailto:education@justonechesed.org" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>
                education@justonechesed.org
              </a>
              .
            </p>
          </div>
        ) : needsSignIn ? (
          <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "18px", padding: "30px 26px", maxWidth: "58ch" }}>
            <h2 style={{ fontWeight: 800, fontSize: "19px", color: INK, margin: "0 0 8px" }}>Please sign in first</h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4A5A74", margin: "0 0 16px" }}>
              This one is for people with a JOC Education account.
            </p>
            <Link
              href={`/?next=${encodeURIComponent(`/forms/${form.slug}`)}`}
              style={{ display: "inline-block", backgroundColor: BLUE, color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "12px 24px", textDecoration: "none" }}
            >
              Sign in
            </Link>
          </div>
        ) : (
          <FormFill form={form} paid={paid === "1"} />
        )}
      </section>
    </div>
  );
}
