// Mirrors the Postgres enum types defined in docs/technical/data-model.md.
// Keep in sync manually with supabase/migrations until a schema-generation tool exists.

export const INVESTMENT_TYPES = ["equity", "rental_property"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const INVESTMENT_STATUSES = ["active", "disposed", "archived"] as const;
export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[number];

export const FINANCING_SOURCES = ["personal_capital", "bank_loan"] as const;
export type FinancingSource = (typeof FINANCING_SOURCES)[number];

export const TRANSACTION_TYPES = [
  // shared
  "capital_contribution",
  // rental property
  "rental_income",
  "loan_principal_payment",
  "loan_interest_payment",
  "maintenance_expense",
  "renovation_expense",
  "disposal_proceeds",
  // equity
  "buy_shares",
  "sell_shares",
  "dividend_received",
  "brokerage_fee",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const VALUATION_SOURCES = [
  "market_reference",
  "appraisal",
  "broker_quote",
  "manual_estimate",
] as const;
export type ValuationSource = (typeof VALUATION_SOURCES)[number];

export const REFERENCE_EVENT_TYPES = [
  "property_valuation_note",
  "tenant_change",
  "lease_renewal",
  "interest_rate_change",
  "market_valuation_note",
  "stock_split",
  "corporate_action",
  "legal_update",
  "other",
] as const;
export type ReferenceEventType = (typeof REFERENCE_EVENT_TYPES)[number];

// Transaction types valid per investment type, per data-model.md's
// "transaction_type must be valid for the parent investment's investment_type" rule.
export const TRANSACTION_TYPES_BY_INVESTMENT_TYPE: Record<
  InvestmentType,
  readonly TransactionType[]
> = {
  equity: [
    "capital_contribution",
    "buy_shares",
    "sell_shares",
    "dividend_received",
    "brokerage_fee",
  ],
  rental_property: [
    "capital_contribution",
    "rental_income",
    "loan_principal_payment",
    "loan_interest_payment",
    "maintenance_expense",
    "renovation_expense",
    "disposal_proceeds",
  ],
};
