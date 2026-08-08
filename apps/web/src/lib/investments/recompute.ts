import { computeEquitySnapshot, computeRentalPropertySnapshot } from "@pwpm/domain";
import type { ComputedSnapshot } from "@pwpm/domain";
import type { Financing, Transaction, Valuation } from "@pwpm/shared";

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
    .select("investment_type, status")
    .eq("id", investmentId)
    .single();
  if (!investment) return;

  // Once disposed, the disposal snapshot is the final historical record — per
  // calculation-spec.md's Disposal section, recomputation stops recurring.
  if (investment.status === "disposed") return;

  const snapshotDate = new Date().toISOString().slice(0, 10);
  let snapshot: ComputedSnapshot;
  let sawDisposal = false;

  if (investment.investment_type === "equity") {
    const [{ data: transactions }, { data: valuations }] = await Promise.all([
      supabase.from("transactions").select("*").eq("investment_id", investmentId),
      supabase.from("valuations").select("*").eq("investment_id", investmentId),
    ]);
    snapshot = computeEquitySnapshot({
      transactions: (transactions ?? []) as Transaction[],
      valuations: (valuations ?? []) as Valuation[],
    });
  } else {
    const [{ data: transactions }, { data: valuations }, { data: financings }] = await Promise.all([
      supabase.from("transactions").select("*").eq("investment_id", investmentId),
      supabase.from("valuations").select("*").eq("investment_id", investmentId),
      supabase.from("financings").select("*").eq("investment_id", investmentId),
    ]);
    const typedTransactions = (transactions ?? []) as Transaction[];
    snapshot = computeRentalPropertySnapshot({
      transactions: typedTransactions,
      financings: (financings ?? []) as Financing[],
      valuations: (valuations ?? []) as Valuation[],
      snapshotDate,
    });
    sawDisposal = typedTransactions.some((tx) => tx.transaction_type === "disposal_proceeds");
  }

  await supabase.from("performance_snapshots").upsert(
    {
      investment_id: investmentId,
      snapshot_date: snapshotDate,
      ...snapshot,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "investment_id,snapshot_date" },
  );

  // A disposal_proceeds transaction triggers investments.status -> 'disposed', per
  // data-model.md — this snapshot (just written) becomes the frozen final record.
  if (sawDisposal) {
    await supabase.from("investments").update({ status: "disposed" }).eq("id", investmentId);
  }
}
