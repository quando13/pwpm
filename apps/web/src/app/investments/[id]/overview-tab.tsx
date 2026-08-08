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
        <EquityStats snapshot={latest} />
      ) : (
        <RentalPropertyStats snapshot={latest} />
      )}

      <div className="rounded-[14px] border border-input bg-surface p-4">
        <div className="mb-1 text-[13px] font-bold">Giá trị hiện tại theo thời gian</div>
        <TrendChart points={snapshots.map((s) => ({ date: s.snapshot_date, value: s.current_value }))} />
      </div>
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

function RentalPropertyStats({ snapshot }: { snapshot: PerformanceSnapshot }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Giá trị hiện tại" value={formatVND(snapshot.current_value)} />
        <Stat label="Dư nợ" value={formatVND(snapshot.outstanding_financing)} />
        <Stat label="Equity" value={formatVND(snapshot.equity)} />
        <Stat
          label="Tổng lợi nhuận (Total Return)"
          value={formatRatioAsPercent(snapshot.investment_return)}
          tone={snapshot.investment_return >= 0 ? "up" : "down"}
        />
        <Stat label="Vốn góp" value={formatVND(snapshot.invested_capital)} />
        <Stat
          label="Cash-on-Cash Return (12 tháng)"
          value={snapshot.cash_on_cash_return != null ? formatRatioAsPercent(snapshot.cash_on_cash_return) : "—"}
          tone={(snapshot.cash_on_cash_return ?? 0) >= 0 ? "up" : "down"}
        />
        <Stat
          label="Dòng tiền (lũy kế)"
          value={formatVND(snapshot.cash_flow)}
          tone={snapshot.cash_flow >= 0 ? "up" : "down"}
        />
        <Stat
          label="Dòng tiền (12 tháng)"
          value={snapshot.cash_flow_ttm != null ? formatVND(snapshot.cash_flow_ttm) : "—"}
          tone={(snapshot.cash_flow_ttm ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Tổng thu nhập (lũy kế)" value={formatVND(snapshot.total_income)} />
        <Stat label="Tổng thu nhập (12 tháng)" value={formatVND(snapshot.total_income_ttm ?? 0)} />
        <Stat label="Tổng chi phí (lũy kế)" value={formatVND(snapshot.total_expense)} />
        <Stat label="Tổng chi phí (12 tháng)" value={formatVND(snapshot.total_expense_ttm ?? 0)} />
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
