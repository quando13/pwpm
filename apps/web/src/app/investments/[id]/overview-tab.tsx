import { latestValuation } from "@pwpm/domain";
import { formatDate, formatRatioAsPercent, formatVND } from "@pwpm/utils";
import type { Financing, Investment, PerformanceSnapshot, Transaction, Valuation } from "@pwpm/shared";

import { CumulativeCashFlowChart } from "./cumulative-cashflow-chart";
import { TrendChart } from "./trend-chart";

function sumByType(transactions: Transaction[], type: Transaction["transaction_type"]): number {
  return transactions.filter((tx) => tx.transaction_type === type).reduce((sum, tx) => sum + tx.amount, 0);
}

// Rental *business* operating cash flow only — rental income minus maintenance/renovation
// — deliberately excludes loan_principal_payment/loan_interest_payment (confirmed
// 2026-08-09): this chart treats the property as an independent rental operation, separate
// from how it's financed. Debt service shows up instead in Row 2's "Tổng vốn góp" figure.
const OPERATING_CASH_FLOW_TYPE_SIGN: Record<string, 1 | -1> = {
  rental_income: 1,
  maintenance_expense: -1,
  renovation_expense: -1,
};

function halfYearOf(dateStr: string): { year: number; half: 1 | 2 } {
  const [year, month] = dateStr.split("-").map(Number);
  return { year, half: month <= 6 ? 1 : 2 };
}

// Only the most recent N periods are shown — a long-held property (e.g. CT1, acquired
// 2008) can accumulate decades of half-year points, which would defeat the "fits on one
// screen" goal even at semi-annual granularity. The cumulative value at each shown point
// still reflects the FULL history (computed from the true earliest period, not restarted
// at the visible window) — only the trailing slice of already-cumulative points is dropped.
const VISIBLE_PERIODS = 8;

// Running cumulative operating cash flow bucketed by half-year (matches the fiscal-year
// S1/S2 convention the customer already uses for loan statements) — keeps the point count
// low enough to render in full without horizontal scrolling even for a multi-year holding.
function buildSemiAnnualOperatingCashFlow(transactions: Transaction[]): { label: string; value: number }[] {
  const relevant = transactions.filter((tx) => tx.transaction_type in OPERATING_CASH_FLOW_TYPE_SIGN);
  if (relevant.length === 0) return [];

  const deltaByHalf = new Map<string, number>();
  for (const tx of relevant) {
    const { year, half } = halfYearOf(tx.transaction_date);
    const key = `${year}-S${half}`;
    const sign = OPERATING_CASH_FLOW_TYPE_SIGN[tx.transaction_type];
    deltaByHalf.set(key, (deltaByHalf.get(key) ?? 0) + sign * tx.amount);
  }

  const halves = relevant.map((tx) => halfYearOf(tx.transaction_date));
  let { year, half } = halves.reduce((earliest, h) =>
    h.year < earliest.year || (h.year === earliest.year && h.half < earliest.half) ? h : earliest,
  );
  const now = new Date();
  const currentHalf = { year: now.getFullYear(), half: (now.getMonth() + 1 <= 6 ? 1 : 2) as 1 | 2 };

  const points: { label: string; value: number }[] = [];
  let cumulative = 0;
  while (year < currentHalf.year || (year === currentHalf.year && half <= currentHalf.half)) {
    cumulative += deltaByHalf.get(`${year}-S${half}`) ?? 0;
    points.push({ label: `S${half}/${String(year).slice(2)}`, value: cumulative });
    half = half === 1 ? 2 : 1;
    if (half === 1) year += 1;
  }
  return points.slice(-VISIBLE_PERIODS);
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
            <div className="mb-1 text-[13px] font-bold">Dòng tiền kinh doanh cho thuê lũy kế (theo kỳ 6 tháng)</div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Chỉ tính thu nhập cho thuê và chi phí bảo trì/cải tạo — như một hoạt động kinh doanh độc lập, chưa gồm gốc/lãi vay.
            </p>
            <CumulativeCashFlowChart points={buildSemiAnnualOperatingCashFlow(transactions)} />
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

      {snapshot.outstanding_financing !== 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Dư nợ margin" value={formatVND(snapshot.outstanding_financing)} />
          <Stat
            label="Equity ròng (sau margin)"
            value={formatVND(snapshot.equity)}
            sub="Giá trị hiện tại − Dư nợ margin. ROI ở trên chưa tính đòn bẩy margin."
          />
        </div>
      )}

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
        <Stat label="Vốn góp ban đầu" value={formatVND(snapshot.invested_capital)} />
        <Stat label="Gốc đã trả đến hiện tại" value={formatVND(principalPaid)} />
        <Stat label="Lãi đã trả đến hiện tại" value={formatVND(interestPaid)} />
        <Stat
          label="Tổng vốn góp"
          value={formatVND(snapshot.invested_capital + principalPaid + interestPaid)}
          sub="Vốn góp ban đầu + gốc + lãi đã trả — tổng đã góp cho tài sản này"
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
