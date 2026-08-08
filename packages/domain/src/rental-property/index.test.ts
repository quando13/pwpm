import { describe, expect, it } from "vitest";
import type { Financing, Transaction, Valuation } from "@pwpm/shared";

import { computeOutstandingFinancing, computeRentalPropertyInvestedCapital, computeRentalPropertySnapshot } from "./index";

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
    created_at: `${partial.transaction_date}T00:00:0${seq % 10}.000Z`,
    ...partial,
  };
}

function financing(partial: Partial<Financing> & Pick<Financing, "principal_amount">): Financing {
  seq += 1;
  return {
    id: `fin-${seq}`,
    investment_id: "inv-1",
    source_type: "bank_loan",
    interest_rate: null,
    loan_term_months: null,
    start_date: "2025-01-01",
    lender_name: null,
    notes: null,
    created_at: "2025-01-01T00:00:00.000Z",
    ...partial,
  };
}

function valuation(date: string, estimatedValue: number): Valuation {
  return {
    id: `val-${date}`,
    investment_id: "inv-1",
    valuation_date: date,
    estimated_value: estimatedValue,
    valuation_source: "appraisal",
    notes: null,
    created_at: `${date}T00:00:00.000Z`,
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

describe("computeOutstandingFinancing", () => {
  it("is 0 with no financing", () => {
    expect(computeOutstandingFinancing([], [])).toBe(0);
  });

  it("sums principal across financing rows and subtracts principal payments", () => {
    const financings = [
      financing({ principal_amount: 800_000_000, source_type: "bank_loan" }),
      financing({ principal_amount: 0, source_type: "personal_capital" }),
    ];
    const transactions = [
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-03-01", amount: 50_000_000 }),
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-06-01", amount: 50_000_000 }),
      tx({ transaction_type: "rental_income", transaction_date: "2025-06-01", amount: 20_000_000 }),
    ];
    expect(computeOutstandingFinancing(financings, transactions)).toBe(700_000_000);
  });

  it("sums progressive/staged disbursements — multiple financing rows added over time, each a separate tranche", () => {
    // Off-the-plan apartment: bank disburses in 3 tranches as construction progresses,
    // plus a separate interest-free loan from family recorded for tracking. Each tranche
    // is its own financings row, added whenever that disbursement actually happened —
    // there's no single "the" financing row for this investment.
    const financings = [
      financing({ principal_amount: 300_000_000, source_type: "bank_loan", start_date: "2025-01-01" }),
      financing({ principal_amount: 300_000_000, source_type: "bank_loan", start_date: "2025-06-01" }),
      financing({ principal_amount: 200_000_000, source_type: "bank_loan", start_date: "2025-11-01" }),
      financing({
        principal_amount: 100_000_000,
        source_type: "private_loan",
        interest_rate: null,
        lender_name: "Anh trai",
        start_date: "2025-03-01",
      }),
    ];
    const transactions = [
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-12-01", amount: 40_000_000 }),
    ];
    // 300 + 300 + 200 + 100 - 40 = 860M
    expect(computeOutstandingFinancing(financings, transactions)).toBe(860_000_000);
  });
});

describe("computeRentalPropertySnapshot", () => {
  it("returns zeros / nulls for a freshly registered investment with no activity", () => {
    const snapshot = computeRentalPropertySnapshot({
      transactions: [],
      financings: [],
      valuations: [],
      snapshotDate: "2026-01-01",
    });
    expect(snapshot.outstanding_financing).toBe(0);
    expect(snapshot.invested_capital).toBe(0);
    expect(snapshot.current_value).toBe(0);
    expect(snapshot.equity).toBe(0);
    expect(snapshot.investment_return).toBe(0);
    expect(snapshot.cash_on_cash_return).toBe(0);
    expect(snapshot.realized_gain).toBeNull();
    expect(snapshot.unrealized_gain).toBeNull();
  });

  it("matches BS-01's full lifecycle: financing, income/expenses, appreciation, TTM window", () => {
    const financings = [financing({ principal_amount: 1_000_000_000, source_type: "bank_loan", interest_rate: 8.5 })];
    const transactions = [
      tx({ transaction_type: "capital_contribution", transaction_date: "2025-01-01", amount: 500_000_000 }),
      // Outside the trailing-12-month window as of 2026-03-01 (cutoff 2025-03-01, exclusive).
      tx({ transaction_type: "rental_income", transaction_date: "2025-02-01", amount: 20_000_000 }),
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-02-01", amount: 10_000_000 }),
      // Inside the TTM window.
      tx({ transaction_type: "rental_income", transaction_date: "2025-04-01", amount: 20_000_000 }),
      tx({ transaction_type: "rental_income", transaction_date: "2025-10-01", amount: 20_000_000 }),
      tx({ transaction_type: "rental_income", transaction_date: "2026-02-01", amount: 20_000_000 }),
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-06-01", amount: 10_000_000 }),
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-12-01", amount: 10_000_000 }),
      tx({ transaction_type: "loan_interest_payment", transaction_date: "2025-06-01", amount: 5_000_000 }),
      tx({ transaction_type: "loan_interest_payment", transaction_date: "2025-12-01", amount: 5_000_000 }),
      tx({ transaction_type: "maintenance_expense", transaction_date: "2025-07-01", amount: 8_000_000 }),
      tx({ transaction_type: "renovation_expense", transaction_date: "2025-08-01", amount: 15_000_000 }),
    ];
    const valuations = [valuation("2026-02-15", 1_600_000_000)];

    const snapshot = computeRentalPropertySnapshot({
      transactions,
      financings,
      valuations,
      snapshotDate: "2026-03-01",
    });

    // Cumulative
    expect(snapshot.invested_capital).toBe(500_000_000);
    expect(snapshot.outstanding_financing).toBe(1_000_000_000 - 30_000_000); // 3 principal payments
    expect(snapshot.current_value).toBe(1_600_000_000);
    expect(snapshot.equity).toBe(1_600_000_000 - 970_000_000);
    expect(snapshot.total_income).toBe(80_000_000);
    expect(snapshot.total_expense).toBe(10_000_000 + 8_000_000 + 15_000_000);
    expect(snapshot.cash_flow).toBe(80_000_000 - 33_000_000 - 30_000_000);
    expect(snapshot.investment_return).toBeCloseTo((630_000_000 - 500_000_000 + 17_000_000) / 500_000_000, 10);

    // Trailing 12 months — excludes the 2025-02-01 rental_income and loan_principal_payment.
    expect(snapshot.total_income_ttm).toBe(60_000_000);
    expect(snapshot.total_expense_ttm).toBe(10_000_000 + 8_000_000 + 15_000_000);
    expect(snapshot.cash_flow_ttm).toBe(60_000_000 - 33_000_000 - 20_000_000);
    expect(snapshot.cash_on_cash_return).toBeCloseTo(7_000_000 / 500_000_000, 10);

    expect(snapshot.realized_gain).toBeNull();
    expect(snapshot.unrealized_gain).toBeNull();
  });

  it("computes Realized Gain on disposal, correctly netting a full loan payoff against proceeds", () => {
    const financings = [financing({ principal_amount: 1_000_000_000 })];
    const transactions = [
      tx({ transaction_type: "capital_contribution", transaction_date: "2025-01-01", amount: 500_000_000 }),
      tx({ transaction_type: "rental_income", transaction_date: "2025-06-01", amount: 50_000_000 }),
      tx({ transaction_type: "loan_interest_payment", transaction_date: "2025-06-01", amount: 20_000_000 }),
      tx({ transaction_type: "loan_principal_payment", transaction_date: "2025-12-01", amount: 1_000_000_000 }),
      tx({ transaction_type: "disposal_proceeds", transaction_date: "2026-01-01", amount: 1_800_000_000 }),
    ];

    const snapshot = computeRentalPropertySnapshot({
      transactions,
      financings,
      valuations: [],
      snapshotDate: "2026-01-01",
    });

    expect(snapshot.outstanding_financing).toBe(0);
    // Net cash in = capital contributed (500M) + principal paid off (1,000M) + interest (20M) = 1,520M
    // Net cash out = rental income (50M) + disposal proceeds (1,800M) = 1,850M
    // Realized gain = 1,850M − 1,520M = 330M
    expect(snapshot.realized_gain).toBe(330_000_000);
  });

  it("leaves realized_gain null when no disposal_proceeds transaction exists yet", () => {
    const snapshot = computeRentalPropertySnapshot({
      transactions: [tx({ transaction_type: "capital_contribution", transaction_date: "2025-01-01", amount: 500_000_000 })],
      financings: [],
      valuations: [],
      snapshotDate: "2026-01-01",
    });
    expect(snapshot.realized_gain).toBeNull();
  });
});
