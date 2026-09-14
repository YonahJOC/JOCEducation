import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getPlanPricing, getProgramPricing, pricingIsSet } from "@/lib/pricing";
import { PricingClient } from "./PricingClient";

export const metadata = { title: "Pricing — JOC Console" };

export default async function AdminPricingPage() {
  return <AccountsGuard>{await Inner()}</AccountsGuard>;
}

async function Inner() {
  const [plans, programs, isSet] = await Promise.all([
    getPlanPricing(),
    getProgramPricing(),
    pricingIsSet(),
  ]);

  return (
    <PricingClient
      plans={plans}
      programs={programs}
      isSet={isSet}
      disabled={!isDatabaseConfigured()}
    />
  );
}
