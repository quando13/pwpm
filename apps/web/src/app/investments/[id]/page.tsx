import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@pwpm/utils";
import { REFERENCE_EVENT_TYPES_BY_INVESTMENT_TYPE, TRANSACTION_TYPES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { Financing, Investment, PerformanceSnapshot, ReferenceEvent, Transaction, Valuation } from "@pwpm/shared";

import { AppShell } from "@/components/app-shell";
import { HouseIcon, TrendUpIcon } from "@/components/icons";
import { INVESTMENT_STATUS_DOT, INVESTMENT_STATUS_LABEL, INVESTMENT_TYPE_LABEL } from "@/lib/investments/labels";
import { createClient } from "@/lib/supabase/server";

import { FinancingTab } from "./financing-tab";
import { OverviewTab } from "./overview-tab";
import { ReferenceEventCard } from "./reference-event-card";
import { ReferenceEventForm } from "./reference-event-form";
import { TransactionForm } from "./transaction-form";
import { TransactionRow } from "./transaction-row";
import { ValuationForm } from "./valuation-form";
import { ValuationRow } from "./valuation-row";

const TABS = ["overview", "transactions", "financing", "valuations", "events"] as const;
type Tab = (typeof TABS)[number];

export default async function InvestmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";

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

  const { data: eventsData } = await supabase
    .from("reference_events")
    .select("*")
    .eq("investment_id", investment.id)
    .order("event_date", { ascending: false });
  const events = (eventsData ?? []) as ReferenceEvent[];

  const { data: financingsData } = await supabase
    .from("financings")
    .select("*")
    .eq("investment_id", investment.id)
    .order("start_date", { ascending: true });
  const financings = (financingsData ?? []) as Financing[];

  const { data: snapshotsData } = await supabase
    .from("performance_snapshots")
    .select("*")
    .eq("investment_id", investment.id)
    .order("snapshot_date", { ascending: true });
  const snapshots = (snapshotsData ?? []) as PerformanceSnapshot[];

  const allowedTransactionTypes = TRANSACTION_TYPES_BY_INVESTMENT_TYPE[investment.investment_type];
  const allowedEventTypes = REFERENCE_EVENT_TYPES_BY_INVESTMENT_TYPE[investment.investment_type];

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
        <div>
          <Link href="/investments" className="text-[12.5px] text-muted-foreground hover:text-foreground">
            ← Danh mục
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
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground before:h-1.5 before:w-1.5 before:rounded-full ${INVESTMENT_STATUS_DOT[investment.status]}`}
            >
              {INVESTMENT_STATUS_LABEL[investment.status]}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {INVESTMENT_TYPE_LABEL[investment.investment_type]} · Mua {formatDate(investment.acquisition_date)}
          </p>
        </div>

        <div className="flex gap-1 border-b border-input">
          <TabLink href={`/investments/${investment.id}`} label="Tổng quan" active={activeTab === "overview"} />
          <TabLink
            href={`/investments/${investment.id}?tab=transactions`}
            label="Giao dịch"
            active={activeTab === "transactions"}
          />
          {investment.investment_type === "rental_property" && (
            <TabLink
              href={`/investments/${investment.id}?tab=financing`}
              label="Tài trợ"
              active={activeTab === "financing"}
            />
          )}
          <TabLink
            href={`/investments/${investment.id}?tab=valuations`}
            label="Định giá"
            active={activeTab === "valuations"}
          />
          <TabLink
            href={`/investments/${investment.id}?tab=events`}
            label="Sự kiện"
            active={activeTab === "events"}
          />
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            investment={investment}
            snapshots={snapshots}
            transactions={transactions}
            valuations={valuations}
            financings={financings}
          />
        )}

        {activeTab === "financing" && investment.investment_type === "rental_property" && (
          <FinancingTab investmentId={investment.id} financings={financings} transactions={transactions} />
        )}

        {activeTab === "transactions" && (
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
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        investmentId={investment.id}
                        transaction={tx}
                        allowedTypes={allowedTransactionTypes}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <TransactionForm investmentId={investment.id} allowedTypes={allowedTransactionTypes} />
          </div>
        )}

        {activeTab === "valuations" && (
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
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuations.map((val) => (
                      <ValuationRow key={val.id} investmentId={investment.id} valuation={val} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <ValuationForm investmentId={investment.id} />
          </div>
        )}

        {activeTab === "events" && (
          <div className="grid grid-cols-[1fr_320px] items-start gap-4">
            <div className="rounded-[14px] border border-input bg-surface p-4">
              {events.length === 0 ? (
                <p className="py-8 text-center text-[12.5px] text-muted-foreground">Chưa có sự kiện nào.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {events.map((ev) => (
                    <ReferenceEventCard
                      key={ev.id}
                      investmentId={investment.id}
                      event={ev}
                      allowedTypes={allowedEventTypes}
                    />
                  ))}
                </ul>
              )}
            </div>
            <ReferenceEventForm investmentId={investment.id} allowedTypes={allowedEventTypes} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
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
