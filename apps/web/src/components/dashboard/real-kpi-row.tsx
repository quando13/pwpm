import type { PortfolioSummary } from "@pwpm/domain";
import { formatVND } from "@pwpm/utils";

import { TrendUpIcon } from "../icons";

export function RealKpiRow({
  summary,
  investmentCount,
}: {
  summary: PortfolioSummary;
  investmentCount: number;
}) {
  const financingPct =
    summary.totalPortfolioValue > 0 ? summary.totalFinancing / summary.totalPortfolioValue : 0;
  const cashFlowUp = summary.overallCashFlow >= 0;

  return (
    <section className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3">
      <div className="flex flex-col gap-1.5 rounded-[14px] border border-white/10 bg-gradient-to-br from-[var(--gold-deep)] via-gold to-gold-bright p-4 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
        <div className="text-[11.5px] font-semibold text-[color-mix(in_oklab,var(--gold-ink)_72%,transparent)]">
          Giá trị tài sản ròng
        </div>
        <div className="font-[var(--font-serif)] text-[30px] font-bold leading-none text-[var(--gold-ink)]">
          {formatVND(summary.netWorth)}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-[color-mix(in_oklab,var(--gold-ink)_72%,transparent)]">
          Toàn bộ danh mục, cập nhật đến hôm nay
        </div>
      </div>

      <KpiTile
        label="Tổng giá trị danh mục"
        value={formatVND(summary.totalPortfolioValue)}
        sub={`${investmentCount} khoản đầu tư`}
      />
      <KpiTile
        label="Dư nợ vay"
        value={formatVND(summary.totalFinancing)}
        sub={
          summary.totalFinancing > 0
            ? `${(financingPct * 100).toFixed(0)}% trên tổng giá trị`
            : "Không có khoản vay"
        }
      />
      <KpiTile
        label="Dòng tiền hiện tại"
        value={formatVND(summary.overallCashFlow)}
        sub="Lũy kế CP · 12 tháng BĐS"
        deltaUp={cashFlowUp}
      />
    </section>
  );
}

function KpiTile({
  label,
  value,
  sub,
  deltaUp,
}: {
  label: string;
  value: string;
  sub: string;
  deltaUp?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-input bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
      <div className="text-[11.5px] font-semibold text-muted-foreground">{label}</div>
      <div className="text-[25px] font-bold leading-none tracking-tight tabular-nums">{value}</div>
      <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        {deltaUp !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${deltaUp ? "text-emerald" : "text-ruby rotate-180"}`}
          >
            <TrendUpIcon className="h-[11px] w-[11px]" />
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}
