// VND formatting only — no currency conversion in MVP, per docs/technical/data-model.md.

const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVND(amount: number): string {
  return VND_FORMATTER.format(amount);
}

export function formatRatioAsPercent(ratio: number, fractionDigits = 1): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}
