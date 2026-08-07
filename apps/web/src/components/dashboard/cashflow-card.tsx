import { mockCashFlow } from "./mock-data";

// Container is 96px tall; baseline sits 78px from the top (18px reserved below for
// the lowest negative bar). 3px per unit is exact for this mock data's range (max
// +26, min -6 => 32-unit range over 96px).
const CONTAINER_PX = 96;
const BASELINE_FROM_TOP_PX = 78;
const PX_PER_UNIT = 3;

export function CashflowCard() {
  return (
    <div className="flex min-h-0 flex-col rounded-[14px] border border-input bg-surface p-4 pb-3 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-bold">Dòng tiền theo tháng</span>
        <span className="text-[11px] text-muted-foreground">Đơn vị: triệu đồng</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex-1" style={{ height: CONTAINER_PX }}>
          <div
            className="absolute inset-x-0 border-t border-dashed border-input"
            style={{ top: BASELINE_FROM_TOP_PX }}
          />
          <div className="grid h-full grid-cols-12 gap-[5px]">
            {mockCashFlow.map((m) => {
              const isPos = m.value >= 0;
              const barHeight = Math.abs(m.value) * PX_PER_UNIT;
              return (
                <div key={m.label} className="group relative h-full">
                  <div
                    className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-foreground px-[5px] py-[2px] text-[10px] font-bold tabular-nums text-background opacity-0 transition-opacity group-hover:opacity-100 ${
                      isPos ? "bottom-full mb-1" : "top-full mt-1"
                    }`}
                    style={isPos ? { bottom: `calc(100% - ${BASELINE_FROM_TOP_PX - barHeight}px)` } : undefined}
                  >
                    {m.value > 0 ? "+" : ""}
                    {m.value} tr
                  </div>
                  <div
                    className={`absolute left-[8%] right-[8%] group-hover:brightness-115 ${
                      isPos ? "rounded-t-[3px] rounded-b-[2px] bg-emerald" : "rounded-b-[3px] rounded-t-[2px] bg-ruby"
                    }`}
                    style={
                      isPos
                        ? { height: barHeight, bottom: CONTAINER_PX - BASELINE_FROM_TOP_PX }
                        : { height: barHeight, top: BASELINE_FROM_TOP_PX }
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1 grid grid-cols-12 gap-[5px]">
          {mockCashFlow.map((m) => (
            <span key={m.label} className="text-center text-[9.5px] text-muted-foreground">
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
