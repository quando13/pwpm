import { computePortfolioSummary, type PortfolioPosition, type PortfolioSummary } from "@pwpm/domain";
import type { Investment, PerformanceSnapshot } from "@pwpm/shared";

import type { createClient } from "@/lib/supabase/server";

// Read-path aggregation — computed on every read from investments + each investment's
// latest performance_snapshots row, never stored, per data-model.md's "Portfolio-level
// aggregates" note. Takes an already-created (RLS-scoped) client, matching every other
// data-fetching call in this app, rather than creating its own.
export async function getPortfolioSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  portfolioId: string,
): Promise<PortfolioSummary> {
  // Only 'active' investments count toward a live portfolio — a disposed investment's
  // last snapshot reflects an asset the customer no longer owns (proceeds from the sale
  // aren't tracked as a position of any kind in MVP), and archived ones are hidden by
  // customer choice. calculation-spec.md doesn't say explicitly; this is the more
  // conventional "current holdings" reading, not a "did you ever own this" reading.
  const { data: investmentsData } = await supabase
    .from("investments")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .eq("status", "active");
  const investments = (investmentsData ?? []) as Investment[];
  if (investments.length === 0) {
    return computePortfolioSummary([]);
  }

  const investmentIds = investments.map((inv) => inv.id);
  const { data: snapshotsData } = await supabase
    .from("performance_snapshots")
    .select("*")
    .in("investment_id", investmentIds)
    .order("snapshot_date", { ascending: false });
  const snapshots = (snapshotsData ?? []) as PerformanceSnapshot[];

  // Snapshots are already ordered newest-first, so the first one seen per investment is
  // its latest — no separate "MAX(snapshot_date)" query needed.
  const latestByInvestment = new Map<string, PerformanceSnapshot>();
  for (const snapshot of snapshots) {
    if (!latestByInvestment.has(snapshot.investment_id)) {
      latestByInvestment.set(snapshot.investment_id, snapshot);
    }
  }

  const positions: PortfolioPosition[] = [];
  for (const investment of investments) {
    const snapshot = latestByInvestment.get(investment.id);
    // No snapshot yet (no valuation recorded, or Rental Property recompute never ran) —
    // excluded rather than counted as zero, since "no data" and "worth zero" differ.
    if (!snapshot) continue;
    positions.push({
      investmentId: investment.id,
      investmentType: investment.investment_type,
      currentValue: snapshot.current_value,
      outstandingFinancing: snapshot.outstanding_financing,
      investedCapital: snapshot.invested_capital,
      cashFlow: snapshot.cash_flow,
      cashFlowTtm: snapshot.cash_flow_ttm,
      investmentReturn: snapshot.investment_return,
    });
  }

  return computePortfolioSummary(positions);
}
