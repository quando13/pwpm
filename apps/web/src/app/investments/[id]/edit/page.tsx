import { notFound, redirect } from "next/navigation";
import type { Investment, Transaction } from "@pwpm/shared";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { EditInvestmentForm } from "./edit-investment-form";

export default async function EditInvestmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: investmentRow } = await supabase
    .from("investments")
    .select("*")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();
  if (!investmentRow) {
    notFound();
  }
  const investment = investmentRow as Investment;

  const purchaseType = investment.investment_type === "equity" ? "buy_shares" : "capital_contribution";
  const { data: txs } = await supabase
    .from("transactions")
    .select("*")
    .eq("investment_id", investment.id)
    .eq("transaction_type", purchaseType);
  const transactions = (txs ?? []) as Transaction[];
  const valueEditable = transactions.length === 1;
  const tx = valueEditable ? transactions[0] : undefined;

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
        <PageHeader title="Sửa khoản đầu tư" subtitle={investment.name} />
        <EditInvestmentForm
          investment={investment}
          quantity={tx?.quantity ?? undefined}
          pricePerUnit={tx?.price_per_unit ?? undefined}
          purchaseValue={investment.investment_type === "rental_property" ? tx?.amount : undefined}
          valueEditable={valueEditable}
        />
      </div>
    </AppShell>
  );
}
