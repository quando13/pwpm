import type { PortfolioSummary } from "@pwpm/domain";
import { formatVND } from "@pwpm/utils";

import { INVESTMENT_TYPE_LABEL } from "@/lib/investments/labels";

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;
const COLOR_BY_TYPE: Record<string, string> = {
  equity: "var(--emerald)",
  rental_property: "var(--gold)",
};

function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".", ",")} tr`;
  return formatVND(amount);
}

export function RealAllocationCard({ summary }: { summary: PortfolioSummary }) {
  let offset = 0;
  const segments = summary.allocationByType.map((slice) => {
    const length = slice.pct * CIRCUMFERENCE;
    const seg = { ...slice, length: Math.max(length - 3, 0), offset: -offset };
    offset += length;
    return seg;
  });

  return (
    <div className="flex min-h-0 flex-col rounded-[14px] border border-input bg-surface p-4 pb-3 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-bold">Phân bổ danh mục</span>
        <span className="text-[11px] text-muted-foreground">Theo loại tài sản</span>
      </div>
      {segments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[12px] text-muted-foreground">
          Chưa có dữ liệu định giá
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center gap-4">
          <div className="relative h-[108px] w-[108px] flex-none">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--input)" strokeWidth="14" />
              {segments.map((seg) => (
                <circle
                  key={seg.investmentType}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={COLOR_BY_TYPE[seg.investmentType]}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                  strokeDashoffset={seg.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <b className="text-[17px] font-bold leading-none">{formatCompactVND(summary.totalPortfolioValue)}</b>
              <span className="mt-0.5 text-[9.5px] text-muted-foreground">Tổng giá trị</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2.5">
            {segments.map((slice) => (
              <div key={slice.investmentType}>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-[3px]"
                    style={{ background: COLOR_BY_TYPE[slice.investmentType] }}
                  />
                  <span className="flex-1 font-semibold text-muted-foreground">
                    {INVESTMENT_TYPE_LABEL[slice.investmentType as keyof typeof INVESTMENT_TYPE_LABEL]}
                  </span>
                  <span className="font-bold tabular-nums">{(slice.pct * 100).toFixed(0)}%</span>
                </div>
                <div className="ml-[18px] -mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                  {formatVND(slice.currentValue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
