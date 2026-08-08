// Monthly-bucketed net cash flow (rental income minus maintenance/renovation/interest/
// principal), from the earliest cash-flow-relevant transaction through the current month.
// Adapted from the Dashboard mock's cashflow-card.tsx bar style, but real data — so the
// scale is computed from actual values instead of hardcoded, and the column count is
// unbounded (horizontally scrollable) instead of a fixed 12.
const CONTAINER_PX = 140;

function formatCompactVND(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")} tr`;
  return `${sign}${abs.toLocaleString("vi-VN")} ₫`;
}

export function MonthlyCashFlowChart({ months }: { months: { label: string; value: number }[] }) {
  if (months.length === 0) {
    return (
      <p className="py-10 text-center text-[12.5px] text-muted-foreground">
        Chưa có dòng tiền nào được ghi nhận.
      </p>
    );
  }

  const values = months.map((m) => m.value);
  const maxPos = Math.max(0, ...values);
  const maxNeg = Math.max(0, ...values.map((v) => -v));
  const totalRange = maxPos + maxNeg || 1;
  const baselineFromTop = (maxPos / totalRange) * CONTAINER_PX;
  const pxPerUnit = CONTAINER_PX / totalRange;

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="relative" style={{ height: CONTAINER_PX, minWidth: months.length * 34 }}>
          <div
            className="absolute inset-x-0 border-t border-dashed border-input"
            style={{ top: baselineFromTop }}
          />
          <div className="grid h-full gap-[5px]" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
            {months.map((m) => {
              const isPos = m.value >= 0;
              const barHeight = Math.abs(m.value) * pxPerUnit;
              return (
                <div key={m.label} className="group relative h-full">
                  <div
                    className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-foreground px-[5px] py-[2px] text-[10px] font-bold tabular-nums text-background opacity-0 transition-opacity group-hover:opacity-100 ${
                      isPos ? "bottom-full mb-1" : "top-full mt-1"
                    }`}
                    style={
                      isPos
                        ? { bottom: `calc(100% - ${baselineFromTop - barHeight}px)` }
                        : { top: `calc(${baselineFromTop + barHeight}px)` }
                    }
                  >
                    {m.value > 0 ? "+" : ""}
                    {formatCompactVND(m.value)}
                  </div>
                  <div
                    className={`absolute left-[8%] right-[8%] min-h-px group-hover:brightness-115 ${
                      isPos ? "rounded-t-[3px] rounded-b-[2px] bg-emerald" : "rounded-b-[3px] rounded-t-[2px] bg-ruby"
                    }`}
                    style={
                      isPos
                        ? { height: barHeight, bottom: CONTAINER_PX - baselineFromTop }
                        : { height: barHeight, top: baselineFromTop }
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1 grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)`, minWidth: months.length * 34 }}>
          {months.map((m) => (
            <span key={m.label} className="whitespace-nowrap text-center text-[9.5px] text-muted-foreground">
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
