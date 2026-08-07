import { mockAllocation } from "./mock-data";

// Donut geometry: r=52, circumference = 2*pi*52 ≈ 326.7. Each segment's dash length
// is pct/100 * circumference, offset by the running total of prior segments (with a
// small gap trimmed off each end for the mark-spec surface gap between segments).
const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function AllocationCard() {
  let offset = 0;
  const segments = mockAllocation.map((slice) => {
    const length = (slice.pct / 100) * CIRCUMFERENCE;
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
      <div className="flex min-h-0 flex-1 items-center gap-4">
        <div className="relative h-[108px] w-[108px] flex-none">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--input)" strokeWidth="14" />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="text-[17px] font-bold leading-none">5,3 tỷ</b>
            <span className="mt-0.5 text-[9.5px] text-muted-foreground">Tổng giá trị</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2.5">
          {mockAllocation.map((slice) => (
            <div key={slice.label}>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 flex-none rounded-[3px]"
                  style={{ background: slice.color }}
                />
                <span className="flex-1 font-semibold text-muted-foreground">{slice.label}</span>
                <span className="font-bold tabular-nums">{slice.pct}%</span>
              </div>
              <div className="ml-[18px] -mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                {slice.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
