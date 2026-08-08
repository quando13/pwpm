// Rental Property Performance Snapshot calculator.
// Formulas: docs/product/calculation-spec.md, "Rental Property Investment" section
// (Classification Rule confirmed 2026-08-06, Snapshot Periods, Disposal).

import type { Financing, Transaction, TransactionType, Valuation } from "@pwpm/shared";

import { computeOutstandingFinancing } from "../lib/financing";
import { latestValuation } from "../lib/valuations";
import type { ComputedSnapshot } from "../types";

// Re-exported here for backward compatibility — moved to lib/financing.ts since it's now
// shared with Equity margin, not rental-specific.
export { computeOutstandingFinancing };

export function computeRentalPropertyInvestedCapital(transactions: Transaction[]): number {
  return sumByType(transactions, "capital_contribution");
}

function sumByType(transactions: Transaction[], type: TransactionType): number {
  return transactions.filter((tx) => tx.transaction_type === type).reduce((sum, tx) => sum + tx.amount, 0);
}

/** [snapshotDate − 12 months, snapshotDate] inclusive, per calculation-spec.md "Snapshot Periods". */
function isWithinTrailing12Months(dateStr: string, asOfDate: string): boolean {
  const date = new Date(dateStr);
  const cutoff = new Date(asOfDate);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return date > cutoff && date <= new Date(asOfDate);
}

export interface RentalPropertySnapshotInput {
  transactions: Transaction[];
  financings: Financing[];
  valuations: Valuation[];
  /** ISO date this snapshot is computed as of — defines the trailing-12-month window. */
  snapshotDate: string;
}

export function computeRentalPropertySnapshot({
  transactions,
  financings,
  valuations,
  snapshotDate,
}: RentalPropertySnapshotInput): ComputedSnapshot {
  const principalPaid = sumByType(transactions, "loan_principal_payment");
  const outstandingFinancing = computeOutstandingFinancing(financings, transactions);

  const investedCapital = computeRentalPropertyInvestedCapital(transactions);

  const valuation = latestValuation(valuations);
  const currentValue = valuation?.estimated_value ?? 0;

  const equity = currentValue - outstandingFinancing;

  // Cumulative — since acquisition.
  const totalIncome = sumByType(transactions, "rental_income");
  const totalExpense =
    sumByType(transactions, "maintenance_expense") +
    sumByType(transactions, "loan_interest_payment") +
    sumByType(transactions, "renovation_expense");
  const cashFlow = totalIncome - totalExpense - principalPaid;

  // Total Return = (Equity − Invested Capital + Cumulative Cash Flow) ÷ Invested Capital.
  const investmentReturn = investedCapital > 0 ? (equity - investedCapital + cashFlow) / investedCapital : 0;

  // Trailing 12 months — feeds Cash-on-Cash Return and the Portfolio Dashboard run-rate.
  const ttmTransactions = transactions.filter((tx) => isWithinTrailing12Months(tx.transaction_date, snapshotDate));
  const totalIncomeTtm = sumByType(ttmTransactions, "rental_income");
  const totalExpenseTtm =
    sumByType(ttmTransactions, "maintenance_expense") +
    sumByType(ttmTransactions, "loan_interest_payment") +
    sumByType(ttmTransactions, "renovation_expense");
  const principalPaidTtm = sumByType(ttmTransactions, "loan_principal_payment");
  const cashFlowTtm = totalIncomeTtm - totalExpenseTtm - principalPaidTtm;
  const cashOnCashReturn = investedCapital > 0 ? cashFlowTtm / investedCapital : 0;

  // Disposal — recorded at most once; null (not 0) until it happens, per data-model.md's
  // nullability rule ("realized_gain is null until disposal" for Rental Property).
  const disposal = transactions.find((tx) => tx.transaction_type === "disposal_proceeds");
  const realizedGain = disposal
    ? disposal.amount - outstandingFinancing - investedCapital + cashFlow
    : null;

  return {
    current_value: currentValue,
    invested_capital: investedCapital,
    outstanding_financing: outstandingFinancing,
    equity,
    total_income: totalIncome,
    total_expense: totalExpense,
    cash_flow: cashFlow,
    investment_return: investmentReturn,
    total_income_ttm: totalIncomeTtm,
    total_expense_ttm: totalExpenseTtm,
    cash_flow_ttm: cashFlowTtm,
    cash_on_cash_return: cashOnCashReturn,
    realized_gain: realizedGain,
    // Unrealized gain is Equity-only — always null for Rental Property, per data-model.md.
    unrealized_gain: null,
  };
}
