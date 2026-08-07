import { redirect } from "next/navigation";
import type { Investment, Transaction } from "@pwpm/shared";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { NewInvestmentForm, type InitialInvestmentValues } from "./new-investment-form";

export default async function NewInvestmentPage({
  searchParams,
}: {
  searchParams: Promise<{ cloneFrom?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { cloneFrom } = await searchParams;
  let initial: InitialInvestmentValues | undefined;

  if (cloneFrom) {
    const { data: source } = await supabase
      .from("investments")
      .select("*")
      .eq("id", cloneFrom)
      .eq("customer_id", user.id)
      .single();

    if (source) {
      const investment = source as Investment;
      const purchaseType = investment.investment_type === "equity" ? "buy_shares" : "capital_contribution";
      const { data: txs } = await supabase
        .from("transactions")
        .select("*")
        .eq("investment_id", investment.id)
        .eq("transaction_type", purchaseType)
        .limit(1);
      const tx = (txs?.[0] as Transaction | undefined) ?? undefined;

      initial = {
        name: `${investment.name} (bản sao)`,
        investment_type: investment.investment_type,
        acquisition_date: investment.acquisition_date,
        quantity: tx?.quantity ?? undefined,
        price_per_unit: tx?.price_per_unit ?? undefined,
        purchase_value: investment.investment_type === "rental_property" ? tx?.amount : undefined,
      };
    }
  }

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
        <PageHeader
          title={cloneFrom ? "Sao chép khoản đầu tư" : "Thêm khoản đầu tư"}
          subtitle="Nhập thông tin khoản đầu tư của bạn."
        />
        <NewInvestmentForm initial={initial} />
      </div>
    </AppShell>
  );
}
