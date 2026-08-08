-- Adds a fourth Financing source: Equity margin loans (broker-lent funds), distinct from
-- bank_loan/private_loan (real-estate-style loans) and personal_capital (no debt).
-- Additive only — no data migration needed, existing rows are unaffected.
alter type financing_source_enum add value if not exists 'margin_loan';
