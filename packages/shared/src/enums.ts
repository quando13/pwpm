// Mirrors the Postgres enum types defined in docs/technical/data-model.md.
// Keep in sync manually with supabase/migrations until a schema-generation tool exists.

export const INVESTMENT_TYPES = ["equity", "rental_property"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const INVESTMENT_STATUSES = ["active", "disposed", "archived"] as const;
export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[number];

export const FINANCING_SOURCES = ["personal_capital", "bank_loan", "private_loan", "margin_loan"] as const;
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
  // capital_contribution is Rental Property only — Equity's invested capital is
  // derived entirely from buy_shares, per calculation-spec.md (confirmed 2026-08-07).
  // loan_principal_payment/loan_interest_payment cover margin loan repayment/interest
  // (confirmed 2026-08-09) — Equity's Invested Capital/ROI denominator is deliberately
  // NOT reduced by margin (unlike Rental's capital_contribution/financing split), since
  // buy_shares doesn't record which portion of a purchase was cash vs margin-funded.
  equity: ["buy_shares", "sell_shares", "dividend_received", "brokerage_fee", "loan_principal_payment", "loan_interest_payment"],
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

// Financing sources valid per investment type — Rental Property's down-payment loans
// (bank/private) vs Equity's margin loan from a broker. personal_capital only makes sense
// for Rental Property, where it's an explicit "no loan" record alongside a down payment;
// for Equity, the absence of any financings row already means fully cash-funded.
export const FINANCING_SOURCES_BY_INVESTMENT_TYPE: Record<InvestmentType, readonly FinancingSource[]> = {
  equity: ["margin_loan"],
  rental_property: ["personal_capital", "bank_loan", "private_loan"],
};

// Reference event types valid per investment type, per use-cases.md UC-04's examples
// (Equity: market valuation note, stock split, corporate action. Rental Property:
// property valuation note, tenant change, lease renewal, interest rate change).
// legal_update/other apply to either.
export const REFERENCE_EVENT_TYPES_BY_INVESTMENT_TYPE: Record<
  InvestmentType,
  readonly ReferenceEventType[]
> = {
  equity: ["market_valuation_note", "stock_split", "corporate_action", "legal_update", "other"],
  rental_property: [
    "property_valuation_note",
    "tenant_change",
    "lease_renewal",
    "interest_rate_change",
    "legal_update",
    "other",
  ],
};
