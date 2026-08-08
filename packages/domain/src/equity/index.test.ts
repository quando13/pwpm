import { describe, expect, it } from "vitest";
import type { Financing, Transaction, Valuation } from "@pwpm/shared";

import { computeEquityHoldingState, computeEquitySnapshot } from "./index";

let seq = 0;
function tx(partial: Partial<Transaction> & Pick<Transaction, "transaction_type" | "transaction_date">): Transaction {
  seq += 1;
  return {
    id: `tx-${seq}`,
    investment_id: "inv-1",
    financing_id: null,
    amount: 0,
    quantity: null,
    price_per_unit: null,
    fee: 0,
    notes: null,
    created_at: `${partial.transaction_date}T00:00:0${seq}.000Z`,
    ...partial,
  };
}

function buy(date: string, quantity: number, pricePerUnit: number, fee = 0): Transaction {
  return tx({ transaction_type: "buy_shares", transaction_date: date, quantity, price_per_unit: pricePerUnit, fee });
}

function sell(date: string, quantity: number, pricePerUnit: number, fee = 0): Transaction {
  return tx({ transaction_type: "sell_shares", transaction_date: date, quantity, price_per_unit: pricePerUnit, fee });
}

function dividend(date: string, amount: number): Transaction {
  return tx({ transaction_type: "dividend_received", transaction_date: date, amount });
}

function brokerageFee(date: string, amount: number): Transaction {
  return tx({ transaction_type: "brokerage_fee", transaction_date: date, amount });
}

function marginInterest(date: string, amount: number): Transaction {
  return tx({ transaction_type: "loan_interest_payment", transaction_date: date, amount });
}

function marginPrincipal(date: string, amount: number): Transaction {
  return tx({ transaction_type: "loan_principal_payment", transaction_date: date, amount });
}

