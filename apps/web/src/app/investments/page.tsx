import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@pwpm/ui";
import { computeEquityHoldingState, computeRentalPropertyInvestedCapital, latestValuation } from "@pwpm/domain";
import { formatDate, formatRatioAsPercent, formatVND } from "@pwpm/utils";
import type { Investment, Transaction, Valuation } from "@pwpm/shared";

import { AppShell } from "@/components/app-shell";
import { HouseIcon, LayersIcon, TrendUpIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { INVESTMENT_STATUS_DOT, INVESTMENT_STATUS_LABEL, INVESTMENT_TYPE_LABEL } from "@/lib/investments/labels";
import { createClient } from "@/lib/supabase/server";

import { InvestmentRowActions } from "./investment-row-actions";
import { QuickValuationEditor } from "./quick-valuation-editor";

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

  // buy_shares + sell_shares (not just buys) so held quantity nets out any sells, for
  // the "Định giá mới nhất" total-value calc below; capital_contribution for rental's
  // Giá mua, same as before.
  const purchaseTxsByInvestment = new Map<string, Transaction[]>();
  const valuationsByInvestment = new Map<string, Valuation[]>();
  if (investmentIds.length > 0) {
    const [{ data: purchaseTxs }, { data: valuationsData }] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .in("investment_id", investmentIds)
        .in("transaction_type", ["buy_shares", "sell_shares", "capital_contribution"]),
      supabase.from("valuations").select("*").in("investment_id", investmentIds),
    ]);
    for (const tx of (purchaseTxs ?? []) as Transaction[]) {
      const list = purchaseTxsByInvestment.get(tx.investment_id) ?? [];
      list.push(tx);
      purchaseTxsByInvestment.set(tx.investment_id, list);
    }
    for (const val of (valuationsData ?? []) as Valuation[]) {
      const list = valuationsByInvestment.get(val.investment_id) ?? [];
      list.push(val);
      valuationsByInvestment.set(val.investment_id, list);
    }
  }

  function purchaseValueOf(investment: Investment): number {
    const txs = purchaseTxsByInvestment.get(investment.id) ?? [];
    return investment.investment_type === "equity"
      ? computeEquityHoldingState(txs).totalBuyCost
      : computeRentalPropertyInvestedCapital(txs);
  }

  // Latest valuation as a TOTAL, comparable to Giá mua — for Equity that's held
  // quantity × price-per-unit (estimated_value is per-share, per data-model.md); for
  // Rental Property estimated_value already is the total property value.
  function currentValueOf(investment: Investment): number | null {
    const valuation = latestValuation(valuationsByInvestment.get(investment.id) ?? []);
    if (!valuation) return null;
    if (investment.investment_type === "equity") {
      const heldQuantity = computeEquityHoldingState(purchaseTxsByInvestment.get(investment.id) ?? []).heldQuantity;
      return heldQuantity * valuation.estimated_value;
    }
    return valuation.estimated_value;
  }

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5">
        <PageHeader
          title="Danh mục đầu tư"
          subtitle="Nơi khai báo và quản lý toàn bộ khoản đầu tư của bạn."
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
          <div className="overflow-x-auto rounded-[14px] border border-input bg-surface p-4">
            <table className="w-full min-w-[920px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <Th>Tài sản</Th>
                  <Th>Loại</Th>
                  <Th>Ngày mua</Th>
                  <Th align="right">Giá mua</Th>
                  <Th align="right">Định giá mới nhất</Th>
                  <Th align="right">Lãi/lỗ</Th>
                  <Th>Trạng thái</Th>
                  <Th align="right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const purchaseValue = purchaseValueOf(inv);
                  const currentValue = currentValueOf(inv);
                  const gain = currentValue != null ? currentValue - purchaseValue : null;
                  const gainPct = gain != null && purchaseValue > 0 ? gain / purchaseValue : null;

                  return (
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
                          {INVESTMENT_TYPE_LABEL[inv.investment_type]}
                        </span>
                      </td>
                      <td className="border-b border-input py-[9px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
                        {formatDate(inv.acquisition_date)}
                      </td>
                      <td className="border-b border-input py-[9px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
                        {formatVND(purchaseValue)}
                      </td>
                      <td className="border-b border-input py-[9px] pr-2.5 align-middle last:border-b-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-right font-semibold tabular-nums">
                            {currentValue != null ? formatVND(currentValue) : "—"}
                          </span>
                          <QuickValuationEditor
                            investmentId={inv.id}
                            placeholder={inv.investment_type === "equity" ? "Giá/CP" : "Tổng giá trị"}
                          />
                        </div>
                      </td>
                      <td className="border-b border-input py-[9px] pr-2.5 text-right align-middle last:border-b-0">
                        {gain != null ? (
                          <span className={`font-bold tabular-nums ${gain >= 0 ? "text-emerald" : "text-ruby"}`}>
                            {formatVND(gain)}
                            {gainPct != null && (
                              <span className="ml-1 font-medium opacity-80">
                                ({gain >= 0 ? "+" : ""}
                                {formatRatioAsPercent(gainPct)})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="border-b border-input py-[9px] pr-2.5 align-middle last:border-b-0">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground before:h-1.5 before:w-1.5 before:rounded-full ${INVESTMENT_STATUS_DOT[inv.status]}`}
                        >
                          {INVESTMENT_STATUS_LABEL[inv.status]}
                        </span>
                      </td>
                      <td className="border-b border-input py-[9px] pr-2.5 text-right align-middle last:border-b-0">
                        <InvestmentRowActions investmentId={inv.id} status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
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
