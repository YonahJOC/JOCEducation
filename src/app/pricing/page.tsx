import { PricingSection } from "@/components/sections/PricingSection";
import Link from "next/link";

export const metadata = {
  title: { absolute: "Pricing — JOC Education" },
  description: "Simple, transparent membership for schools. Annual and monthly plans with no long-term contracts.",
};

export default function PricingPage() {
  return (
    <div>
      {/* Page hero */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 26px 0" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>BRING JOC TO YOUR SCHOOL</p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "14px", maxWidth: "16ch" }}>
          Simple, transparent pricing.
        </h1>
        <p style={{ fontSize: "17px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "55ch", marginBottom: "40px" }}>
          No long-term commitment on monthly plans. Annual saves 15%. No school is turned away on cost — we offer full and partial scholarships.
        </p>

        {/* Trust bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", paddingBottom: "48px", borderBottom: "1px solid rgba(16,35,63,.08)" }}>
          {[
            ["300+", "partner schools"],
            ["14,000+", "teachers with access"],
            ["2.1M", "chesed hours logged"],
          ].map(([stat, label]) => (
            <div key={label}>
              <div style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.04em", color: "#10233F" }}>{stat}</div>
              <div style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)", fontWeight: 500, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main pricing section */}
      <PricingSection />

      {/* FAQ */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 26px 72px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "32px" }}>Frequently asked questions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2px" }}>
          {FAQ.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>

        <div style={{ marginTop: "48px", backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "5px" }}>Still have questions?</p>
            <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.62)" }}>Our team is happy to walk through the options for your school.</p>
          </div>
          <a href="mailto:education@justonechesed.org" style={{ backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none", whiteSpace: "nowrap" }}>
            Contact us
          </a>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ padding: "24px 28px", border: "1px solid rgba(16,35,63,.08)", borderRadius: "0" }}>
      <p style={{ fontWeight: 700, fontSize: "15.5px", color: "#10233F", marginBottom: "8px" }}>{q}</p>
      <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, margin: 0 }}>{a}</p>
    </div>
  );
}

const FAQ = [
  { q: "Can we switch plans after signing up?", a: "Yes. You can upgrade at any time — the difference is prorated. Downgrades take effect at the next renewal." },
  { q: "What does 'unlimited staff' mean?", a: "Every teacher and administrator in your school gets their own login. No per-seat counting." },
  { q: "Is there a free trial?", a: "Yes — single teachers get a 14-day free trial. For full school subscriptions, we offer a 30-minute onboarding demo instead." },
  { q: "What is the JOC App exactly?", a: "A mobile app (iOS + Android) for students to log chesed hours, complete challenges, and track their school's collective impact." },
  { q: "Do you offer scholarships?", a: "Yes. No school is turned away on cost. Apply using the scholarship button on this page and we'll respond within 48 hours." },
  { q: "What happens to our data if we cancel?", a: "You can export all student data and lesson saves before your subscription ends. We delete school data 90 days after cancellation." },
  { q: "Can we pay by purchase order?", a: "Yes. Contact us at education@justonechesed.org and we'll send an invoice for annual plans." },
  { q: "Is there a setup fee?", a: "No setup fee on any plan. Annual full partnerships include a paid onboarding call with a JOC Education specialist." },
];
