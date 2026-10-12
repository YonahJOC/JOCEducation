import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getRunningCycle } from "@/lib/cycle-data";
import { emailAllowed, shortName } from "@/lib/school-screen/rules";
import { ShoutOutForm } from "@/components/school-screen/ShoutOutForm";
import { C, F, R, T } from "@/lib/joc-tokens";

/**
 * Where the QR code on a school's screen goes.
 *
 * A phone, held by a student, in a hallway. Signed in — the login gate sends
 * anybody who is not back here afterwards — and with the school's own email
 * address once the school has said what that is. One question and a few
 * boxes, and the choice about whether their name may go on the wall asked of
 * the only person who can give it.
 */

export const dynamic = "force-dynamic";
export const metadata = { title: "Send a chesed shout-out", robots: { index: false, follow: false } };

export default async function ShoutOutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) notFound();

  const school = await prisma.school.findUnique({
    where: { slug },
    select: { name: true, screenShortName: true, screenEmailDomains: true, isTest: true },
  }).catch(() => null);
  if (!school) notFound();

  const session = await safeAuth();
  const email = session?.user?.email ?? null;
  const cycle = await getRunningCycle().catch(() => null);
  const short = shortName(school.name, school.screenShortName);
  const allowed = emailAllowed(email, school.screenEmailDomains);

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#186fae 0%,#222898 100%)", padding: "28px 16px 60px" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Image src="/brand/joc-wordmark-white.png" alt="Just One Chesed" width={150} height={18}
          style={{ height: "18px", width: "auto", display: "block", marginBottom: "22px" }} />
        <div style={{ background: C.white, borderRadius: R.hero, padding: "26px 22px" }}>
          <div style={{ ...T.meta, color: C.orangeText }}>{short.toUpperCase()} · CHESED SHOUT-OUT</div>
          <h1 style={{ fontFamily: F.ui, fontSize: "28px", fontWeight: 800, lineHeight: 1.15, color: C.ink, margin: "8px 0 8px" }}>
            Who made a difference to you?
          </h1>
          {cycle?.question ? (
            <p style={{ ...T.read, color: C.muted, margin: "0 0 18px" }}>This cycle: {cycle.question}</p>
          ) : null}

          {!email ? (
            <p style={{ ...T.read, color: C.ink }}>
              <a href={`/login?next=${encodeURIComponent(`/shout-out/${slug}`)}`} style={{ color: C.blue, fontWeight: 700 }}>Sign in with your school email</a>{" "}
              to send one.
            </p>
          ) : !allowed ? (
            <p style={{ ...T.read, color: C.ink }}>
              You&rsquo;re signed in as <strong>{email}</strong>. Shout-outs for {short} come from a school address
              (@{school.screenEmailDomains[0]}). <Link href="/api/auth/signout" prefetch={false} style={{ color: C.blue }}>Sign out</Link> and sign in with that one.
            </p>
          ) : (
            <ShoutOutForm slug={slug} short={short} email={email} />
          )}
        </div>
      </div>
    </main>
  );
}
