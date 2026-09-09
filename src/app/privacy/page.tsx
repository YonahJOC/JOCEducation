import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, P, H2, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How JOC Education handles personal information.",
};

// Placeholder policy for the development phase. It must be rewritten, and
// reviewed properly, before any school or student data is collected.
const UPDATED = "9 September 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <P>
        JOC Education is a service of Just One Chesed, a 501(c)(3) nonprofit organization. This site is in
        development and sign-in is limited to Just One Chesed staff.
      </P>

      <H2>What we collect</H2>
      <P>
        Only what Google gives us when a staff member signs in: <strong>name, email address and profile
        picture</strong>. We also record when you last signed in, and our hosting provider keeps standard
        server logs. That is everything.
      </P>

      <H2>What we do not collect</H2>
      <UL items={[
        "No student data of any kind.",
        "No school data.",
        "No advertising or third-party tracking.",
      ]} />

      <H2>What we do with it</H2>
      <P>
        We use it to sign you in and keep the site running. We do not sell it and we do not share it with
        anyone, other than the providers that run the service for us — Google for sign-in, and our database
        and hosting providers.
      </P>

      <H2>Cookies</H2>
      <P>One cookie, to keep you signed in. Nothing else.</P>

      <H2>Deleting your information</H2>
      <P>
        Email us and we will delete your account and everything attached to it.
      </P>

      <H2>Changes</H2>
      <P>
        This policy covers the current, staff-only version of the site. We will publish a fuller policy
        before opening accounts to schools, and the date above will change when we do.
      </P>

      <H2>Contact</H2>
      <P>
        <a href="mailto:education@justonechesed.org">education@justonechesed.org</a>. See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </P>
    </LegalPage>
  );
}
