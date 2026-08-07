import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@pwpm/ui";
import { computeEquityHoldingState, computeRentalPropertyInvestedCapital } from "@pwpm/domain";
import { formatDate, formatVND } from "@pwpm/utils";
import type { Investment, Transaction } from "@pwpm/shared";

import { AppShell } from "@/components/app-shell";
import { HouseIcon, LayersIcon, TrendUpIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { InvestmentRowActions } from "./investment-row-actions";

const TYPE_LABEL: Record<Investment["investment_type"], string> = {
  equity: "Cổ phiếu",
  rental_property: "BĐS cho thuê",
};

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { tab } = await searchParams;
  const showArchived = tab === "archived";

  const query = supabase.from("investments").select("*").eq("customer_id", user.id).order("created_at", {
    ascending: false,
  });
  const { data } = showArchived
    ? await query.in("status", ["archived", "disposed"])
    : await query.eq("status", "active");
  const investments = (data ?? []) as Investment[];

  const investmentIds = investments.map((inv) => inv.id);
  const purchaseTxsByInvestment = new Map<string, Transaction[]>();
  if (investmentIds.length > 0) {
    const { data: purchaseTxs } = await supabase
      .from("transactions")
      .select("*")
      .in("investment_id", investmentIds)
      .in("transaction_type", ["buy_shares", "capital_contribution"]);
    for (const tx of (purchaseTxs ?? []) as Transaction[]) {
      const list = purchaseTxsByInvestment.get(tx.investment_id) ?? [];
      list.push(tx);
      purchaseTxsByInvestment.set(tx.investment_id, list);
    }
  }

  function purchaseValueOf(investment: Investment): number {
    const txs = purchaseTxsByInvestment.get(investment.id) ?? [];
    return investment.investment_type === "equity"
      ? computeEquityHoldingState(txs).totalBuyCost
      : computeRentalPropertyInvestedCapital(txs);
  }

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5">
        <PageHeader
          title="Khoản đầu tư"
          subtitle="Toàn bộ danh mục đầu tư của bạn."
          action={
            <Button asChild>
              <Link href="/investments/new">+ Thêm khoản đầu tư</Link>
            </Button>
          }
        />

        <div className="flex gap-1 border-b border-input">
          <TabLink href="/investments" label="Đang hoạt động" active={!showArchived} />
          <TabLink href="/investments?tab=archived" label="Đã lưu trữ" active={showArchived} />
        </div>

        {investments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-input py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft text-gold-bright">
              <LayersIcon className="h-6 w-6" />
            </div>
            {showArchived ? (
              <p className="font-semibold">Chưa có khoản đầu tư nào được lưu trữ</p>
            ) : (
              <>
                <div>
                  <p className="font-semibold">Chưa có khoản đầu tư nào</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Đăng ký khoản đầu tư đầu tiên để bắt đầu theo dõi hiệu suất.
                  </p>
                </div>
                <Button asChild className="mt-1">
                  <Link href="/investments/new">+ Thêm khoản đầu tư</Link>
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-[14px] border border-input bg-surface p-4">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <Th>Tài sản</Th>
                  <Th>Loại</Th>
                  <Th>Ngày mua</Th>
                  <Th align="right">Tổng giá trị mua</Th>
                  <Th>Trạng thái</Th>
                  <Th align="right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv.id}>
                    <td className="border-b border-input py-[9px] pr-2.5 align-middle last:border-b-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${
                            inv.investment_type === "equity"
                              ? "bg-emerald-soft text-emerald"
                              : "bg-gold-soft text-gold-bright"
                          }`}
                        >
                          {inv.investment_type === "equity" ? (
                            <TrendUpIcon className="h-3.5 w-3.5" strokeWidth="1.8" />
                          ) : (
                            <HouseIcon className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <Link href={`/investments/${inv.id}`} className="font-semibold hover:text-gold-bright">
                          {inv.name}
                        </Link>
                      </div>
                    </td>
                    <td className="border-b border-input py-[9px] pr-2.5 align-middle last:border-b-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${
                          inv.investment_type === "equity"
                            ? "bg-emerald-soft text-emerald"
                            : "bg-gold-soft text-gold-bright"
                        }`}
                      >
                        {TYPE_LABEL[inv.investment_type]}
                      </span>
                    </td>
                    <td className="border-b border-input py-[9px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
                      {formatDate(inv.acquisition_date)}
                    </td>
                    <td className="border-b border-input py-[9px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
                      {formatVND(purchaseValueOf(inv))}
                    </td>
                    <td className="border-b border-input py-[9px] pr-2.5 align-middle last:border-b-0">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground before:h-1.5 before:w-1.5 before:rounded-full ${
                          inv.status === "active" ? "before:bg-emerald" : "before:bg-muted-foreground"
                        }`}
                      >
                        {inv.status === "active" ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="border-b border-input py-[9px] pr-2.5 text-right align-middle last:border-b-0">
                      <InvestmentRowActions investmentId={inv.id} archived={inv.status !== "active"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
