# security-rls.md

# Security & Row Level Security Model

## Purpose

Define how "the user owns and controls every piece of information" (Constitution §5) is enforced at the database level, not just in application code.

Default posture: **RLS enabled on every table, deny-by-default.** A table with no matching policy is inaccessible, even to an authenticated user, unless a policy explicitly grants access.

---

# Auth Model

* Supabase Auth issues a JWT containing `auth.uid()` on login.
* `profiles.id = auth.uid()` — one profile per authenticated user, created via trigger on `auth.users` insert (see `architecture.md`).
* MVP: email/password only. No org/team accounts, no shared portfolios, no roles beyond "owner" — every row belongs to exactly one customer.

---

# RLS Policy Pattern

## profiles

```sql
create policy "read own profile" on profiles
  for select using (id = auth.uid());
create policy "update own profile" on profiles
  for update using (id = auth.uid());
```

## portfolios

```sql
create policy "manage own portfolios" on portfolios
  for all using (customer_id = auth.uid());
```

## investments

`customer_id` is denormalized onto `investments` (see `data-model.md`) specifically so this policy doesn't require a join through `portfolios`:

```sql
create policy "manage own investments" on investments
  for all using (customer_id = auth.uid());
```

## financings, transactions, valuations, reference_events, performance_snapshots

These tables have no `customer_id` column — ownership is checked via `investment_id`:

```sql
create policy "manage own financings" on financings
  for all using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );
```

Repeat the same pattern for `transactions`, `valuations`, `reference_events`.

`performance_snapshots` gets a **read-only** policy for customers — writes only happen via the Postgres function / Edge Function running with elevated (service role) privileges, which bypasses RLS deliberately and by design (see `architecture.md`):

```sql
create policy "read own performance snapshots" on performance_snapshots
  for select using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );
-- no insert/update/delete policy for the authenticated role — only service role writes
```

---

# Storage (Reference Event evidence attachments)

Bucket: `evidence`. Path convention: `evidence/{customer_id}/{investment_id}/{filename}`.

```sql
create policy "manage own evidence files" on storage.objects
  for all using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

Application code must construct upload paths using this convention — the policy trusts the folder structure, so `packages/domain` or the upload hook should own path construction, not ad hoc string building in individual components.

---

# Service Role Usage

The service role key (bypasses RLS) is used **only** in:

* The Postgres trigger/function that creates `profiles` + default `portfolios` on signup
* The snapshot recomputation function/Edge Function writing to `performance_snapshots`

It must never be exposed to `apps/web` client-side code. Any Edge Function using it should validate that the `investment_id` it's writing a snapshot for actually belongs to the customer_id implied by the triggering event, to prevent a bug from writing cross-customer data even though RLS is bypassed.

---

# What This Document Does Not Cover

* Rate limiting / abuse prevention — add before public launch, not required for MVP development
* Data export / deletion (GDPR-style "right to be forgotten") — revisit before any EU user base; not a Phase 1 blocker for a personal-use MVP
* Multi-user sharing of a single portfolio (e.g., spouse access) — explicitly out of scope; current model assumes one customer per portfolio
