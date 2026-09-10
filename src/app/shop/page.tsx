import { getPublishedProducts } from "@/lib/content";
import { ShopClient, type ShopProduct } from "./ShopClient";

export const metadata = { title: "Shop" };

/**
 * Products come from the console. Nothing is hardcoded here, so a price
 * change is a console edit rather than a deploy.
 */
export default async function ShopPage() {
  const rows = await getPublishedProducts();

  const products: ShopProduct[] = rows
    .filter((p) => p.inStock)
    .map((p) => ({
      id: p.id,
      name: p.name,
      // The catalogue has no separate category yet; the unit is the closest
      // honest grouping until one is added.
      category: p.unit.charAt(0).toUpperCase() + p.unit.slice(1),
      detail: p.description,
      price: p.price,
      badge: null,
    }));

  if (products.length === 0) {
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "72px 26px 96px", textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>SCHOOL SHOP</p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "14px" }}>
          The shop is not open yet.
        </h1>
        <p style={{ fontSize: "16.5px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, marginBottom: "26px" }}>
          Printed materials — poster packs, journals, booth and assembly kits — are being prepared.
          If you need something for your school now, write to us and we will sort it out directly.
        </p>
        <a
          href="mailto:education@justonechesed.org"
          style={{ display: "inline-block", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none" }}
        >
          education@justonechesed.org
        </a>
      </div>
    );
  }

  return <ShopClient products={products} />;
}
