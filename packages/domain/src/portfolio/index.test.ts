import { describe, expect, it } from "vitest";

import { computePortfolioSummary, type PortfolioPosition } from "./index";

function equityPosition(partial: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    investmentId: "eq-1",
    investmentType: "equity",
    currentValue: 0,
    outstandingFinancing: 0,
    investedCapital: 0,
    cashFlow: 0,
    cashFlowTtm: null,
    investmentReturn: 0,
    ...partial,
  };
}

function rentalPosition(partial: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    investmentId: "rp-1",
    investmentType: "rental_property",
    currentValue: 0,
    outstandingFinancing: 0,
    investedCapital: 0,
    cashFlow: 0,
    cashFlowTtm: 0,
    investmentReturn: 0,
    ...partial,
  };
}

describe("computePortfolioSummary", () => {
  it("returns all zeros for an empty portfolio", () => {
    const summary = computePortfolioSummary([]);
    expect(summary.totalPortfolioValue).toBe(0);
    expect(summary.totalFinancing).toBe(0);
    expect(summary.netWorth).toBe(0);
    expect(summary.overallCashFlow).toBe(0);
    expect(summary.portfolioReturn).toBe(0);
    expect(summary.allocationByType).toEqual([]);
  });

  it("uses cumulative Cash Flow for a single Equity position (no TTM variant)", () => {
    const summary = computePortfolioSummary([
      equityPosition({ investmentId: "e1", currentValue: 15_000_000, investedCapital: 13_000_000, cashFlow: 500_000, cashFlowTtm: null, investmentReturn: 0.15 }),
    ]);
    expect(summary.overallCashFlow).toBe(500_000);
    expect(summary.portfolioReturn).toBeCloseTo(0.15, 10);
    expect(summary.allocationByType).toEqual([{ investmentType: "equity", currentValue: 15_000_000, pct: 1 }]);
  });

  it("uses trailing-12-month Cash Flow for a single Rental Property position", () => {
    const summary = computePortfolioSummary([
      rentalPosition({
        investmentId: "r1",
        currentValue: 2_000_000_000,
        outstandingFinancing: 1_170_000_000,
        investedCapital: 600_000_000,
        cashFlow: -2_000_000,
        cashFlowTtm: -2_000_000,
        investmentReturn: 0.38,
      }),
    ]);
    expect(summary.overallCashFlow).toBe(-2_000_000);
    expect(summary.totalFinancing).toBe(1_170_000_000);
    expect(summary.netWorth).toBe(2_000_000_000 - 1_170_000_000);
  });

  it("aggregates a mixed Equity + Rental Property portfolio correctly", () => {
    const equity = equityPosition({
      investmentId: "e1",
      currentValue: 15_000_000,
      outstandingFinancing: 0,
      investedCapital: 13_000_000,
      cashFlow: 500_000,
      cashFlowTtm: null,
      investmentReturn: 0.15,
    });
    const rental = rentalPosition({
      investmentId: "r1",
      currentValue: 2_000_000_000,
      outstandingFinancing: 1_170_000_000,
      investedCapital: 600_000_000,
      cashFlow: -2_000_000,
      cashFlowTtm: -2_000_000,
      investmentReturn: 0.38,
    });

    const summary = computePortfolioSummary([equity, rental]);

    const totalPortfolioValue = 15_000_000 + 2_000_000_000;
    const totalFinancing = 1_170_000_000;
    expect(summary.totalPortfolioValue).toBe(totalPortfolioValue);
    expect(summary.totalFinancing).toBe(totalFinancing);
    expect(summary.netWorth).toBe(totalPortfolioValue - totalFinancing);

    // Equity contributes cumulative Cash Flow; Rental contributes TTM.
    expect(summary.overallCashFlow).toBe(500_000 + -2_000_000);

    // Capital-weighted, not a plain average of 0.15 and 0.38.
    const totalInvestedCapital = 13_000_000 + 600_000_000;
    const weightedSum = 13_000_000 * 0.15 + 600_000_000 * 0.38;
    expect(summary.portfolioReturn).toBeCloseTo(weightedSum / totalInvestedCapital, 10);
    expect(summary.portfolioReturn).toBeGreaterThan(0.3); // dominated by the much larger Rental position
    expect(summary.portfolioReturn).toBeLessThan(0.38); // pulled down slightly by Equity's lower return

    const equitySlice = summary.allocationByType.find((s) => s.investmentType === "equity")!;
    const rentalSlice = summary.allocationByType.find((s) => s.investmentType === "rental_property")!;
    expect(equitySlice.pct).toBeCloseTo(15_000_000 / totalPortfolioValue, 10);
    expect(rentalSlice.pct).toBeCloseTo(2_000_000_000 / totalPortfolioValue, 10);
    expect(equitySlice.pct + rentalSlice.pct).toBeCloseTo(1, 10);
  });

  it("groups multiple positions of the same type into one allocation slice", () => {
    const summary = computePortfolioSummary([
      equityPosition({ investmentId: "e1", currentValue: 10_000_000, investedCapital: 10_000_000 }),
      equityPosition({ investmentId: "e2", currentValue: 30_000_000, investedCapital: 30_000_000 }),
    ]);
    expect(summary.allocationByType).toHaveLength(1);
    expect(summary.allocationByType[0]).toEqual({ investmentType: "equity", currentValue: 40_000_000, pct: 1 });
  });

  it("guards portfolioReturn against zero total invested capital", () => {
    const summary = computePortfolioSummary([
      equityPosition({ investmentId: "e1", currentValue: 1_000_000, investedCapital: 0, investmentReturn: 0 }),
    ]);
    expect(summary.portfolioReturn).toBe(0);
  });
});
