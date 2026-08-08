import { latestValuation } from "@pwpm/domain";
import { formatDate, formatRatioAsPercent, formatVND } from "@pwpm/utils";
import type { Financing, Investment, PerformanceSnapshot, Transaction, Valuation } from "@pwpm/shared";

import { MonthlyCashFlowChart } from "./monthly-cashflow-chart";
import { TrendChart } from "./trend-chart";

function sumByType(transactions: Transaction[], type: Transaction["transaction_type"]): number {
  return transactions.filter((tx) => tx.transaction_type === type).reduce((sum, tx) => sum + tx.amount, 0);
}

// Cash-flow-relevant transaction types, signed the same way as computeRentalPropertySnapshot's
// Cash Flow formula (rental_income in, everything else out) — bucketed by month instead of
// summed cumulatively, for the "Dòng tiền theo tháng" chart.
const MONTHLY_CASH_FLOW_TYPES: Record<string, 1 | -1> = {
  rental_income: 1,
  maintenance_expense: -1,
  loan_interest_payment: -1,
  renovation_expense: -1,
  loan_principal_payment: -1,
};

function buildMonthlyCashFlow(transactions: Transaction[]): { label: string; value: number }[] {
  const relevant = transactions.filter((tx) => tx.transaction_type in MONTHLY_CASH_FLOW_TYPES);
  if (relevant.length === 0) return [];

  const monthKey = (dateStr: string) => dateStr.slice(0, 7);
  const sums = new Map<string, number>();
  for (const tx of relevant) {
    const key = monthKey(tx.transaction_date);
    const sign = MONTHLY_CASH_FLOW_TYPES[tx.transaction_type];
    sums.set(key, (sums.get(key) ?? 0) + sign * tx.amount);
  }

  const earliestKey = relevant.map((tx) => monthKey(tx.transaction_date)).sort()[0];
  const nowKey = new Date().toISOString().slice(0, 7);

  const months: { label: string; value: number }[] = [];
  let [y, m] = earliestKey.split("-").map(Number);
  const [endY, endM] = nowKey.split("-").map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    months.push({ label: `T${m}/${String(y).slice(2)}`, value: sums.get(key) ?? 0 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

export function OverviewTab({
  investment,
  snapshots,
  transactions,
  valuations,
  financings,
}: {
  investment: Investment;
  snapshots: PerformanceSnapshot[];
  transactions: Transaction[];
  valuations: Valuation[];
  financings: Financing[];
}) {
  if (snapshots.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-input py-14 text-center text-[12.5px] text-muted-foreground">
        Chưa có dữ liệu hiệu suất. Thêm giao dịch và định giá để bắt đầu tính toán.
      </div>
    );
  }

  const latest = snapshots[snapshots.length - 1];

  return (
    <div className="flex flex-col gap-4">
      {investment.status === "disposed" && (
        <div className="rounded-[10px] bg-gold-soft px-3.5 py-2.5 text-[12.5px] font-medium text-gold-bright">
          Khoản đầu tư đã thanh lý — đây là số liệu cuối cùng, không còn cập nhật tự động nữa.
        </div>
      )}

      {investment.investment_type === "equity" ? (
        <>
          <EquityStats snapshot={latest} />
          <div className="rounded-[14px] border border-input bg-surface p-4">
            <div className="mb-1 text-[13px] font-bold">Giá trị hiện tại theo thời gian</div>
            <TrendChart points={snapshots.map((s) => ({ date: s.snapshot_date, value: s.current_value }))} />
          </div>
        </>
      ) : (
        <>
          <RentalPropertyStats
            investment={investment}
            snapshot={latest}
            transactions={transactions}
            valuations={valuations}
            financings={financings}
          />
          <div className="rounded-[14px] border border-input bg-surface p-4">
            <div className="mb-1 text-[13px] font-bold">Dòng tiền theo tháng</div>
            <MonthlyCashFlowChart months={buildMonthlyCashFlow(transactions)} />
          </div>
        </>
      )}
    </div>
  );
}

function EquityStats({ snapshot }: { snapshot: PerformanceSnapshot }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Giá trị hiện tại" value={formatVND(snapshot.current_value)} />
        <Stat label="Vốn đầu tư" value={formatVND(snapshot.invested_capital)} />
        <Stat label="Equity" value={formatVND(snapshot.equity)} />
        <Stat
          label="ROI"
          value={formatRatioAsPercent(snapshot.investment_return)}
          tone={snapshot.investment_return >= 0 ? "up" : "down"}
        />
        <Stat label="Tổng thu nhập" value={formatVND(snapshot.total_income)} />
        <Stat label="Tổng chi phí" value={formatVND(snapshot.total_expense)} />
        <Stat
          label="Dòng tiền"
          value={formatVND(snapshot.cash_flow)}
          tone={snapshot.cash_flow >= 0 ? "up" : "down"}
        />
        <Stat
          label="Lãi/lỗ chưa thực hiện"
          value={formatVND(snapshot.unrealized_gain ?? 0)}
          tone={(snapshot.unrealized_gain ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      {(snapshot.realized_gain ?? 0) !== 0 && (
        <Stat
          label="Lãi/lỗ đã thực hiện (từ các lần bán)"
          value={formatVND(snapshot.realized_gain ?? 0)}
          tone={(snapshot.realized_gain ?? 0) >= 0 ? "up" : "down"}
        />
      )}
    </>
  );
}

function RentalPropertyStats({
  investment,
  snapshot,
  transactions,
  valuations,
  financings,
}: {
  investment: Investment;
  snapshot: PerformanceSnapshot;
  transactions: Transaction[];
  valuations: Valuation[];
  financings: Financing[];
}) {
  const capitalContribution = sumByType(transactions, "capital_contribution");
  const originalFinancingPrincipal = financings.reduce((sum, f) => sum + f.principal_amount, 0);
  const purchaseValue = capitalContribution + originalFinancingPrincipal;

  const principalPaid = sumByType(transactions, "loan_principal_payment");
  const interestPaid = sumByType(transactions, "loan_interest_payment");
  const maintenanceExpense = sumByType(transactions, "maintenance_expense");
  const renovationExpense = sumByType(transactions, "renovation_expense");

  const valuation = latestValuation(valuations);
  const debtToAssetRatio = snapshot.current_value > 0 ? snapshot.outstanding_financing / snapshot.current_value : null;

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Giá trị tài sản khi mua" value={formatVND(purchaseValue)} sub={formatDate(investment.acquisition_date)} />
        <Stat
          label="Định giá gần nhất"
          value={valuation ? formatVND(valuation.estimated_value) : "—"}
          sub={valuation ? formatDate(valuation.valuation_date) : "Chưa có định giá"}
        />
        <Stat label="Dư nợ (còn lại)" value={formatVND(snapshot.outstanding_financing)} />
        <Stat
          label="Tỷ lệ dư nợ / Tài sản"
          value={debtToAssetRatio != null ? formatRatioAsPercent(debtToAssetRatio) : "—"}
          sub="Ước tính theo định giá"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Tổng vốn góp" value={formatVND(snapshot.invested_capital)} />
        <Stat label="Gốc đã trả đến hiện tại" value={formatVND(principalPaid)} />
        <Stat label="Lãi đã trả đến hiện tại" value={formatVND(interestPaid)} />
        <Stat label="Tổng chi phí vay" value={formatVND(principalPaid + interestPaid)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Tổng thu nhập cho thuê" value={formatVND(snapshot.total_income)} />
        <Stat label="Tổng chi phí (bảo trì, ...)" value={formatVND(maintenanceExpense + renovationExpense)} />
        <Stat
          label="Dòng tiền lũy kế đến hiện tại"
          value={formatVND(snapshot.cash_flow)}
          tone={snapshot.cash_flow >= 0 ? "up" : "down"}
        />
      </div>

      {snapshot.realized_gain != null && (
        <Stat
          label="Lãi/lỗ thực hiện (Thanh lý)"
          value={formatVND(snapshot.realized_gain)}
          tone={snapshot.realized_gain >= 0 ? "up" : "down"}
        />
      )}
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-input bg-surface p-3.5">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <span
        className={`text-[17px] font-bold tabular-nums ${
          tone === "up" ? "text-emerald" : tone === "down" ? "text-ruby" : ""
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-[10.5px] text-muted-foreground">{sub}</span>}
    </div>
  );
}
