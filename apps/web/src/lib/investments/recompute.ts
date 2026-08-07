import { computeEquitySnapshot } from "@pwpm/domain";
import type { Transaction, Valuation } from "@pwpm/shared";

import { createServiceClient } from "@/lib/supabase/service";

// Recomputes and upserts today's performance_snapshots row for an investment.
//
// docs/technical/architecture.md recommends a Postgres trigger + Edge Function so
// recomputation stays authoritative regardless of which client wrote the data. This
// project currently has exactly one write path (this Next.js app) and no local Docker
// to iterate on an Edge Function against, so recomputation runs here instead, in the
// same server-side call that wrote the transaction/valuation — using packages/domain's
// calculators directly (never re-implemented) and the service-role client (the only
// role performance_snapshots grants insert/update to, per security-rls.md). If a
// second write path (an import job, another app) ever appears, port this call into an
// Edge Function invoked by a DB trigger instead, per the architecture doc.
export async function recomputeInvestmentSnapshot(investmentId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: investment } = await supabase
    .from("investments")
    .select("investment_type")
    .eq("id", investmentId)
    .single();
  if (!investment) return;

  // Rental Property's calculation engine (Financing, cash-on-cash return, disposal)
  // is Sprint 2.1 work — skip rather than write an incomplete/misleading snapshot.
  if (investment.investment_type !== "equity") return;

  const [{ data: transactions }, { data: valuations }] = await Promise.all([
    supabase.from("transactions").select("*").eq("investment_id", investmentId),
    supabase.from("valuations").select("*").eq("investment_id", investmentId),
  ]);

  const snapshot = computeEquitySnapshot({
    transactions: (transactions ?? []) as Transaction[],
    valuations: (valuations ?? []) as Valuation[],
  });

  const snapshotDate = new Date().toISOString().slice(0, 10);

  await supabase.from("performance_snapshots").upsert(
    {
      investment_id: investmentId,
      snapshot_date: snapshotDate,
      ...snapshot,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "investment_id,snapshot_date" },
  );
}
