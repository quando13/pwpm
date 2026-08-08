# calculation-spec.md

# Calculation Specification

## Purpose

Define exact formulas for every field in `information-model.md`'s Performance Snapshot and Portfolio sections.

This document is the single source of truth for calculation logic. Per the Constitution, "Performance is calculated, never manually maintained" — no field defined here is ever directly editable by the customer.

All amounts are in VND. No currency conversion in MVP.

Items marked **Assumption** encode a business rule not yet explicitly stated elsewhere in `docs/product/`. Confirm or correct before implementation.

**Decisions confirmed 2026-08-06** (superseding earlier assumptions): renovation expense is treated as Expense, not capitalized. Equity uses Weighted Average Cost. Rental Property gets an explicit `disposal_proceeds` transaction type. Equity does not compute trailing-12-month figures.

**Decisions confirmed 2026-08-07**: Equity's Total Expense also includes standalone `brokerage_fee` transactions (`use-cases.md` UC-03 lists Brokerage fee as its own recordable transaction type for Equity; the original formula only summed `buy.fee`/`sell.fee` and silently ignored a standalone fee not tied to a specific buy/sell). `capital_contribution` is **not** a valid transaction type for Equity investments — it exists to record Rental Property's down payment (see that section's Classification Rule); Equity's invested capital is derived entirely from buy transactions, so `packages/shared`'s `TRANSACTION_TYPES_BY_INVESTMENT_TYPE.equity` excludes it.

**Decisions confirmed 2026-08-09**: Margin loans are in scope for Equity, reusing the same `financings` table and `loan_principal_payment`/`loan_interest_payment` transaction types as Rental Property's Financing (new `margin_loan` Financing source). Explicitly decided **not** to reduce Invested Capital by margin, unlike Rental Property's capital_contribution/financing split — a `buy_shares` transaction doesn't record which portion of that specific purchase was cash vs margin-funded, so there's no reliable way to attribute margin to specific shares without a larger redesign of how buys are recorded. Margin only affects Outstanding Financing/Equity (and, via `loan_interest_payment`/`loan_principal_payment`, Total Expense/Cash Flow) — Investment Return (ROI) stays exactly as it would with no margin at all, i.e. it is **not** leveraged/amplified by margin usage. Revisit only if a future need for leveraged-return reporting justifies restructuring buy_shares to capture a cash/margin split per purchase.

---

# Shared Definitions

**Snapshot Date** — the point in time a Performance Snapshot is computed for. Snapshots are recomputed whenever a Transaction, Financing, or Valuation affecting the investment is added or changed, plus on a recurring schedule (e.g., daily) so trend history exists even without new events.

**Weighted Average Cost** — Confirmed: PwPM uses the weighted-average cost method for Equity holdings (not FIFO/LIFO). MVP does not track individual lot disposal order.

---

# Equity Investment

## Inputs (from Transactions, filtered by investment)

* Buy transactions: `quantity`, `price_per_unit`, `fee`
* Sell transactions: `quantity`, `price_per_unit`, `fee`
* Dividend transactions: `amount`
* Margin loan interest payment transactions: `amount`
* Margin loan principal payment transactions: `amount`
* Financing (margin_loan source): `principal_amount`
* Latest Valuation: `estimated_value` (market price per unit) as of Snapshot Date

## Derived Holding State

```
Held Quantity        = Σ(buy.quantity) − Σ(sell.quantity)
Total Buy Cost        = Σ(buy.quantity × buy.price_per_unit + buy.fee)
Average Cost/Unit     = Total Buy Cost ÷ Σ(buy.quantity)
Remaining Cost Basis  = Held Quantity × Average Cost/Unit
```

## Performance Snapshot Fields

```
Current Value         = Held Quantity × latest Valuation.estimated_value
Invested Capital       = Remaining Cost Basis   (NOT reduced by margin — see 2026-08-09 decision above)
Outstanding Financing = Financing.principal_amount (summed across every margin_loan row) − Σ(loan_principal_payment.amount)
Equity                = Current Value − Outstanding Financing
Total Income           = Σ(dividend.amount)  — cumulative since acquisition (no trailing-12-month variant; see Snapshot Periods)
Total Expense           = Σ(buy.fee) + Σ(sell.fee) + Σ(brokerage_fee.amount) + Σ(loan_interest_payment.amount)  — cumulative since acquisition
Cash Flow               = Total Income − Total Expense − Σ(loan_principal_payment.amount)
Realized Gain/Loss     = Σ(sell.quantity × (sell.price_per_unit − Average Cost/Unit at time of sale)) − Σ(sell.fee)
Unrealized Gain/Loss   = Current Value − Remaining Cost Basis
Investment Return (ROI) = (Unrealized Gain/Loss + Realized Gain/Loss + Total Income) ÷ Total Buy Cost   (unaffected by margin)
```

**Assumption**: Realized Gain/Loss uses the Average Cost/Unit at the time of each sale (recomputed progressively), not the final average cost. This requires processing transactions in date order, not just aggregating totals.

---

# Rental Property Investment

## Inputs

* Financing: `principal_amount`, `interest_rate`, `start_date`
* Loan principal payment transactions: `amount`
* Loan interest payment transactions: `amount`
* Rental income transactions: `amount`
* Maintenance expense transactions: `amount`
* Renovation expense transactions: `amount`
* Capital contribution transactions: `amount`
* Disposal proceeds transaction (if disposed): `amount`
* Latest Valuation: `estimated_value`

## Classification Rule (Confirmed 2026-08-06)

* **Capital Contribution** covers the down-payment and any later capital top-ups — counts toward **Invested Capital**. The initial acquisition down payment is recorded as a `capital_contribution` transaction at registration; there is no separate "purchase" transaction type for Rental Property.
* **Renovation Expense** counts toward **Total Expense** (operating cost, recognized when paid), same treatment as Maintenance Expense — not capitalized into Invested Capital.
* **Maintenance Expense** and **Loan Interest Payment** count toward **Total Expense**.
* **Loan Principal Payment** reduces Outstanding Financing; it is a balance-sheet movement, not Income or Expense.
* **Disposal Proceeds** — recorded once, when the customer sells the whole property (see Disposal section below). Excluded from recurring Total Income so it doesn't distort ongoing Cash Flow or Cash-on-Cash Return.

## Performance Snapshot Fields

```
Outstanding Financing = Financing.principal_amount − Σ(loan_principal_payment.amount)
Current Value          = latest Valuation.estimated_value
Invested Capital        = Σ(capital_contribution.amount)
Equity                  = Current Value − Outstanding Financing
Total Income             = Σ(rental_income.amount)  — cumulative since acquisition
Total Expense             = Σ(maintenance_expense.amount) + Σ(loan_interest_payment.amount) + Σ(renovation_expense.amount)  — cumulative since acquisition
Cash Flow                 = Total Income − Total Expense − Σ(loan_principal_payment.amount)  — cumulative since acquisition
Investment Return (ROI)  = (Equity − Invested Capital + Cumulative Cash Flow) ÷ Invested Capital
```

Two distinct return metrics are exposed to the customer (both answer different questions from BS-01):

```
Cash-on-Cash Return (annualized) = (Total Income − Total Expense − Loan Principal Payment) over trailing 12 months ÷ Invested Capital
Total Return                      = (Equity − Invested Capital + Cumulative Net Cash Flow since acquisition) ÷ Invested Capital
```

## Disposal (Realized Outcome)

Recorded once, when the customer sells the whole property and status moves to `disposed`. Answers BS-01's "what would happen financially if I sold the property today" — but as an actual realized event rather than a hypothetical.

```
Net Proceeds at Disposal = disposal_proceeds.amount − Outstanding Financing (at disposal date)
Realized Gain/Loss        = Net Proceeds at Disposal − Invested Capital + Cumulative Net Cash Flow (prior to disposal)
Realized Return            = Realized Gain/Loss ÷ Invested Capital
```

Any remaining loan balance is expected to be paid off via ordinary `loan_principal_payment` transactions at or before disposal, so `Outstanding Financing` is 0 in the typical case — the term is kept in the formula for the case where payoff happens simultaneously with sale rather than as a separate recorded transaction.

Once disposed, the investment's Performance Snapshot stops updating on a recurring schedule; the disposal snapshot becomes the final historical record (per Information Principle: "Historical information is preserved").

---

# Portfolio (aggregation across all Investments in a Portfolio)

```
Total Portfolio Value = Σ(investment.Current Value)
Total Financing        = Σ(investment.Outstanding Financing)
Net Worth               = Total Portfolio Value − Total Financing
Portfolio Allocation   = investment.Current Value ÷ Total Portfolio Value, per investment (and grouped by Investment Type)
Overall Cash Flow      = Σ(Rental Property investment.cash_flow_ttm) + Σ(Equity investment.Cash Flow, cumulative)
```

Equity contributes its cumulative Cash Flow to this sum, not a trailing-12-month figure, per the Snapshot Periods section — dividends and fees are infrequent enough that mixing periods across the two investment types is an accepted simplification for MVP. Revisit if Equity trading volume grows enough that this distorts the portfolio number.

Portfolio-level Investment Return is intentionally **not** a simple average of individual returns — it must be capital-weighted:

```
Portfolio Return = Σ(investment.Invested Capital × investment.Investment Return) ÷ Σ(investment.Invested Capital)
```

---

# Snapshot Periods

**Rental Property** computes two variants of Total Income / Total Expense / Cash Flow:

* **Cumulative** (since acquisition) — used for Invested Capital, Total Return, Disposal, "sell today" analysis (UC-07).
* **Trailing 12 months** — used for Cash-on-Cash Return and the Portfolio Dashboard's "current run-rate" view.

**Equity** computes cumulative only (confirmed 2026-08-06) — no Cash-on-Cash Return equivalent, no trailing-12-month Total Income/Expense/Cash Flow. Dividend and fee activity is treated as infrequent enough that a cumulative view is sufficient for MVP.

Both cumulative and trailing-12-month figures are computed from the same Transaction data; no separate storage of raw data per period.

---

# Non-Goals (MVP)

* No tax-adjusted return (pre-tax only, per Constitution §7 — PwPM is not tax software).
* No IRR / XIRR (time-weighted internal rate of return) — deferred to Phase 3 Decision Support, since it requires a more complex cash-flow-timing engine.
* No currency conversion — VND only.
