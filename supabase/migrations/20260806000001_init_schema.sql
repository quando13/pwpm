-- Initial schema for PwPM MVP.
-- Source of truth for this schema is docs/technical/data-model.md; keep them in sync manually
-- (see "Migration Ownership" in that document).

-- ============================================================================
-- Enums
-- ============================================================================

create type investment_type_enum as enum ('equity', 'rental_property');
create type investment_status_enum as enum ('active', 'disposed', 'archived');
create type financing_source_enum as enum ('personal_capital', 'bank_loan');

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

create type valuation_source_enum as enum (
  'market_reference', 'appraisal', 'broker_quote', 'manual_estimate'
);

create type reference_event_type_enum as enum (
  'property_valuation_note', 'tenant_change', 'lease_renewal', 'interest_rate_change',
  'market_valuation_note', 'stock_split', 'corporate_action', 'legal_update', 'other'
);

-- ============================================================================
-- Tables
-- ============================================================================

-- Extends auth.users. Represents Customer.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  name text not null default 'My Portfolio',
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);
create index portfolios_customer_id_idx on portfolios (customer_id);

create table investments (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios (id) on delete cascade,
  -- Denormalized from portfolio for RLS simplicity, see docs/technical/security-rls.md.
  customer_id uuid not null references profiles (id) on delete cascade,
  investment_type investment_type_enum not null,
  name text not null,
  status investment_status_enum not null default 'active',
  acquisition_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investments_portfolio_id_idx on investments (portfolio_id);
create index investments_customer_id_idx on investments (customer_id);

-- Rental Property only in MVP. One investment may have multiple financing rows
-- (e.g. personal capital line + bank loan line).
create table financings (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments (id) on delete cascade,
  source_type financing_source_enum not null,
  -- not null; 0 for personal_capital
  principal_amount numeric(18, 2) not null,
  -- annual %, null for personal_capital
  interest_rate numeric(6, 3),
  loan_term_months integer,
  start_date date not null,
  lender_name text,
  notes text,
  created_at timestamptz not null default now()
);
create index financings_investment_id_idx on financings (investment_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments (id) on delete cascade,
  -- set for loan principal/interest payments
  financing_id uuid references financings (id) on delete set null,
  transaction_type transaction_type_enum not null,
  transaction_date date not null,
  -- always positive; direction implied by transaction_type
  amount numeric(18, 2) not null,
  -- Equity buy/sell only
  quantity numeric(18, 6),
  price_per_unit numeric(18, 2),
  fee numeric(18, 2) default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index transactions_investment_id_date_idx on transactions (investment_id, transaction_date);
create index transactions_financing_id_idx on transactions (financing_id);

create table valuations (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments (id) on delete cascade,
  valuation_date date not null,
  -- market price per unit for Equity, total property value for Rental Property
  estimated_value numeric(18, 2) not null,
  valuation_source valuation_source_enum not null,
  notes text,
  created_at timestamptz not null default now()
);
create index valuations_investment_id_date_idx on valuations (investment_id, valuation_date desc);

create table reference_events (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments (id) on delete cascade,
  event_type reference_event_type_enum not null,
  event_date date not null,
  description text not null,
  -- Supabase Storage path, see docs/technical/security-rls.md
  evidence_url text,
  created_at timestamptz not null default now()
);
create index reference_events_investment_id_date_idx on reference_events (investment_id, event_date desc);

-- Derived table. No direct customer writes — populated only by the calculation
-- engine (DB function / Edge Function). See docs/technical/architecture.md.
-- TODO(Release 1): recompute_snapshot(investment_id) function + trigger on
-- transactions/financings/valuations, per docs/product/calculation-spec.md.
create table performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments (id) on delete cascade,
  snapshot_date date not null,
  current_value numeric(18, 2),
  invested_capital numeric(18, 2),
  outstanding_financing numeric(18, 2),
  equity numeric(18, 2),
  total_income numeric(18, 2),
  total_expense numeric(18, 2),
  cash_flow numeric(18, 2),
  -- ratio, not percentage
  investment_return numeric(9, 6),
  -- Rental Property only
  total_income_ttm numeric(18, 2),
  total_expense_ttm numeric(18, 2),
  cash_flow_ttm numeric(18, 2),
  cash_on_cash_return numeric(9, 6),
  -- Equity: always populated. Rental Property: null until disposal.
  realized_gain numeric(18, 2),
  -- Equity only
  unrealized_gain numeric(18, 2),
  computed_at timestamptz not null default now(),
  unique (investment_id, snapshot_date)
);
create index performance_snapshots_investment_id_date_idx
  on performance_snapshots (investment_id, snapshot_date desc);

-- ============================================================================
-- Auth trigger: create profile + default portfolio on signup
-- See docs/technical/architecture.md "Authentication" and
-- docs/technical/security-rls.md "Service Role Usage".
-- ============================================================================

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.portfolios (customer_id, name, is_default)
  values (new.id, 'My Portfolio', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================================
-- Row Level Security
-- Default posture: RLS enabled on every table, deny-by-default.
-- See docs/technical/security-rls.md.
-- ============================================================================

alter table profiles enable row level security;
alter table portfolios enable row level security;
alter table investments enable row level security;
alter table financings enable row level security;
alter table transactions enable row level security;
alter table valuations enable row level security;
alter table reference_events enable row level security;
alter table performance_snapshots enable row level security;

create policy "read own profile" on profiles
  for select using (id = auth.uid());
create policy "update own profile" on profiles
  for update using (id = auth.uid());

create policy "manage own portfolios" on portfolios
  for all using (customer_id = auth.uid());

create policy "manage own investments" on investments
  for all using (customer_id = auth.uid());

create policy "manage own financings" on financings
  for all using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );

create policy "manage own transactions" on transactions
  for all using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );

create policy "manage own valuations" on valuations
  for all using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );

create policy "manage own reference events" on reference_events
  for all using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );

-- Read-only for customers — writes only via service role (calculation engine).
create policy "read own performance snapshots" on performance_snapshots
  for select using (
    investment_id in (select id from investments where customer_id = auth.uid())
  );

-- ============================================================================
-- Storage: Reference Event evidence attachments
-- Path convention: evidence/{customer_id}/{investment_id}/{filename}
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

create policy "manage own evidence files" on storage.objects
  for all using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
