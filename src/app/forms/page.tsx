import type { Metadata } from "next";
import Link from "next/link";
import { listOpenForms } from "@/lib/forms";
import { money } from "@/lib/payments";

const INK = "#10233F";
const BLUE = "#2D46AF";
const PAPER = "#FBF9F4";
const RULE = "rgba(16,35,63,.12)";

export const metadata: Metadata = { title: "Forms" };
export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const forms = await listOpenForms();

  return (
    <div style={{ backgroundColor: PAPER, minHeight: "70vh" }}>
      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 26px 70px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.08, letterSpacing: "-0.035em", color: INK, margin: "0 0 20px" }}>
          Forms
        </h1>
        {forms.length === 0 ? (
          <p style={{ fontSize: "15.5px", color: "#4A5A74", margin: 0 }}>
            Nothing open at the moment.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {forms.map((f) => (
              <Link
                key={f.slug}
                href={`/forms/${f.slug}`}
                style={{ display: "block", backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px 22px", textDecoration: "none" }}
              >
                <p style={{ fontSize: "17px", fontWeight: 700, color: INK, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                  {f.title}
                  {f.feeCents && (
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#C96C00", backgroundColor: "rgba(250,145,45,.14)", borderRadius: "9999px", padding: "3px 10px", marginLeft: "10px" }}>
                      {money(f.feeCents)}
                    </span>
                  )}
                </p>
                {f.description && (
                  <p style={{ fontSize: "14.5px", lineHeight: 1.55, color: "#4A5A74", margin: 0, maxWidth: "62ch" }}>
                    {f.description.split("\n")[0]}
                  </p>
                )}
                <span style={{ display: "inline-block", fontSize: "13.5px", fontWeight: 600, color: BLUE, marginTop: "8px" }}>
                  Open →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
