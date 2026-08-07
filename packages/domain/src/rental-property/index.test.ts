import { describe, expect, it } from "vitest";
import type { Transaction } from "@pwpm/shared";

import { computeRentalPropertyInvestedCapital } from "./index";

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
    created_at: `${partial.transaction_date}T00:00:00.000Z`,
    ...partial,
  };
}

describe("computeRentalPropertyInvestedCapital", () => {
  it("is 0 with no transactions", () => {
    expect(computeRentalPropertyInvestedCapital([])).toBe(0);
  });

  it("sums only capital_contribution amounts, ignoring other transaction types", () => {
    const transactions = [
      tx({ transaction_type: "capital_contribution", transaction_date: "2026-01-01", amount: 800_000_000 }),
      tx({ transaction_type: "capital_contribution", transaction_date: "2026-06-01", amount: 200_000_000 }),
      tx({ transaction_type: "rental_income", transaction_date: "2026-02-01", amount: 15_000_000 }),
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2026-02-01", amount: 5_000_000 }),
    ];
    expect(computeRentalPropertyInvestedCapital(transactions)).toBe(1_000_000_000);
  });
});
