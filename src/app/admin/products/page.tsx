import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { ProductsClient, type ProductRow } from "./ProductsClient";
import { ShopGuard } from "@/components/admin/Guard";

export const metadata = { title: "Products — JOC Console" };

async function getProducts(): Promise<ProductRow[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.product.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceDollars: p.price / 100,
    unit: p.unit,
    inStock: p.inStock,
    stripePriceId: p.stripePriceId,
    category: p.category,
    imageUrl: p.imageUrl,
    fileUrl: p.fileUrl,
    published: p.published,
    sort: p.sort,
  }));
}

async function Inner() {
  const products = await getProducts();
  return <ProductsClient products={products} disabled={!isDatabaseConfigured()} />;
}

export default async function AdminProductsPage() {
  return <ShopGuard>{await Inner()}</ShopGuard>;
}