function financing(partial: Partial<Financing> & Pick<Financing, "principal_amount">): Financing {
  seq += 1;
  return {
    id: `fin-${seq}`,
    investment_id: "inv-1",
    source_type: "margin_loan",
    interest_rate: null,
    loan_term_months: null,
    start_date: "2026-01-01",
    lender_name: null,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function valuation(date: string, estimatedValue: number): Valuation {
  return {
    id: `val-${date}`,
    investment_id: "inv-1",
    valuation_date: date,
    estimated_value: estimatedValue,
    valuation_source: "market_reference",
    notes: null,
    created_at: `${date}T00:00:00.000Z`,
  };
}

describe("computeEquityHoldingState", () => {
  it("returns all zeros for zero transactions", () => {
    const state = computeEquityHoldingState([]);
    expect(state).toEqual({
      heldQuantity: 0,
      totalBuyCost: 0,
      totalBuyQuantity: 0,
      averageCostPerUnit: 0,
      remainingCostBasis: 0,
      realizedGain: 0,
    });
  });

  it("derives holding state from a single buy (first transaction)", () => {
    const state = computeEquityHoldingState([buy("2026-01-10", 100, 25_000, 50_000)]);
    expect(state.heldQuantity).toBe(100);
    expect(state.totalBuyCost).toBe(2_550_000);
    expect(state.averageCostPerUnit).toBe(25_500);
    expect(state.remainingCostBasis).toBe(2_550_000);
    expect(state.realizedGain).toBe(0);
  });

  it("blends multiple buys at different prices into one weighted average cost (BS-02)", () => {
    const state = computeEquityHoldingState([buy("2026-01-05", 100, 20_000, 20_000), buy("2026-02-05", 50, 22_000, 15_000)]);
    expect(state.heldQuantity).toBe(150);
    expect(state.totalBuyCost).toBe(3_135_000);
    expect(state.averageCostPerUnit).toBe(20_900);
    expect(state.remainingCostBasis).toBe(3_135_000);
  });

  it("uses the average cost as of each sale date, not the final average, for realized gain", () => {
    // buy 100 @ 20,000 -> avg 20,000
    // sell 40 @ 25,000 while avg is still 20,000 -> realized 40*(25,000-20,000) = 200,000
    // buy 60 @ 30,000 -> avg becomes (100*20,000 + 60*30,000) / 160 = 23,750
    const state = computeEquityHoldingState([
      buy("2026-01-01", 100, 20_000),
      sell("2026-02-01", 40, 25_000),
      buy("2026-03-01", 60, 30_000),
    ]);
    expect(state.heldQuantity).toBe(120);
    expect(state.totalBuyCost).toBe(3_800_000);
    expect(state.totalBuyQuantity).toBe(160);
    expect(state.averageCostPerUnit).toBe(23_750);
    expect(state.realizedGain).toBe(200_000);
    expect(state.remainingCostBasis).toBe(120 * 23_750);
  });

  it("processes transactions in date order regardless of array input order", () => {
    const chronological = computeEquityHoldingState([
      buy("2026-01-01", 100, 20_000),
      sell("2026-02-01", 40, 25_000),
      buy("2026-03-01", 60, 30_000),
    ]);
    const shuffled = computeEquityHoldingState([
      buy("2026-03-01", 60, 30_000),
      buy("2026-01-01", 100, 20_000),
      sell("2026-02-01", 40, 25_000),
    ]);
    expect(shuffled).toEqual(chronological);
  });

  it("subtracts sell fees from realized gain and deducts sold quantity from holdings", () => {
    const state = computeEquityHoldingState([buy("2026-01-01", 100, 20_000), sell("2026-06-01", 100, 22_000, 30_000)]);
    // realized = 100*(22,000-20,000) - 30,000 = 170,000
    expect(state.realizedGain).toBe(170_000);
    expect(state.heldQuantity).toBe(0);
    expect(state.remainingCostBasis).toBe(0);
  });
});

describe("computeEquitySnapshot", () => {
  it("returns a fully-zeroed, non-NaN snapshot for an investment with no activity yet", () => {
    const snapshot = computeEquitySnapshot({ transactions: [], financings: [], valuations: [] });
    expect(snapshot.current_value).toBe(0);
    expect(snapshot.invested_capital).toBe(0);
    expect(snapshot.investment_return).toBe(0);
    expect(snapshot.realized_gain).toBe(0);
    expect(snapshot.unrealized_gain).toBe(0);
    expect(snapshot.total_income_ttm).toBeNull();
    expect(snapshot.cash_on_cash_return).toBeNull();
  });

  it("reads Current Value as 0 when no Valuation has been recorded yet (documented behavior)", () => {
    const snapshot = computeEquitySnapshot({
      transactions: [buy("2026-01-10", 100, 25_000, 50_000)],
      financings: [],
      valuations: [],
    });
    expect(snapshot.current_value).toBe(0);
    expect(snapshot.invested_capital).toBe(2_550_000);
    // unrealized reads as a full loss until a real valuation exists — UI should treat
    // "no valuation" as its own empty state rather than rendering this figure directly.
    expect(snapshot.unrealized_gain).toBe(-2_550_000);
  });

  it("picks the latest valuation by date, not array order", () => {
    const snapshot = computeEquitySnapshot({
      transactions: [buy("2026-01-01", 10, 20_000)],
      financings: [],
      valuations: [valuation("2026-03-01", 30_000), valuation("2026-01-15", 21_000)],
    });
    expect(snapshot.current_value).toBe(10 * 30_000);
  });

  it("computes Total Income from dividends and Total Expense from buy/sell fees plus standalone brokerage_fee", () => {
    const snapshot = computeEquitySnapshot({
      transactions: [
        buy("2026-01-01", 100, 20_000, 20_000),
        sell("2026-06-01", 50, 25_000, 10_000),
        dividend("2026-04-01", 5_000),
        dividend("2026-10-01", 5_000),
        brokerageFee("2026-12-01", 3_000),
      ],
      financings: [],
      valuations: [valuation("2026-12-31", 26_000)],
    });
    expect(snapshot.total_income).toBe(10_000);
    expect(snapshot.total_expense).toBe(20_000 + 10_000 + 3_000);
    expect(snapshot.cash_flow).toBe(10_000 - 33_000);
  });

  it("matches BS-02's full lifecycle: multi-buy, partial sell, dividend, ROI", () => {
    // buy 100 @ 20,000 (fee 20,000) -> avg 20,200, cost 2,020,000
    // buy 50 @ 22,000 (fee 15,000) -> total cost 2,020,000 + 1,115,000 = 3,135,000, qty 150, avg 20,900
    // sell 60 @ 24,000 (fee 12,000) -> realized = 60*(24,000-20,900) - 12,000 = 174,000; held 90
    // dividend 8,000
    // valuation 23,000 -> current value 90*23,000 = 2,070,000
    const transactions = [
      buy("2026-01-05", 100, 20_000, 20_000),
      buy("2026-02-05", 50, 22_000, 15_000),
      sell("2026-05-01", 60, 24_000, 12_000),
      dividend("2026-06-01", 8_000),
    ];
    const snapshot = computeEquitySnapshot({ transactions, financings: [], valuations: [valuation("2026-06-30", 23_000)] });

    const heldQuantity = 90;
    const averageCostPerUnit = 20_900;
    const remainingCostBasis = heldQuantity * averageCostPerUnit;
    const currentValue = heldQuantity * 23_000;
    const realizedGain = 174_000;
    const unrealizedGain = currentValue - remainingCostBasis;
    const totalBuyCost = 3_135_000;
    const totalIncome = 8_000;

    expect(snapshot.invested_capital).toBe(remainingCostBasis);
    expect(snapshot.current_value).toBe(currentValue);
    expect(snapshot.realized_gain).toBe(realizedGain);
    expect(snapshot.unrealized_gain).toBeCloseTo(unrealizedGain, 6);
    expect(snapshot.investment_return).toBeCloseTo((unrealizedGain + realizedGain + totalIncome) / totalBuyCost, 10);
  });

  it("zeroes out holding fields once every share has been sold, without leaving stale cost basis", () => {
    const snapshot = computeEquitySnapshot({
      transactions: [buy("2026-01-01", 100, 20_000), sell("2026-06-01", 100, 22_000)],
      financings: [],
      valuations: [valuation("2026-07-01", 22_000)],
    });
    expect(snapshot.invested_capital).toBe(0);
    expect(snapshot.current_value).toBe(0);
    expect(snapshot.unrealized_gain).toBe(0);
    expect(snapshot.realized_gain).toBe(200_000);
  });

  describe("margin", () => {
    it("computes Outstanding Financing and Equity from margin financings, unaffected by principal payments to Invested Capital", () => {
      const transactions = [
        buy("2026-01-05", 100, 20_000, 20_000),
        marginPrincipal("2026-03-01", 300_000),
      ];
      const financings = [financing({ principal_amount: 1_000_000 })];
      const snapshot = computeEquitySnapshot({ transactions, financings, valuations: [valuation("2026-06-30", 25_000)] });

      // Total Buy Cost = 100*20,000 + 20,000 = 2,020,000 — Invested Capital untouched by margin.
      expect(snapshot.invested_capital).toBe(2_020_000);
      expect(snapshot.outstanding_financing).toBe(1_000_000 - 300_000);
      expect(snapshot.current_value).toBe(100 * 25_000);
      expect(snapshot.equity).toBe(snapshot.current_value - snapshot.outstanding_financing);
    });

    it("counts margin interest toward Total Expense and margin principal repayment toward Cash Flow, not Total Expense", () => {
      const transactions = [
        buy("2026-01-05", 100, 20_000),
        dividend("2026-04-01", 5_000),
        marginInterest("2026-05-01", 8_000),
        marginPrincipal("2026-05-01", 50_000),
      ];
      const financings = [financing({ principal_amount: 500_000 })];
      const snapshot = computeEquitySnapshot({ transactions, financings, valuations: [valuation("2026-06-30", 21_000)] });

      expect(snapshot.total_income).toBe(5_000);
      expect(snapshot.total_expense).toBe(8_000); // no buy/sell fees or brokerage_fee here
      expect(snapshot.cash_flow).toBe(5_000 - 8_000 - 50_000);
    });

    it("leaves Investment Return (ROI) exactly as it would be with no margin at all", () => {
      const transactions = [
        buy("2026-01-05", 100, 20_000, 20_000),
        sell("2026-05-01", 60, 24_000, 12_000),
        dividend("2026-06-01", 8_000),
      ];
      const valuations = [valuation("2026-06-30", 23_000)];

      const withoutMargin = computeEquitySnapshot({ transactions, financings: [], valuations });
      const withMargin = computeEquitySnapshot({
        transactions: [
          ...transactions,
          marginInterest("2026-05-15", 15_000),
          marginPrincipal("2026-05-15", 200_000),
        ],
        financings: [financing({ principal_amount: 400_000 })],
        valuations,
      });

      expect(withMargin.investment_return).toBeCloseTo(withoutMargin.investment_return, 10);
      expect(withMargin.invested_capital).toBe(withoutMargin.invested_capital);
      // Margin does change Equity/Cash Flow/Total Expense, just not ROI/Invested Capital.
      expect(withMargin.outstanding_financing).toBe(200_000);
      expect(withMargin.equity).toBe(withoutMargin.current_value - 200_000);
    });
  });
});
