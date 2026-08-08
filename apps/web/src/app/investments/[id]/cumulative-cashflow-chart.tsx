// Running cumulative net cash flow (rental income minus maintenance/renovation/interest/
// principal), bucketed by quarter so the point count stays low enough to render fully in
// one screen without scrolling, unlike a monthly bucketing which grows unbounded for a
// long-held property.
function formatCompactVND(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")} tr`;
  return `${sign}${abs.toLocaleString("vi-VN")} ₫`;
}

export function CumulativeCashFlowChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-[12.5px] text-muted-foreground">
        Chưa có dòng tiền nào được ghi nhận.
      </p>
    );
  }

  const last = points[points.length - 1];
  const lineColor = last.value >= 0 ? "var(--emerald)" : "var(--ruby)";

  if (points.length === 1) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-6">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: lineColor }} />
        <span className="text-lg font-bold tabular-nums">{formatCompactVND(last.value)}</span>
        <span className="text-[11px] text-muted-foreground">{last.label}</span>
      </div>
    );
  }

  const width = 720;
  const height = 150;
  const padX = 28;
  const padTop = 26;
  const padBottom = 20;
  const values = points.map((p) => p.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;

  const xFor = (i: number) => padX + (i / (points.length - 1)) * (width - padX * 2);
  const yFor = (v: number) => height - padBottom - ((v - min) / range) * (height - padTop - padBottom);
  const zeroY = yFor(0);

  const coords = points.map((p, i) => ({ x: xFor(i), y: yFor(p.value), ...p }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full" preserveAspectRatio="none">
      <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke="var(--input)" strokeDasharray="3 3" />
      <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c) => (
        <g key={c.label}>
          <circle
            cx={c.x}
            cy={c.y}
            r={c === coords[coords.length - 1] ? 3.5 : 2.5}
            fill={c.value >= 0 ? "var(--emerald)" : "var(--ruby)"}
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
          <text
            x={c.x}
            y={c.value >= 0 ? c.y - 8 : c.y + 15}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="700"
            fill="var(--foreground)"
          >
            {formatCompactVND(c.value)}
          </text>
          <text x={c.x} y={height - 4} textAnchor="middle" fontSize="9.5" fill="var(--muted-foreground)">
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
