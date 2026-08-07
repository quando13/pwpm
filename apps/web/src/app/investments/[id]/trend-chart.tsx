import { formatDate, formatVND } from "@pwpm/utils";

// Small line chart for a single metric's history. Deliberately handles 0/1/N points —
// most investments will have exactly one performance_snapshots row (today's) for a
// while, since history only accumulates day over day.
export function TrendChart({
  points,
  color = "var(--emerald)",
}: {
  points: { date: string; value: number }[];
  color?: string;
}) {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-[12.5px] text-muted-foreground">
        Chưa có đủ dữ liệu để hiển thị biểu đồ.
      </p>
    );
  }

  if (points.length === 1) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-8">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-lg font-bold tabular-nums">{formatVND(points[0].value)}</span>
        <span className="text-[11px] text-muted-foreground">{formatDate(points[0].date)}</span>
      </div>
    );
  }

  const width = 600;
  const height = 140;
  const padding = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: padding + (i / (points.length - 1)) * (width - padding * 2),
    y: height - padding - ((p.value - min) / range) * (height - padding * 2),
    ...p,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[140px] w-full" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={first.x} cy={first.y} r="3" fill="var(--surface)" stroke={color} strokeWidth="2" />
      <circle cx={last.x} cy={last.y} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />
      <text
        x={Math.min(last.x, width - 4)}
        y={Math.max(last.y - 10, 12)}
        textAnchor="end"
        fontSize="11"
        fontWeight="700"
        fill="var(--foreground)"
      >
        {formatVND(last.value)}
      </text>
    </svg>
  );
}
