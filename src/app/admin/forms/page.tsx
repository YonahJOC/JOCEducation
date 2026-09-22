import { FormsGuard } from "@/components/admin/Guard";
import { listForms, listResponses } from "@/lib/forms";
import { isPaymentConfigured } from "@/lib/payments";
import { isDatabaseConfigured } from "@/lib/prisma";
import { FormsClient } from "./FormsClient";

export const metadata = { title: "Forms — JOC Console" };

type Props = { searchParams: Promise<{ responses?: string }> };

export default async function AdminFormsPage({ searchParams }: Props) {
  return <FormsGuard>{await Inner(searchParams)}</FormsGuard>;
}

async function Inner(searchParams: Props["searchParams"]) {
  const { responses } = await searchParams;
  const forms = await listForms();
  const showing = responses ? forms.find((f) => f.id === responses) ?? null : null;
  const rows = showing ? await listResponses(showing.id) : [];

  return (
    <FormsClient
      forms={forms}
      viewing={showing}
      responses={rows}
      paymentsOn={isPaymentConfigured}
      disabled={!isDatabaseConfigured()}
    />
  );
}
