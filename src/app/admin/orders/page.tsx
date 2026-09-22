import { OrdersGuard } from "@/components/admin/Guard";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { OrdersClient, type OrderRow } from "./OrdersClient";

export const metadata = { title: "Orders — JOC Console" };

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const when = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

async function getOrders(): Promise<OrderRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.order.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { items: true },
    });
    return rows.map((o) => ({
      id: o.id,
      status: o.status,
      contactName: o.contactName,
      contactEmail: o.contactEmail,
      phone: o.phone,
      schoolName: o.schoolName,
      address: o.address,
      poNumber: o.poNumber,
      notes: o.notes,
      response: o.response,
      subtotal: money(o.subtotal),
      when: when(o.createdAt),
      items: o.items.map((i) => ({
        name: i.name,
        unit: i.unit,
        unitPrice: money(i.unitPrice),
        quantity: i.quantity,
      })),
    }));
  } catch {
    return [];
  }
}

export default async function AdminOrdersPage() {
  return <OrdersGuard>{await Inner()}</OrdersGuard>;
}

async function Inner() {
  return <OrdersClient orders={await getOrders()} disabled={!isDatabaseConfigured()} />;
}
