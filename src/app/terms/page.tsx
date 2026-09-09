import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, P, H2 } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using JOC Education.",
};

// Placeholder terms for the development phase. These need a proper review
// before schools are asked to agree to them.
const UPDATED = "9 September 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <P>
        JOC Education is a service of Just One Chesed, a 501(c)(3) nonprofit organization. By using this
        site you agree to these terms.
      </P>

      <H2>Who can use it</H2>
      <P>
        The site is in development and access is currently limited to Just One Chesed staff. Accounts are
        personal — do not share your login.
      </P>

      <H2>The materials</H2>
      <P>
        Lesson plans, resources and programs on this site belong to Just One Chesed. They are provided for
        use in teaching. Please do not republish or redistribute them outside your school without asking us
        first.
      </P>

      <H2>Availability</H2>
      <P>
        The site is under active development. Features will change, and it may be unavailable at times. We
        provide it as it is, without warranties.
      </P>

      <H2>Ending access</H2>
      <P>
        We may suspend or remove an account that is misused. You can close your account at any time by
        emailing us.
      </P>

      <H2>Liability</H2>
      <P>
        To the extent the law allows, Just One Chesed is not liable for any loss arising from use of this
        site.
      </P>

      <H2>Changes</H2>
      <P>
        We will update these terms as the platform develops, and the date above will change when we do.
      </P>

      <H2>Contact</H2>
      <P>
        <a href="mailto:education@justonechesed.org">education@justonechesed.org</a>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </P>
    </LegalPage>
  );
}
