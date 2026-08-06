# screen-flow.md

# Screen Flow & Page Inventory

## Purpose

Map the Customer Workflow (Register → Maintain → Evaluate → Decide) to concrete pages, so frontend build order matches `mvp-release-plan.md`.

This is a page inventory, not a visual design. Layout and component design happen during implementation.

---

# Navigation Map

```text
Auth (Sign up / Log in)
      │
      ▼
Portfolio Dashboard  ─────────────────────────┐
      │                                       │
      ▼                                       │
Investment List                                │
      │                                       │
      ├── Add Investment (wizard) ──► Investment Detail
      │                                       ▲
      ▼                                       │
Investment Detail  ◄────────────────────────────┘
  ├── Overview / Performance tab
  ├── Transactions tab ──► Add Transaction
  ├── Financing tab ──► Add/Edit Financing   (Rental Property only)
  ├── Valuations tab ──► Add Valuation
  └── Reference Events tab ──► Add Reference Event
```

---

# Page Inventory

## 1. Auth

* Sign Up
* Log In
* Forgot Password

Standard Supabase Auth flows. No custom business logic.

---

## 2. Portfolio Dashboard (`/`)

Maps to UC-06 Portfolio Overview and Customer Workflow Step 3 (Evaluate).

Shows:

* Net Worth, Total Portfolio Value, Total Financing
* Portfolio Allocation (by Investment Type)
* Overall Cash Flow (trailing 12 months)
* Investment list summary (top/bottom performers) — feeds UC-07

Ships in Release 3. Before that, this page can show a single-investment summary as a placeholder.

---

## 3. Investment List (`/investments`)

Maps to Customer Workflow Step 1 entry point.

Shows:

* Table/cards of all investments: name, type, status, current value, ROI
* Filter by Investment Type, Status
* "Add Investment" action

---

## 4. Add Investment (wizard) (`/investments/new`)

Maps to UC-01 Register Investment, UC-02 Register Investment Financing.

Steps:

1. Select Investment Type (Equity / Rental Property)
2. Basic Info (name, acquisition date, initial capital contribution)
3. Financing (Rental Property only — skip for Equity in MVP) — funding source, loan terms
4. Confirm → creates Investment record

### Outcome

Redirects to Investment Detail on success. Matches Customer Outcome: "My investment now exists inside PwPM."

---

## 5. Investment Detail (`/investments/[id]`)

Maps to Customer Workflow Steps 2 (Maintain) and 3 (Evaluate).

### Overview / Performance tab

* Performance Snapshot fields from `calculation-spec.md` (Current Value, Invested Capital, Equity, Cash Flow, ROI)
* Historical trend chart (value / equity over time, from Performance Snapshot history)

### Transactions tab

* List of all transactions for this investment, filterable by type/date
* "Add Transaction" action → form fields vary by Investment Type + Transaction Type (per `use-cases.md` UC-03 examples)

### Financing tab (Rental Property only)

* Current financing terms and Outstanding Financing
* "Add/Edit Financing" action

### Valuations tab

* History of valuation entries
* "Add Valuation" action

### Reference Events tab

* Timeline of business events (per `use-cases.md` UC-04 examples)
* "Add Reference Event" action, with optional evidence attachment

---

## 6. Decision Support panel (within Investment Detail, Release 4)

Maps to UC-07.

* Facts-only summary: e.g., "Cash flow has been negative for 3 consecutive months", "Financing matures in 8 months"
* No recommendations — presents context only, per MVP Scope exclusion of "AI investment advice"

---

# Deferred Screens (Post-MVP)

* Multi-portfolio switcher (MVP auto-creates one default Portfolio per customer)
* What-if / Scenario Simulation screens (Phase 3)
* Personal Finance Management screens (Phase 2)
