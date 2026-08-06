import type { Financing, PerformanceSnapshot, Transaction, Valuation } from "@pwpm/shared";

// Input shape shared by every calculator: (transactions, financings, valuations) => PerformanceSnapshot,
// per docs/technical/architecture.md. Pure functions, no I/O, no Supabase client.
export interface SnapshotInput {
  investmentId: string;
  snapshotDate: string;
  transactions: Transaction[];
  financings: Financing[];
  valuations: Valuation[];
}

export type ComputedSnapshot = Omit<
  PerformanceSnapshot,
  "id" | "investment_id" | "snapshot_date" | "computed_at"
>;
