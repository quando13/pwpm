# data-model.md

# Physical Data Model (Postgres / Supabase)

## Purpose

Translate `docs/product/erd.md` and `docs/product/information-model.md` into an implementable Postgres schema.

Conventions:

* Primary keys: `uuid default gen_random_uuid()`
* Timestamps: `created_at timestamptz default now()`, `updated_at timestamptz default now()`
* Money: `numeric(18,2)`, VND only (no currency column in MVP — see `mvp-release-plan.md` deferred scope)
* Every table that stores business data (not derived) is append-only in spirit: corrections create new rows rather than mutating history, per Constitution §5 and `information-model.md` Information Principles. Physical `UPDATE` is still permitted for typo fixes, but the product should prefer "correcting entries" as a pattern in later iterations.

---

# profiles

Extends `auth.users` (Supabase-managed). Represents **Customer**.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, references `auth.users.id` |
| display_name | text | |
| created_at | timestamptz | |

---

# portfolios

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK → profiles.id, not null |
| name | text | not null, default `'My Portfolio'` |
| is_default | boolean | default true; MVP auto-creates exactly one per customer |
| created_at | timestamptz | |

Index: `(customer_id)`

---

# investments

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| portfolio_id | uuid | FK → portfolios.id, not null |
| customer_id | uuid | FK → profiles.id, not null — **denormalized from portfolio for RLS simplicity**, see `security-rls.md` |
| investment_type | investment_type_enum | not null |
| name | text | not null |
| status | investment_status_enum | not null, default `'active'` |
| acquisition_date | date | not null |
| created_at | timestamptz | |
| updated_at | timestamptz | |

```sql
create type investment_type_enum as enum ('equity', 'rental_property');
create type investment_status_enum as enum ('active', 'disposed', 'archived');
```

Index: `(portfolio_id)`, `(customer_id)`

---

# financings

Rental Property only in MVP (see `calculation-spec.md`). One investment may have multiple financing records (e.g., personal capital line + bank loan line) — each row is one funding source.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| investment_id | uuid | FK → investments.id, not null |
| source_type | financing_source_enum | not null |
| principal_amount | numeric(18,2) | not null; 0 for personal_capital |
| interest_rate | numeric(6,3) | nullable; annual %, null for personal_capital |
| loan_term_months | integer | nullable |
| start_date | date | not null |
| lender_name | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

```sql
create type financing_source_enum as enum ('personal_capital', 'bank_loan');
```

Outstanding balance is **not stored here** — it is derived (`principal_amount − Σ loan_principal_payment transactions`), per `calculation-spec.md`, to avoid a duplicated source of truth.

Index: `(investment_id)`

---

# transactions

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| investment_id | uuid | FK → investments.id, not null |
| financing_id | uuid | FK → financings.id, nullable — set for loan principal/interest payments |
| transaction_type | transaction_type_enum | not null |
| transaction_date | date | not null |
| amount | numeric(18,2) | not null, always positive; direction implied by transaction_type |
| quantity | numeric(18,6) | nullable — Equity buy/sell only |
| price_per_unit | numeric(18,2) | nullable — Equity buy/sell only |
| fee | numeric(18,2) | nullable, default 0 |
| notes | text | nullable |
| created_at | timestamptz | |

```sql
create type transaction_type_enum as enum (
  -- shared
  'capital_contribution',
  -- rental property
  'rental_income',
  'loan_principal_payment',
  'loan_interest_payment',
  'maintenance_expense',
  'renovation_expense',
  'disposal_proceeds',
  -- equity
  'buy_shares',
  'sell_shares',
  'dividend_received',
  'brokerage_fee'
);
```

Index: `(investment_id, transaction_date)`, `(financing_id)`

Application-level constraint (enforced in `packages/domain`, not the DB): `transaction_type` must be valid for the parent investment's `investment_type` (e.g., `buy_shares` only valid when `investment_type = 'equity'`, `disposal_proceeds` only valid for `rental_property`). See `architecture.md`.

`renovation_expense` is treated as an operating expense (not capitalized) — see `calculation-spec.md` Classification Rule.

