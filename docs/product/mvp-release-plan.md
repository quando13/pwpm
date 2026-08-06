# mvp-release-plan.md

# MVP Release Plan

## Purpose

Sequence the MVP build so the team validates the full domain architecture early, instead of building both investment types in parallel without proof that the core model works end-to-end.

This plan translates `use-cases.md` into a build order. It does not replace the use cases — it prioritizes them.

---

# Guiding Principle

Build one complete vertical slice — Register → Maintain → Evaluate → Decide — for the simplest investment type first.

Equity Investment is simpler than Rental Property: it has no Financing/loan amortization, fewer transaction types, and a simpler performance calculation. It is the fastest path to proving that Investment, Transaction, Valuation, Reference Event and Performance Snapshot work together correctly.

Rental Property is added second. It reuses the same architecture and adds Financing as a new concern, proving the model extends without redesign — directly validating the Constitution's Extensibility principle.

---

# Release 0 — Foundation

Goal: authentication and empty shell for Portfolio and Investment.

* Auth (sign up, log in, log out) — Supabase Auth
* Customer profile created on first sign-in
* Default Portfolio auto-created per customer
* Investment List page (empty state)
* Investment Type is fixed to a closed enum for MVP: `equity`, `rental_property`

### Exit Criteria

A logged-in customer sees an empty Portfolio and can start registering an investment.

---

# Release 1 — Equity Investment (thin vertical slice)

Goal: full Register → Maintain → Evaluate → Decide loop for one investment type.

* UC-01 Register Investment (Equity)
* UC-03 Record Financial Transaction — buy, sell, dividend, brokerage fee
* UC-04 Record Reference Event — stock split, corporate action, market valuation note
* Valuation — manual entry of market price
* UC-05 Evaluate Investment — Performance Snapshot for a single equity holding
* Investment Detail page fully functional for Equity

### Exit Criteria

A customer can register a stock holding, record buys/sells/dividends, update valuation, and see accurate performance (invested capital, unrealized gain, realized gain, dividend income, ROI).

This release proves the domain model, calculation engine, and UI pattern all work together.

---

# Release 2 — Rental Property Investment

Goal: extend the proven architecture with Financing.

* UC-01 Register Investment (Rental Property)
* UC-02 Register Investment Financing — personal capital, bank loan
* UC-03 Record Financial Transaction — rental income, loan principal payment, loan interest payment, maintenance expense, renovation expense
* UC-04 Record Reference Event — property valuation note, tenant change, lease renewal, interest rate change
* Valuation — manual entry of estimated property value
* UC-05 Evaluate Investment — Performance Snapshot including Outstanding Financing and Equity

### Exit Criteria

A customer can register a rental property with financing, record income/expenses/loan payments, and see accurate performance including equity net of outstanding loan.

No architectural changes should be required to ship this release — only new business data (transaction types, calculation rules), per the Constitution's "Investment types may evolve. The platform should not."

---

# Release 3 — Portfolio Aggregation

Goal: consolidate across investment types.

* UC-06 Portfolio Overview — Portfolio Value, Allocation, Total Cash Flow, Total Financing, Net Worth
* Portfolio Dashboard page
* Cross-investment comparison (which investment performs best / needs attention)

### Exit Criteria

A customer with both Equity and Rental Property investments sees one consolidated Portfolio view.

---

# Release 4 — Decision Support (Facts Layer)

Goal: UC-07 Investment Decision Support, MVP-scoped.

* Present facts and calculated context only (no recommendations, no AI advice — excluded per `use-cases.md` MVP Scope)
* Historical performance trend per investment
* Simple flags: e.g., negative cash flow, financing near maturity

### Exit Criteria

A customer can answer "should I continue holding, sell, or add capital?" using facts PwPM surfaces, without building a spreadsheet.

---

# Explicitly Deferred (Post-MVP)

Per `vision.md` Phase 2/3 and `use-cases.md` MVP Scope exclusions:

* Additional investment types (Real Estate variants beyond rental, ETF, Mutual Fund, Gold, Crypto, Private Business, Deposits, Bonds)
* Multi-currency support
* Personal Finance Management (income/expense/budget outside investments)
* What-if Analysis, Scenario Planning, Rebalancing
* Market recommendations, AI investment advice, trading execution, bank integration, tax calculation

---

# Open Decision

This release order (Equity before Rental Property) is a recommendation based on implementation complexity, not a business priority signal. If real customer demand or validation evidence favors Rental Property first, swap Release 1 and Release 2 — the architecture is unaffected either way.
