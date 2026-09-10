import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { ProductsClient, type ProductRow } from "./ProductsClient";

export const metadata = { title: "Products — JOC Console" };

async function getProducts(): Promise<ProductRow[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceDollars: p.price / 100,
    unit: p.unit,
    inStock: p.inStock,
    stripePriceId: p.stripePriceId,
  }));
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <ProductsClient products={products} disabled={!isDatabaseConfigured()} />;
}
