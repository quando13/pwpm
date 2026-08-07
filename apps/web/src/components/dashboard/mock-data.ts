// Placeholder content for the Dashboard UI pass (2026-08-07). No investments, transactions,
// or performance_snapshots exist yet — this file stands in for Sprint 1-3's real data model
// and packages/domain calculations. Replace wholesale once those land; nothing here should
// survive as the real data source.

export const mockKpis = {
  netWorth: "4.850.320.000 ₫",
  netWorthDeltaLabel: "+9,8% so với đầu năm",
  portfolioValue: "5.318.760.000 ₫",
  outstandingFinancing: "468.440.000 ₫",
  cashFlowTtm: "+186.520.000 ₫",
  cashFlowDeltaLabel: "+12,4% so với kỳ trước",
};

export const mockAllocation = [
  { label: "Cổ phiếu", pct: 62, value: "3.297.630.000 ₫", color: "var(--emerald)" },
  { label: "BĐS cho thuê", pct: 38, value: "2.021.130.000 ₫", color: "var(--gold)" },
];

export const mockCashFlow = [
  { label: "T1", value: 14 },
  { label: "T2", value: 9 },
  { label: "T3", value: -6 },
  { label: "T4", value: 18 },
  { label: "T5", value: 11 },
  { label: "T6", value: 15 },
  { label: "T7", value: -4 },
  { label: "T8", value: 21 },
  { label: "T9", value: 17 },
  { label: "T10", value: 19 },
  { label: "T11", value: 23 },
  { label: "T12", value: 26 },
];

export type MockInvestment = {
  name: string;
  sub: string;
  type: "equity" | "rental";
  typeLabel: string;
  value: string;
  roi: string;
  roiUp: boolean;
  flagged: boolean;
};

export const mockInvestments: MockInvestment[] = [
  {
    name: "Căn hộ Riverside Q7",
    sub: "Mua 03/2022",
    type: "rental",
    typeLabel: "BĐS cho thuê",
    value: "2.850.000.000 ₫",
    roi: "+18,4%",
    roiUp: true,
    flagged: false,
  },
  {
    name: "FPT Corp",
    sub: "FPT · HOSE",
    type: "equity",
    typeLabel: "Cổ phiếu",
    value: "541.200.000 ₫",
    roi: "+24,1%",
    roiUp: true,
    flagged: false,
  },
  {
    name: "Vinamilk",
    sub: "VNM · HOSE",
    type: "equity",
    typeLabel: "Cổ phiếu",
    value: "618.900.000 ₫",
    roi: "+9,2%",
    roiUp: true,
    flagged: false,
  },
  {
    name: "Nhà phố Thủ Đức",
    sub: "Mua 11/2021",
    type: "rental",
    typeLabel: "BĐS cho thuê",
    value: "1.980.400.000 ₫",
    roi: "-3,1%",
    roiUp: false,
    flagged: true,
  },
  {
    name: "Hòa Phát",
    sub: "HPG · HOSE",
    type: "equity",
    typeLabel: "Cổ phiếu",
    value: "328.700.000 ₫",
    roi: "+5,6%",
    roiUp: true,
    flagged: false,
  },
];