A `disposal_proceeds` transaction is recorded at most once per investment and triggers `investments.status → 'disposed'` (via the same recompute trigger described in `architecture.md`). After disposal, no further recurring snapshot recomputation occurs for that investment — see `calculation-spec.md` Disposal section.

---

# valuations

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| investment_id | uuid | FK → investments.id, not null |
| valuation_date | date | not null |
| estimated_value | numeric(18,2) | not null — market price per unit for Equity, total property value for Rental Property |
| valuation_source | valuation_source_enum | not null |
| notes | text | nullable |
| created_at | timestamptz | |

```sql
create type valuation_source_enum as enum ('market_reference', 'appraisal', 'broker_quote', 'manual_estimate');
```

Index: `(investment_id, valuation_date desc)` — "latest valuation" is a frequent lookup.

---

# reference_events

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| investment_id | uuid | FK → investments.id, not null |
| event_type | reference_event_type_enum | not null |
| event_date | date | not null |
| description | text | not null |
| evidence_url | text | nullable — Supabase Storage path, see `security-rls.md` |
| created_at | timestamptz | |

```sql
create type reference_event_type_enum as enum (
  'property_valuation_note', 'tenant_change', 'lease_renewal', 'interest_rate_change',
  'market_valuation_note', 'stock_split', 'corporate_action', 'legal_update', 'other'
);
```

Index: `(investment_id, event_date desc)`

---

# performance_snapshots

Derived table. **No direct customer writes** — populated only by the calculation engine (DB function / Edge Function, see `architecture.md`). Exists so historical trend charts don't require recomputing from full transaction history on every read.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| investment_id | uuid | FK → investments.id, not null |
| snapshot_date | date | not null |
| current_value | numeric(18,2) | |
| invested_capital | numeric(18,2) | cumulative, since acquisition |
| outstanding_financing | numeric(18,2) | |
| equity | numeric(18,2) | |
| total_income | numeric(18,2) | cumulative, since acquisition |
| total_expense | numeric(18,2) | cumulative, since acquisition |
| cash_flow | numeric(18,2) | cumulative, since acquisition |
| investment_return | numeric(9,6) | Total Return (Rental Property) or ROI (Equity), ratio not percentage — see `calculation-spec.md` |
| total_income_ttm | numeric(18,2) | nullable — Rental Property only; Equity does not compute a trailing-12-month variant (confirmed 2026-08-06) |
| total_expense_ttm | numeric(18,2) | nullable — Rental Property only |
| cash_flow_ttm | numeric(18,2) | nullable — Rental Property only; feeds Cash-on-Cash Return and Portfolio Overall Cash Flow |
| cash_on_cash_return | numeric(9,6) | nullable — Rental Property only, ratio not percentage |
| realized_gain | numeric(18,2) | nullable — Equity: cumulative realized gain from sells. Rental Property: populated only on/after the `disposal_proceeds` transaction (see Disposal in `calculation-spec.md`) |
| unrealized_gain | numeric(18,2) | nullable — Equity only |
| computed_at | timestamptz | |

Nullability follows investment type, not free choice: for Equity rows, the `*_ttm` and `cash_on_cash_return` columns are always null; for Rental Property rows, `unrealized_gain` is always null and `realized_gain` is null until disposal. This is enforced in `packages/domain`, not via a DB check constraint, to keep the table schema stable if a future investment type needs a different mix.

Unique constraint: `(investment_id, snapshot_date)` — one snapshot per investment per day.

Index: `(investment_id, snapshot_date desc)`

---

# Portfolio-level aggregates

Not a stored table — computed on read (SQL view or query in `packages/domain`) from `performance_snapshots` joined across an investment's `portfolio_id`, per `calculation-spec.md` Portfolio section. Storing this would duplicate data already derivable and risks going stale.

---

# Migration Ownership

Physical migrations live in `supabase/migrations/`, generated from this document. This document is updated first when the schema changes; migrations follow. Keep them in sync manually until a schema-generation tool is introduced.
