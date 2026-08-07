import { mockKpis } from "./mock-data";
import { TrendUpIcon } from "./icons";

export function KpiRow() {
  return (
    <section className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3">
      <div className="flex flex-col gap-1.5 rounded-[14px] border border-white/10 bg-gradient-to-br from-[var(--gold-deep)] via-gold to-gold-bright p-4 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
        <div className="text-[11.5px] font-semibold text-[color-mix(in_oklab,var(--gold-ink)_72%,transparent)]">
          Giá trị tài sản ròng
        </div>
        <div className="font-[var(--font-serif)] text-[30px] font-bold leading-none text-[var(--gold-ink)]">
          {mockKpis.netWorth}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-[color-mix(in_oklab,var(--gold-ink)_72%,transparent)]">
          <span className="inline-flex items-center gap-0.5 font-bold text-[#0f5c3d]">
            <TrendUpIcon className="h-[11px] w-[11px]" />
          </span>
          {mockKpis.netWorthDeltaLabel}
        </div>
      </div>

      <KpiTile label="Tổng giá trị danh mục" value={mockKpis.portfolioValue} sub="Cổ phiếu & bất động sản" />
      <KpiTile label="Dư nợ vay" value={mockKpis.outstandingFinancing} sub="1 khoản vay đang hoạt động" />
      <KpiTile
        label="Dòng tiền 12 tháng"
        value={mockKpis.cashFlowTtm}
        sub={mockKpis.cashFlowDeltaLabel}
        deltaUp
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
        {deltaUp && (
          <span className="inline-flex items-center gap-0.5 font-bold text-emerald">
            <TrendUpIcon className="h-[11px] w-[11px]" />
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}
