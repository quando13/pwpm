// Mirrors table shapes defined in docs/technical/data-model.md.
// These describe rows as read from Supabase; not ORM models.

import type {
  FinancingSource,
  InvestmentStatus,
  InvestmentType,
  ReferenceEventType,
  TransactionType,
  ValuationSource,
} from "./enums";

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Portfolio {
  id: string;
  customer_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface Investment {
  id: string;
  portfolio_id: string;
  customer_id: string;
  investment_type: InvestmentType;
  name: string;
  status: InvestmentStatus;
  acquisition_date: string;
  created_at: string;
  updated_at: string;
}

export interface Financing {
  id: string;
  investment_id: string;
  source_type: FinancingSource;
  principal_amount: number;
  interest_rate: number | null;
  loan_term_months: number | null;
  start_date: string;
  lender_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  investment_id: string;
  financing_id: string | null;
  transaction_type: TransactionType;
  transaction_date: string;
  amount: number;
  quantity: number | null;
  price_per_unit: number | null;
  fee: number | null;
  notes: string | null;
  created_at: string;
}

export interface Valuation {
  id: string;
  investment_id: string;
  valuation_date: string;
  estimated_value: number;
  valuation_source: ValuationSource;
  notes: string | null;
  created_at: string;
}

export interface ReferenceEvent {
  id: string;
  investment_id: string;
  event_type: ReferenceEventType;
  event_date: string;
  description: string;
  evidence_url: string | null;
  created_at: string;
}

export interface PerformanceSnapshot {
  id: string;
  investment_id: string;
  snapshot_date: string;
  current_value: number;
  invested_capital: number;
  outstanding_financing: number;
  equity: number;
  total_income: number;
  total_expense: number;
  cash_flow: number;
  investment_return: number;
  // Rental Property only — see docs/technical/data-model.md nullability rule.
  total_income_ttm: number | null;
  total_expense_ttm: number | null;
  cash_flow_ttm: number | null;
  cash_on_cash_return: number | null;
  // Equity: always populated. Rental Property: null until disposal.
  realized_gain: number | null;
  // Equity only.
  unrealized_gain: number | null;
  computed_at: string;
}
