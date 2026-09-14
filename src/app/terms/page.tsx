import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, P, H2, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using JOC Education.",
};

/**
 * Written against what the service actually does. Where something is not yet
 * switched on — card payment, for instance — these terms say so plainly
 * rather than describing a service that does not exist.
 */
const UPDATED = "14 September 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <P>
        JOC Education is a service of <strong>Just One Chesed, Inc.</strong>, a 501(c)(3) nonprofit
        organization. By creating an account or using the site, you agree to what follows. If you are
        agreeing on behalf of a school, you are confirming you may do so.
      </P>

      <H2>Who can use it</H2>
      <UL items={[
        "Accounts are for teachers, administrators and school staff — adults acting in a professional capacity.",
        "Your account is yours. Do not share your password or let someone else sign in as you.",
        "Tell us promptly if you think someone else has got into your account.",
        "Your school's administrator, and Just One Chesed, can see which accounts belong to that school and can close them.",
      ]} />

      <H2>The teaching materials</H2>
      <P>
        Lesson plans, resources, printables and program guides on this site belong to Just One Chesed
        or to whoever licensed them to us.
      </P>
      <P><strong>While your school has access, you may:</strong></P>
      <UL items={[
        "Use them to teach your own students.",
        "Print and copy them for your own classes.",
        "Share them with colleagues at your own school.",
        "Adapt them for your classroom.",
      ]} />
      <P><strong>Please do not:</strong></P>
      <UL items={[
        "Pass them to another school, or to anyone whose school has not subscribed.",
        "Publish them, post them publicly, or put them on a website or shared drive open beyond your school.",
        "Sell them, or charge for access to them.",
        "Remove the Just One Chesed name from them.",
      ]} />
      <P>
        If you want to use something more widely than this allows, ask us. We are a nonprofit and we
        would usually rather say yes.
      </P>

      <H2>What you write</H2>
      <P>
        What you post on the Teachers&rsquo; Board or in a discussion room stays yours. By posting it you
        let us show it to other educators on the service, and quote it back in our own materials with
        your name and school attached — and we will ask you first before doing that.
      </P>
      <P>Please keep it to what you would say in a staffroom. Do not post:</P>
      <UL items={[
        "Anything about an identifiable student.",
        "Anything abusive, or anything you would not say to the person's face.",
        "Material belonging to someone else without their permission.",
        "Advertising.",
      ]} />
      <P>
        Board posts are read by the JOC education team before they appear. In the discussion rooms
        nothing waits for approval, but we can remove a message, and you can remove your own.
      </P>

      <H2>Plans and payment</H2>
      <UL items={[
        "What a school gets depends on its plan. We will tell you before anything about that changes.",
        "The site does not take card payment at present. Orders and subscriptions are invoiced, and nothing is charged when you press a button here.",
        "Prices shown on the site are indicative until we confirm them with you in writing.",
        "No school is turned away on cost. Ask us about a scholarship — it is a real offer, not a formality.",
      ]} />

      <H2>Availability</H2>
      <P>
        We will keep the service running as well as we reasonably can, but this is a small nonprofit
        and not a utility. Features will change. There will be times it is unavailable. We provide it
        as it is, without warranties of any kind.
      </P>

      <H2>Ending it</H2>
      <UL items={[
        "You can close your account whenever you like, by writing to us.",
        "A school can end its plan at the end of the period it has paid for.",
        "We can suspend or close an account that is misused, or that breaks these terms. Except where something serious has happened, we will tell you why and give you a chance to put it right.",
        "When access ends, stop using the materials. You may keep copies of work you produced yourself.",
      ]} />

      <H2>Liability</H2>
      <P>
        To the fullest extent the law allows, Just One Chesed is not liable for indirect or
        consequential loss arising from your use of this site, and our total liability is limited to
        what your school paid us in the twelve months before the claim. Nothing here limits liability
        that cannot lawfully be limited.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        We will update these as the service develops, and the date at the top changes when we do. If a
        change materially affects what a school gets or what it pays, we will tell account holders
        directly rather than rely on you noticing.
      </P>

      <H2>Law</H2>
      <P>
        These terms are governed by the law of the State of New York, and disputes belong to the
        courts of New York.
      </P>

      <H2>Contact</H2>
      <P>
        Just One Chesed, Inc. —{" "}
        <a href="mailto:education@justonechesed.org">education@justonechesed.org</a>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </P>
    </LegalPage>
  );
}
