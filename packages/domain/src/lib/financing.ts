import type { Financing, Transaction } from "@pwpm/shared";

// Shared across every investment type that can carry a loan — Rental Property (bank_loan/
// private_loan) and Equity margin (margin_loan). Not tied to rental-specific concepts:
// sums principal across every financing row for the investment (supports staged/progressive
// disbursement — multiple rows, added whenever each tranche is actually disbursed) minus
// every loan_principal_payment transaction recorded against it.
export function computeOutstandingFinancing(financings: Financing[], transactions: Transaction[]): number {
  const principalTotal = financings.reduce((sum, f) => sum + f.principal_amount, 0);
  const principalPaid = transactions
    .filter((tx) => tx.transaction_type === "loan_principal_payment")
    .reduce((sum, tx) => sum + tx.amount, 0);
  return principalTotal - principalPaid;
}
