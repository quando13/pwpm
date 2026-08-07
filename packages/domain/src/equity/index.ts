// Equity Performance Snapshot calculator.
// Formulas: docs/product/calculation-spec.md, "Equity Investment" section
// (confirmed 2026-08-07: Total Expense includes standalone brokerage_fee transactions;
// capital_contribution is not a valid Equity transaction type).

import type { Transaction, Valuation } from "@pwpm/shared";

import { latestValuation } from "../lib/valuations";
import type { ComputedSnapshot } from "../types";

export interface EquityHoldingState {
  /** Σ(buy.quantity) − Σ(sell.quantity), as of the last processed transaction. */
  heldQuantity: number;
  /** Σ(buy.quantity × buy.price_per_unit + buy.fee) across every buy ever recorded. */
  totalBuyCost: number;
  /** Σ(buy.quantity) across every buy ever recorded. */
  totalBuyQuantity: number;
  /**
   * totalBuyCost ÷ totalBuyQuantity — a running ratio over every buy ever recorded.
   * Per calculation-spec.md's literal formula this is NOT reduced for shares already
   * sold (MVP does not track per-lot disposal order); a sell never changes it, only
   * a subsequent buy does.
   */
  averageCostPerUnit: number;
  /** heldQuantity × averageCostPerUnit. */
  remainingCostBasis: number;
  /**
   * Σ(sell.quantity × (sell.price_per_unit − averageCostPerUnit at time of sale)) − Σ(sell.fee).
   * Computed progressively in transaction-date order per the spec's Assumption, since a
   * sale's realized gain depends on the average cost as of that moment, not the final one.
   */
  realizedGain: number;
}

const EPOCH = "0000-00-00T00:00:00.000Z";

function chronological(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date < b.transaction_date ? -1 : 1;
    }
    const aCreated = a.created_at || EPOCH;
    const bCreated = b.created_at || EPOCH;
    return aCreated < bCreated ? -1 : aCreated > bCreated ? 1 : 0;
  });
}

export function computeEquityHoldingState(transactions: Transaction[]): EquityHoldingState {
  let heldQuantity = 0;
  let totalBuyCost = 0;
  let totalBuyQuantity = 0;
  let averageCostPerUnit = 0;
  let realizedGain = 0;

  for (const tx of chronological(transactions)) {
    if (tx.transaction_type === "buy_shares") {
      const quantity = tx.quantity ?? 0;
      const cost = quantity * (tx.price_per_unit ?? 0) + (tx.fee ?? 0);

      totalBuyCost += cost;
      totalBuyQuantity += quantity;
      averageCostPerUnit = totalBuyQuantity > 0 ? totalBuyCost / totalBuyQuantity : 0;
      heldQuantity += quantity;
    } else if (tx.transaction_type === "sell_shares") {
      const quantity = tx.quantity ?? 0;
      const fee = tx.fee ?? 0;

      realizedGain += quantity * ((tx.price_per_unit ?? 0) - averageCostPerUnit) - fee;
      heldQuantity -= quantity;
    }
  }

  const remainingCostBasis = heldQuantity * averageCostPerUnit;

  return { heldQuantity, totalBuyCost, totalBuyQuantity, averageCostPerUnit, remainingCostBasis, realizedGain };
}

export interface EquitySnapshotInput {
  transactions: Transaction[];
  valuations: Valuation[];
}

export function computeEquitySnapshot({ transactions, valuations }: EquitySnapshotInput): ComputedSnapshot {
  const holding = computeEquityHoldingState(transactions);
  const valuation = latestValuation(valuations);

  const currentValue = holding.heldQuantity * (valuation?.estimated_value ?? 0);
  const investedCapital = holding.remainingCostBasis;
  const outstandingFinancing = 0;
  const equity = currentValue - outstandingFinancing;

  const totalIncome = transactions
    .filter((tx) => tx.transaction_type === "dividend_received")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const buyFees = transactions
    .filter((tx) => tx.transaction_type === "buy_shares")
    .reduce((sum, tx) => sum + (tx.fee ?? 0), 0);
  const sellFees = transactions
    .filter((tx) => tx.transaction_type === "sell_shares")
    .reduce((sum, tx) => sum + (tx.fee ?? 0), 0);
  const brokerageFees = transactions
    .filter((tx) => tx.transaction_type === "brokerage_fee")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = buyFees + sellFees + brokerageFees;

  const cashFlow = totalIncome - totalExpense;
  const unrealizedGain = currentValue - holding.remainingCostBasis;
  const investmentReturn =
    holding.totalBuyCost > 0 ? (unrealizedGain + holding.realizedGain + totalIncome) / holding.totalBuyCost : 0;

  return {
    current_value: currentValue,
    invested_capital: investedCapital,
    outstanding_financing: outstandingFinancing,
    equity,
    total_income: totalIncome,
    total_expense: totalExpense,
    cash_flow: cashFlow,
    investment_return: investmentReturn,
    // Equity does not compute trailing-12-month figures — see Snapshot Periods in calculation-spec.md.
    total_income_ttm: null,
    total_expense_ttm: null,
    cash_flow_ttm: null,
    cash_on_cash_return: null,
    // Equity always populates both, per data-model.md's nullability rule.
    realized_gain: holding.realizedGain,
    unrealized_gain: unrealizedGain,
  };
}
