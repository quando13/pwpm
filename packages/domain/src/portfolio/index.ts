// Portfolio-level aggregation across investments.
// Formulas: docs/product/calculation-spec.md, "Portfolio" section.
//
// Pure aggregation over each investment's LATEST performance_snapshots row — the
// caller (apps/web) is responsible for fetching those and shaping them into
// PortfolioPosition[]; this module does no I/O, per architecture.md.

import type { InvestmentType } from "@pwpm/shared";

export interface PortfolioPosition {
  investmentId: string;
  investmentType: InvestmentType;
  currentValue: number;
  outstandingFinancing: number;
  investedCapital: number;
  /** Cumulative cash flow since acquisition. */
  cashFlow: number;
  /** Trailing-12-month cash flow — Rental Property only, null for Equity. */
  cashFlowTtm: number | null;
  investmentReturn: number;
}

export interface PortfolioAllocationSlice {
  investmentType: InvestmentType;
  currentValue: number;
  /** Share of Total Portfolio Value, 0..1. */
  pct: number;
}

export interface PortfolioSummary {
  totalPortfolioValue: number;
  totalFinancing: number;
  netWorth: number;
  /** Σ(Rental cash_flow_ttm) + Σ(Equity cash_flow, cumulative) — see calculation-spec.md. */
  overallCashFlow: number;
  /** Capital-weighted, not a simple average of individual returns. */
  portfolioReturn: number;
  allocationByType: PortfolioAllocationSlice[];
}

export function computePortfolioSummary(positions: PortfolioPosition[]): PortfolioSummary {
  const totalPortfolioValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalFinancing = positions.reduce((sum, p) => sum + p.outstandingFinancing, 0);
  const netWorth = totalPortfolioValue - totalFinancing;

  const overallCashFlow = positions.reduce((sum, p) => {
    return sum + (p.investmentType === "rental_property" ? (p.cashFlowTtm ?? 0) : p.cashFlow);
  }, 0);

  const totalInvestedCapital = positions.reduce((sum, p) => sum + p.investedCapital, 0);
  const weightedReturnSum = positions.reduce((sum, p) => sum + p.investedCapital * p.investmentReturn, 0);
  const portfolioReturn = totalInvestedCapital > 0 ? weightedReturnSum / totalInvestedCapital : 0;

  const valueByType = new Map<InvestmentType, number>();
  for (const p of positions) {
    valueByType.set(p.investmentType, (valueByType.get(p.investmentType) ?? 0) + p.currentValue);
  }
  const allocationByType: PortfolioAllocationSlice[] = Array.from(valueByType.entries()).map(
    ([investmentType, currentValue]) => ({
      investmentType,
      currentValue,
      pct: totalPortfolioValue > 0 ? currentValue / totalPortfolioValue : 0,
    }),
  );

  return { totalPortfolioValue, totalFinancing, netWorth, overallCashFlow, portfolioReturn, allocationByType };
}
