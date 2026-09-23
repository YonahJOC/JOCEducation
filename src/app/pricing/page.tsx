import { PricingSection } from "@/components/sections/PricingSection";
import { getPlanPricing, getProgramPricing } from "@/lib/pricing";
import { siteContent, type RepeatItem } from "@/lib/site-content";
import Link from "next/link";
import { C, R } from "@/lib/joc-tokens";

export const metadata = {
  title: { absolute: "Pricing — JOC Education" },
  description: "Simple, transparent membership for schools. Annual and monthly plans with no long-term contracts.",
};

export default async function PricingPage() {
  const [plans, programs, c] = await Promise.all([
    getPlanPricing(),
    getProgramPricing(),
    siteContent("pricing"),
  ]);
  const faq = c.list<RepeatItem>("faq.items", []);

  return (
    <div>
      {/* Page hero */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 26px 0" }}>
        <p style={{ fontWeight: 700, fontSize: "12px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>BRING JOC TO YOUR SCHOOL</p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "14px", maxWidth: "16ch" }}>
          {c.text("hero.headline", "Simple, transparent pricing.")}
        </h1>
        <p style={{ fontSize: "17px", color: "#4A5A74", lineHeight: 1.6, maxWidth: "55ch", marginBottom: "40px" }}>
          {c.text(
            "hero.standfirst",
            "No long-term commitment on monthly plans. Annual saves 15%. No school is turned away on cost — we offer full and partial scholarships."
          )}
        </p>

        {/* What every plan includes. The trust bar that stood here quoted
            partner-school, teacher and chesed-hour figures nobody had counted;
            what a school actually gets is both true and more useful. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", paddingBottom: "48px", borderBottom: `1px solid ${C.hairline}` }}>
          {[
            ["Every plan", "includes the full resource library"],
            ["No school turned away", "full and partial scholarships"],
            ["Monthly or annual", "annual saves 15%"],
          ].map(([stat, label]) => (
            <div key={label}>
              <div style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: "#10233F" }}>{stat}</div>
              <div style={{ fontSize: "15px", color: "#4A5A74", fontWeight: 500, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main pricing section */}
      <PricingSection plans={plans} programs={programs} />

      {/* FAQ */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 26px 72px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "32px" }}>Frequently asked questions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2px" }}>
          {(faq.length > 0
            ? faq.map((f) => ({ q: f.title ?? "", a: f.body ?? "" }))
            : FAQ
          ).map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>

        <div style={{ marginTop: "48px", backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "5px" }}>Still have questions?</p>
            <p style={{ fontSize: "14.5px", color: "#4A5A74" }}>Our team is happy to walk through the options for your school.</p>
          </div>
          <a href="mailto:education@justonechesed.org" style={{ backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: R.chip, padding: "13px 24px", textDecoration: "none", whiteSpace: "nowrap" }}>
            Contact us
          </a>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ padding: "24px 28px", border: `1px solid ${C.hairline}`, borderRadius: "0" }}>
      <p style={{ fontWeight: 700, fontSize: "16px", color: "#10233F", marginBottom: "8px" }}>{q}</p>
      <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: 0 }}>{a}</p>
    </div>
  );
}

const FAQ = [
  { q: "Can we switch plans after signing up?", a: "Yes. You can upgrade at any time — the difference is prorated. Downgrades take effect at the next renewal." },
  { q: "What does 'unlimited staff' mean?", a: "Every teacher and administrator in your school gets their own login. No per-seat counting." },
  { q: "Is there a free trial?", a: "Yes — single teachers get a 14-day free trial. For full school subscriptions, we offer a 30-minute onboarding demo instead." },
  { q: "What is the JOC App exactly?", a: "A mobile app (iOS + Android) for students to log chesed hours, complete challenges, and track their school's collective impact." },
  { q: "Do you offer scholarships?", a: "Yes. No school is turned away on cost — write to education@justonechesed.org and tell us what your school can manage." },
  { q: "What happens to our data if we cancel?", a: "We hold no student data at all — this site is for teachers. Your school's account details and what your teachers wrote stay until you ask us to remove them, and we will remove them whenever you ask." },
  { q: "Can we pay by purchase order?", a: "Yes. Contact us at education@justonechesed.org and we'll send an invoice for annual plans." },
  { q: "Is there a setup fee?", a: "No setup fee on any plan. Annual full partnerships include a paid onboarding call with a JOC Education specialist." },
];
