# architecture.md

# Application Architecture

## Purpose

Define module boundaries and data flow so implementation follows the README's `pwpm/` project structure consistently across the team.

---

# Layer Overview

```text
apps/web            Next.js app — routes, pages, UI composition, data fetching hooks
      │
      ├── packages/ui        Presentational components (shadcn/ui-based). No business logic. No Supabase calls.
      ├── packages/domain    Pure business logic: calculation engine, validation rules, entity types. Framework-agnostic, unit-testable.
      ├── packages/shared    Enums, constants, shared TypeScript types (transaction_type, investment_type...) used by domain, ui, and Supabase Edge Functions.
      └── packages/utils     Generic helpers (VND formatting, date formatting). No business meaning.

supabase/            Postgres schema, RLS policies, Edge Functions, migrations
```

Dependency direction is one-way: `apps/web` depends on `packages/*`; `packages/*` never depend on `apps/web`. `packages/domain` may depend on `packages/shared`, never the reverse.

---

# packages/domain

Owns everything in `calculation-spec.md`: Performance Snapshot formulas, Portfolio aggregation, validation rules (e.g., "transaction_type must match investment_type").

Written as pure functions: `(transactions, financings, valuations) => PerformanceSnapshot`. No I/O, no Supabase client. This is what makes it unit-testable and reusable from both the Next.js app (for optimistic/preview calculations) and Supabase Edge Functions (for authoritative snapshot computation).

Every formula in `calculation-spec.md` should have a corresponding unit test here before the UI is built — the calculation is the part of the system with the most business risk of being wrong silently.

---

# Data Flow

## Reads

```
apps/web page → TanStack Query hook → Supabase client (RLS-scoped) → Postgres
```

`performance_snapshots` rows are read directly — never recomputed client-side for authoritative display. `packages/domain` may recompute client-side only for instant UI feedback (e.g., previewing ROI impact while filling the Add Transaction form before submit).

## Writes

```
apps/web form → validate via packages/domain → Supabase client insert (RLS-scoped) → Postgres trigger or Edge Function → recompute performance_snapshots → TanStack Query cache invalidated → UI reflects new snapshot
```

Recommendation: use a Postgres function (`recompute_snapshot(investment_id)`) invoked by a trigger `AFTER INSERT/UPDATE/DELETE` on `transactions`, `financings`, and `valuations`. This keeps the calculation authoritative and consistent regardless of which client wrote the data (web app now, imports or integrations later), rather than relying on the frontend to trigger recomputation.

`packages/domain`'s calculation logic should be the single implementation ported into SQL (or called from a Supabase Edge Function written in TypeScript/Deno) — do not maintain two independent implementations of the same formulas. If SQL reimplementation is impractical for a formula, prefer an Edge Function that imports the same `packages/domain` logic over duplicating it in `plpgsql`.

---

# Authentication

Supabase Auth (email/password for MVP). On first sign-in, a `profiles` row and a default `portfolios` row are created — via a Postgres trigger on `auth.users` insert, not client-side, so it can't be skipped or duplicated by a buggy client.

---

# Testing Strategy

| Layer | Tool | What |
|---|---|---|
| packages/domain | Vitest | Every formula in `calculation-spec.md`, including edge cases (zero holdings, first transaction, disposal) |
| supabase (RLS) | pgTAP or Supabase test helpers | Every table's RLS policy: customer A cannot read/write customer B's rows |
| apps/web (e2e) | Playwright | Critical flows: register investment → add transaction → see updated performance; per `mvp-release-plan.md` release exit criteria |

RLS tests are not optional — they are the only thing enforcing the Constitution's "user-owned data" principle at the infrastructure level. Treat a missing RLS policy as a security bug, not a product gap.

---

# Environments

* Local development: Supabase CLI (local Postgres + Auth emulation)
* Migrations: `supabase/migrations/`, generated to match `data-model.md`
* Staging and Production: separate Supabase projects, same migration history

---

# What This Document Does Not Cover

* Component-level UI architecture (state management patterns within `apps/web`) — decide during Release 1 implementation, informed by `screen-flow.md`
* CI/CD pipeline — add when the repo is scaffolded
* Deployment target for `apps/web` (e.g., Vercel) — not yet decided
