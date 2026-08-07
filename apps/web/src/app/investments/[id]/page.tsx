import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDate, formatVND } from "@pwpm/utils";
import { TRANSACTION_TYPES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { Investment, Transaction, Valuation } from "@pwpm/shared";

import { AppShell } from "@/components/app-shell";
import { HouseIcon, TrendUpIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";

import { TRANSACTION_TYPE_LABEL, VALUATION_SOURCE_LABEL } from "./labels";
import { TransactionForm } from "./transaction-form";
import { ValuationForm } from "./valuation-form";

const TYPE_LABEL: Record<Investment["investment_type"], string> = {
  equity: "Cổ phiếu",
  rental_property: "BĐS cho thuê",
};

export default async function InvestmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "valuations" ? "valuations" : "transactions";

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

  const { data: transactionsData } = await supabase
    .from("transactions")
    .select("*")
    .eq("investment_id", investment.id)
    .order("transaction_date", { ascending: false });
  const transactions = (transactionsData ?? []) as Transaction[];

  const { data: valuationsData } = await supabase
    .from("valuations")
    .select("*")
    .eq("investment_id", investment.id)
    .order("valuation_date", { ascending: false });
  const valuations = (valuationsData ?? []) as Valuation[];

  const allowedTransactionTypes = TRANSACTION_TYPES_BY_INVESTMENT_TYPE[investment.investment_type];

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
        <div>
          <Link href="/investments" className="text-[12.5px] text-muted-foreground hover:text-foreground">
            ← Khoản đầu tư
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <span
              className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                investment.investment_type === "equity"
                  ? "bg-emerald-soft text-emerald"
                  : "bg-gold-soft text-gold-bright"
              }`}
            >
              {investment.investment_type === "equity" ? (
                <TrendUpIcon className="h-4 w-4" strokeWidth="1.8" />
              ) : (
                <HouseIcon className="h-4 w-4" />
              )}
            </span>
            <h1 className="text-[19px] font-bold tracking-tight">{investment.name}</h1>
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {TYPE_LABEL[investment.investment_type]} · Mua {formatDate(investment.acquisition_date)}
          </p>
        </div>

        <div className="flex gap-1 border-b border-input">
          <TabLink href={`/investments/${investment.id}`} label="Giao dịch" active={activeTab === "transactions"} />
          <TabLink
            href={`/investments/${investment.id}?tab=valuations`}
            label="Định giá"
            active={activeTab === "valuations"}
          />
        </div>

        {activeTab === "transactions" ? (
          <div className="grid grid-cols-[1fr_320px] items-start gap-4">
            <div className="rounded-[14px] border border-input bg-surface p-4">
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-[12.5px] text-muted-foreground">Chưa có giao dịch nào.</p>
              ) : (
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      <Th>Ngày</Th>
                      <Th>Loại</Th>
                      <Th align="right">Số lượng</Th>
                      <Th align="right">Giá/đơn vị</Th>
                      <Th align="right">Phí</Th>
                      <Th align="right">Số tiền</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 align-middle font-medium last:border-b-0">
                          {TRANSACTION_TYPE_LABEL[tx.transaction_type]}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                          {tx.quantity ?? "—"}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                          {tx.price_per_unit ? formatVND(tx.price_per_unit) : "—"}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                          {tx.fee ? formatVND(tx.fee) : "—"}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
                          {formatVND(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <TransactionForm investmentId={investment.id} allowedTypes={allowedTransactionTypes} />
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_320px] items-start gap-4">
            <div className="rounded-[14px] border border-input bg-surface p-4">
              {valuations.length === 0 ? (
                <p className="py-8 text-center text-[12.5px] text-muted-foreground">Chưa có định giá nào.</p>
              ) : (
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      <Th>Ngày</Th>
                      <Th align="right">Giá trị ước tính</Th>
                      <Th>Nguồn</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuations.map((val) => (
                      <tr key={val.id}>
                        <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
                          {formatDate(val.valuation_date)}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
                          {formatVND(val.estimated_value)}
                        </td>
                        <td className="border-b border-input py-[7px] pr-2.5 align-middle last:border-b-0">
                          {VALUATION_SOURCE_LABEL[val.valuation_source]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <ValuationForm investmentId={investment.id} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`border-b border-input pb-2 pr-2.5 text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "border-b-2 border-gold px-1 pb-2 text-[13px] font-semibold text-gold-bright"
          : "border-b-2 border-transparent px-1 pb-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
