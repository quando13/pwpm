-- Adds a third Financing source: loans from a private individual (family/friends),
-- distinct from personal_capital (no debt, investor's own money) and bank_loan (formal
-- institution). Additive only — no data migration needed, existing rows are unaffected.
alter type financing_source_enum add value if not exists 'private_loan';
