import { formatRatioAsPercent, formatVND } from "@pwpm/utils";
import type { Investment, PerformanceSnapshot } from "@pwpm/shared";

import { TrendChart } from "./trend-chart";

export function OverviewTab({
  investment,
  snapshots,
}: {
  investment: Investment;
  snapshots: PerformanceSnapshot[];
}) {
  if (investment.investment_type !== "equity") {
    return (
      <div className="rounded-[14px] border border-dashed border-input py-14 text-center text-[12.5px] text-muted-foreground">
        Chưa hỗ trợ tính hiệu suất cho BĐS cho thuê — cần Financing &amp; công thức của Sprint 2.1.
      </div>
    );
  }

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
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Giá trị hiện tại" value={formatVND(latest.current_value)} />
        <Stat label="Vốn đầu tư" value={formatVND(latest.invested_capital)} />
        <Stat label="Equity" value={formatVND(latest.equity)} />
        <Stat
          label="ROI"
          value={formatRatioAsPercent(latest.investment_return)}
          tone={latest.investment_return >= 0 ? "up" : "down"}
        />
        <Stat label="Tổng thu nhập" value={formatVND(latest.total_income)} />
        <Stat label="Tổng chi phí" value={formatVND(latest.total_expense)} />
        <Stat label="Dòng tiền" value={formatVND(latest.cash_flow)} tone={latest.cash_flow >= 0 ? "up" : "down"} />
        <Stat
          label="Lãi/lỗ chưa thực hiện"
          value={formatVND(latest.unrealized_gain ?? 0)}
          tone={(latest.unrealized_gain ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      {(latest.realized_gain ?? 0) !== 0 && (
        <Stat
          label="Lãi/lỗ đã thực hiện (từ các lần bán)"
          value={formatVND(latest.realized_gain ?? 0)}
          tone={(latest.realized_gain ?? 0) >= 0 ? "up" : "down"}
        />
      )}

      <div className="rounded-[14px] border border-input bg-surface p-4">
        <div className="mb-1 text-[13px] font-bold">Giá trị hiện tại theo thời gian</div>
        <TrendChart points={snapshots.map((s) => ({ date: s.snapshot_date, value: s.current_value }))} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
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
    </div>
  );
}
