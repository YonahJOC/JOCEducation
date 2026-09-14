import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, P, H2, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What JOC Education collects, why, and who it is shared with.",
};

/**
 * Written to describe what the service actually does, field by field, against
 * the database schema — not a template. Every list below is a real list.
 *
 * If a feature starts collecting something new, this page is part of the
 * change, not a follow-up.
 */
const UPDATED = "14 September 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <P>
        JOC Education is a service of <strong>Just One Chesed, Inc.</strong>, a 501(c)(3) nonprofit
        organization. This policy explains what we collect, why we collect it, and who else can see
        it. It is written to be read, not skimmed past.
      </P>

      <H2>Who this service is for</H2>
      <P>
        JOC Education is for <strong>teachers, administrators and school staff</strong>. It is not
        intended for children, and students do not have accounts on it. We do not knowingly collect
        information from anyone under 13. If you believe a child has created an account, write to us
        and we will remove it.
      </P>

      <H2>We do not collect student data</H2>
      <P>
        Nothing on this site asks for, stores or processes information about individual students. No
        names, no grades, no attendance, no chesed records, no photographs. Teachers use this site to
        plan and to talk to each other; students are not part of it.
      </P>

      <H2>What we collect, and why</H2>
      <P>Only what a particular action requires.</P>

      <P><strong>When you create an account or are invited to one:</strong></P>
      <UL items={[
        "Your name and email address — to identify you and to sign you in.",
        "Your password, stored only as a cryptographic hash. We cannot read it, and nobody at JOC can tell you what it is.",
        "The school you belong to, and your role — which decides what you are allowed to see.",
        "The date you last signed in, so we can tell an active account from an abandoned one.",
      ]} />

      <P><strong>When you ask for a demonstration or use the contact form:</strong></P>
      <UL items={[
        "Your name, email address, school, and phone number if you give one.",
        "A preferred time, and whatever you write in the message.",
      ]} />

      <P><strong>When your school orders from the shop:</strong></P>
      <UL items={[
        "The contact name, email and phone number for the order.",
        "The school name, delivery address and purchase order number.",
        "What was ordered, and anything you write in the notes.",
      ]} />

      <P><strong>When you post on the Teachers&rsquo; Board or in a discussion room:</strong></P>
      <UL items={[
        "What you wrote, and your name and school beside it. Other signed-in educators can read it.",
        "Board posts are reviewed by the JOC education team before they appear publicly.",
      ]} />

      <P><strong>About your school, as an account:</strong></P>
      <UL items={[
        "Its name, location, type and rough size, and the email domains its staff use.",
        "Contacts at the school — name, title, email and phone — so we know who to speak to.",
        "Its plan, and a record of our dealings with it: calls, emails, meetings, plan changes.",
      ]} />

      <H2>What we do not do</H2>
      <UL items={[
        "We do not sell your information, and we never will.",
        "We do not share it with advertisers, data brokers or anyone else for their own purposes.",
        "We run no advertising, no analytics, no tracking pixels and no third-party trackers. There are none on this site.",
        "We do not use what you write to profile you or to make automated decisions about you.",
      ]} />

      <H2>Cookies</H2>
      <P>
        One cookie, which keeps you signed in. It is removed when you sign out. We use no advertising
        or analytics cookies, so there is nothing here to consent to or opt out of.
      </P>

      <H2>Who else can see it</H2>
      <P>
        Only the companies that run the service for us, and only to the extent their part of it
        requires. Each is bound to use it for that purpose and nothing else:
      </P>
      <UL items={[
        "Vercel — hosting, which means every page you load passes through them.",
        "Supabase — the database where everything above is stored. Our data is held in the United States.",
        "Resend — sending email, such as an invitation or a password reset.",
        "Google — only if you choose to sign in with a Google account.",
        "Stripe — only if and when card payment is enabled, and only for what a payment needs.",
      ]} />
      <P>
        We will also disclose information if the law genuinely requires it. If that ever happens and
        we are permitted to tell you, we will.
      </P>

      <H2>Who at JOC can see it</H2>
      <P>
        Access follows the job. The education team can see and change teaching material and the
        discussion rooms, and cannot open a school&rsquo;s account records. Only super administrators can
        see school accounts, plans and user records. Nobody at JOC can read your password.
      </P>

      <H2>How long we keep it</H2>
      <P>
        Account information for as long as the account exists, and then until you ask us to remove
        it. Demo requests, messages and orders are kept as a record of our dealings with a school.
        Ask us to delete any of it and we will, unless we are required to keep it.
      </P>

      <H2>Your choices</H2>
      <P>
        Write to <a href="mailto:education@justonechesed.org">education@justonechesed.org</a> and we
        will, without charge:
      </P>
      <UL items={[
        "Tell you what we hold about you.",
        "Send you a copy of it.",
        "Correct anything that is wrong.",
        "Delete your account and what is attached to it.",
        "Stop emailing you.",
      ]} />
      <P>
        You can also change your own password, and edit or remove what you have written, from inside
        your account.
      </P>

      <H2>Keeping it safe</H2>
      <P>
        Everything travels encrypted. Passwords are hashed, never stored as text. What you can see is
        checked on our servers against your role every time, not merely hidden in the page. No system
        is perfect, and we will not pretend otherwise — but if information is ever exposed, we will
        tell the people affected rather than wait to be asked.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        If we start collecting something new, this page changes at the same time, and the date at the
        top changes with it. If the change is significant, we will tell account holders directly
        rather than rely on you noticing.
      </P>

      <H2>Contact</H2>
      <P>
        Just One Chesed, Inc. —{" "}
        <a href="mailto:education@justonechesed.org">education@justonechesed.org</a>. See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </P>
    </LegalPage>
  );
}
