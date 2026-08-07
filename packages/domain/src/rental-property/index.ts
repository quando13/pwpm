// Rental Property Performance Snapshot calculator.
// Full formulas to implement: docs/product/calculation-spec.md, "Rental Property Investment" section.
// TODO(Sprint 2.1): outstanding financing, equity, cash-on-cash return, disposal handling.
//
// computeRentalPropertyInvestedCapital is implemented ahead of the rest because the
// Investment List "Tổng giá trị mua" column (added in the 2026-08-07 retro) needs it —
// it's exactly calculation-spec.md's "Invested Capital = Σ(capital_contribution.amount)".

import type { Transaction } from "@pwpm/shared";

export function computeRentalPropertyInvestedCapital(transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.transaction_type === "capital_contribution")
    .reduce((sum, tx) => sum + tx.amount, 0);
}
