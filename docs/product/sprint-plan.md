# sprint-plan.md

# Sprint Plan

## Purpose

Break `mvp-release-plan.md`'s five releases into sprint-sized units of work small enough for a solo developer (working with Claude Code) to complete and validate before moving on.

This document sequences work. It does not redefine scope — every sprint below references the use case, business story, or spec section that justifies it. If a sprint seems to invent new scope, that's a bug in this plan, not a new requirement.

---

# How to Read This Plan

* **No fixed calendar length.** Sprint size is "one coherent, demoable slice," not "N weeks." Move to the next sprint when the current one's Exit Criteria are met, whether that takes two days or two weeks.
* **One owner.** All sprints are written as direct, sequential work for one person + Claude Code — no parallel-owner split.
* **Definition of Done** (from `README.md`) applies to every sprint, not just releases: Business Story satisfied, Use Case completed, Data Model remains consistent, Reports generated correctly, no duplicated source of truth.
* **Calculation before UI.** Per `docs/technical/architecture.md`, every formula in `calculation-spec.md` gets a unit test in `packages/domain` before the screen that displays it is built. Sprints are ordered to respect this.
* Status tags: `[ ]` not started, `[~]` in progress, `[x]` done. Update in place as sprints complete.

---

# Release 0 — Foundation

## Sprint 0.1 — Auth & Session

**Goal:** A visitor can sign up, log in, log out, and land on a protected app shell.

Scope:
- [ ] Supabase client setup in `apps/web` (`@supabase/supabase-js` / `@supabase/ssr`, browser + server clients)
- [ ] Sign Up, Log In, Forgot Password pages (`docs/product/screen-flow.md` §1 Auth)
- [ ] Session handling / route protection for authenticated pages
- [ ] Manual verification: new signup triggers `handle_new_user()` — a `profiles` row and default `portfolios` row appear (already implemented in `supabase/migrations/20260806000001_init_schema.sql`, this sprint only proves it end-to-end through the UI)

Depends on: Supabase project already linked and migrated (done).

Exit Criteria: A real signup produces a working session, a `profiles` row, and a default `portfolios` row, with no client-side code creating those rows itself (per `docs/technical/architecture.md` "Authentication").

---

## Sprint 0.2 — App Shell & Investment List (empty state)

**Goal:** A logged-in customer sees the app shell and an empty Investment List.

Scope:
- [ ] TanStack Query provider wired into `apps/web`
- [ ] App navigation shell (`docs/product/screen-flow.md` Navigation Map)
- [ ] Investment List page (`/investments`) reading from Supabase (RLS-scoped), empty state
- [ ] Portfolio Dashboard placeholder (single-investment summary stand-in per `screen-flow.md` §2, full version deferred to Release 3)
- [ ] Extend `packages/ui` with whatever shadcn primitives this sprint actually needs (nav, empty state, card) — add components as used, not speculatively

Exit Criteria (Release 0 overall, per `mvp-release-plan.md`): a logged-in customer sees an empty Portfolio and can start registering an investment.

---

# Release 1 — Equity Investment (thin vertical slice)

## Sprint 1.1 — Equity Calculation Engine + Register Investment

**Goal:** The math is correct and tested before any screen depends on it; a customer can register an equity holding.

Scope:
- [ ] `packages/domain/src/equity`: implement every formula in `calculation-spec.md` "Equity Investment" (held quantity, weighted average cost, current value, invested capital, realized/unrealized gain, cash flow, ROI) as pure functions
- [ ] Vitest coverage per formula, including edge cases named in `architecture.md`'s testing table (zero holdings, first transaction, disposal N/A for equity)
- [ ] UC-01 Register Investment (Equity): Add Investment wizard, steps 1-2-4 (type, basic info, confirm — financing step skipped for equity per `screen-flow.md` §4)

Exit Criteria: `pnpm --filter @pwpm/domain test` passes for every Equity formula; a customer can create an equity investment and see it in the Investment List.

---

## Sprint 1.2 — Transactions, Valuations, and Snapshot Recomputation

**Goal:** Recording activity keeps performance data current, automatically.

Scope:
- [ ] UC-03 Record Financial Transaction (Equity): buy, sell, dividend, brokerage fee — form + list, transaction_type constrained to the Equity subset (`packages/shared` `TRANSACTION_TYPES_BY_INVESTMENT_TYPE`)
- [ ] Valuation entry (manual market price)
- [ ] `recompute_snapshot(investment_id)` — Postgres function or Edge Function porting the Sprint 1.1 formulas, triggered `AFTER INSERT/UPDATE/DELETE` on `transactions`/`valuations` (per `architecture.md` "Writes"); writes to `performance_snapshots` via service role
- [ ] Transactions tab + Valuations tab on Investment Detail (`screen-flow.md` §5)

Exit Criteria: adding a buy/sell/dividend/fee or a new valuation updates `performance_snapshots` without any client-side recomputation of the authoritative numbers.

---

## Sprint 1.3 — Reference Events + Performance Display

**Goal:** Close the loop — a customer can see accurate performance and understand what happened to their investment.

Scope:
- [ ] UC-04 Record Reference Event (Equity): market valuation note, stock split, corporate action
- [ ] Overview/Performance tab: Performance Snapshot fields, historical trend chart (from `performance_snapshots` history)
- [ ] Reference Events tab (timeline)
- [ ] End-to-end validation against BS-02: invested capital, average price, current value, unrealized/realized gain, dividend income, ROI all match hand-calculated expectations for a synthetic multi-buy/sell scenario

Exit Criteria (Release 1 overall, per `mvp-release-plan.md`): a customer can register a stock holding, record buys/sells/dividends, update valuation, and see accurate performance.

---

# Release 2 — Rental Property Investment

## Sprint 2.1 — Rental Property Calculation Engine + Register + Financing

**Goal:** Extend the proven architecture with Financing, per Constitution §11 Extensibility — no redesign, only new business data.

Scope:
- [ ] `packages/domain/src/rental-property`: implement every formula in `calculation-spec.md` "Rental Property Investment" (outstanding financing, invested capital, equity, cash flow, cash-on-cash return, total return) with Vitest coverage
- [ ] UC-01 Register Investment (Rental Property)
- [ ] UC-02 Register Investment Financing: personal capital / bank loan, Financing step in Add Investment wizard
- [ ] Financing tab on Investment Detail (current terms, outstanding financing)

Exit Criteria: formulas tested; a customer can register a rental property with financing and see it in the Investment List.

---

## Sprint 2.2 — Transactions, Snapshot Recomputation, Disposal

**Goal:** Full cash-flow lifecycle, including the one-time disposal event.

Scope:
- [ ] UC-03 Record Financial Transaction (Rental Property): rental income, loan principal payment, loan interest payment, maintenance expense, renovation expense, capital contribution, disposal proceeds
- [ ] Extend `recompute_snapshot` (Sprint 1.2's function) to branch on `investment_type` for Rental Property's formula set, including TTM variants (`total_income_ttm`, `total_expense_ttm`, `cash_flow_ttm`, `cash_on_cash_return`)
- [ ] Disposal handling: `disposal_proceeds` transaction flips `investments.status → 'disposed'`, snapshot recomputation stops recurring (per `calculation-spec.md` "Disposal")
- [ ] Valuation entry (estimated property value)

Exit Criteria: recording income/expenses/loan payments updates snapshots correctly; recording `disposal_proceeds` freezes the investment's snapshot history as the final record.

---

## Sprint 2.3 — Reference Events + Performance Display

**Goal:** Same closing loop as Sprint 1.3, for Rental Property.

Scope:
- [ ] UC-04 Record Reference Event (Rental Property): property valuation note, tenant change, lease renewal, interest rate change
- [ ] Overview/Performance tab for Rental Property: Cash-on-Cash Return and Total Return both surfaced (per `calculation-spec.md`, these answer different BS-01 questions — don't collapse them into one number)
- [ ] End-to-end validation against BS-01: outstanding loan, equity, cash flow, and a "sell today" disposal scenario match hand-calculated expectations

Exit Criteria (Release 2 overall, per `mvp-release-plan.md`): a customer can register a rental property with financing, record income/expenses/loan payments, and see accurate performance including equity net of outstanding loan. No architectural changes required beyond Sprint 2.1-2.3's new business data.

---

# Release 3 — Portfolio Aggregation

## Sprint 3.1 — Portfolio Calculation Engine

**Goal:** Cross-investment math is correct before the dashboard displays it.

Scope:
- [ ] `packages/domain/src/portfolio`: Total Portfolio Value, Total Financing, Net Worth, Portfolio Allocation, Overall Cash Flow (mixed cumulative/TTM per `calculation-spec.md` "Snapshot Periods"), capital-weighted Portfolio Return
- [ ] Vitest coverage, including a mixed Equity + Rental Property portfolio scenario
- [ ] Read-path query (SQL view or `packages/domain` query) joining `performance_snapshots` across an investment's `portfolio_id` — computed on read, not stored (per `data-model.md` "Portfolio-level aggregates")

Exit Criteria: portfolio-level formulas tested against a synthetic two-investment-type portfolio.

---

## Sprint 3.2 — Portfolio Dashboard

**Goal:** UC-06 Portfolio Overview, fully wired.

Scope:
- [ ] Portfolio Dashboard page: Net Worth, Total Portfolio Value, Total Financing, Allocation (by Investment Type), Overall Cash Flow
- [ ] Investment list summary — top/bottom performers (feeds UC-07)
- [ ] Retire the Release 0 single-investment placeholder dashboard

Exit Criteria (Release 3 overall): a customer with both Equity and Rental Property investments sees one consolidated Portfolio view.

---

# Release 4 — Decision Support (Facts Layer)

## Sprint 4.1 — Facts & Flags Engine

**Goal:** Compute the facts UC-07 needs, without ever generating a recommendation (excluded per `use-cases.md` MVP Scope).

Scope:
- [ ] `packages/domain`: historical performance trend per investment (reuse `performance_snapshots` history)
- [ ] Simple flags: negative cash flow streak, financing near maturity (per `mvp-release-plan.md` Release 4 examples)
- [ ] Vitest coverage for flag trigger conditions

Exit Criteria: flags and trend data are computed and unit-tested, not yet surfaced in the UI.

---

## Sprint 4.2 — Decision Support Panel

**Goal:** Surface facts inside Investment Detail so a customer can decide without a spreadsheet.

Scope:
- [ ] Decision Support panel within Investment Detail (`screen-flow.md` §6): facts-only summary, no recommendations
- [ ] Wire Sprint 4.1's flags and trend data into the panel

Exit Criteria (Release 4 / MVP overall, per `mvp-release-plan.md`): a customer can answer "should I continue holding, sell, or add capital?" using facts PwPM surfaces, without building a spreadsheet.

---

# Explicitly Deferred (Post-MVP)

Unchanged from `mvp-release-plan.md` — not re-litigated here:

* Additional investment types beyond Equity/Rental Property
* Multi-currency support
* Personal Finance Management
* What-if Analysis, Scenario Planning, Rebalancing
* Market recommendations, AI investment advice, trading execution, bank integration, tax calculation
