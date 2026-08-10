"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeEquityHoldingState } from "@pwpm/domain";
import type { Investment, Transaction } from "@pwpm/shared";

import { recomputeInvestmentSnapshot } from "@/lib/investments/recompute";
import { createClient } from "@/lib/supabase/server";

import { classifyImportRow, type ExistingHolding } from "./portfolio-import-classify";
import type { ParsedHoldingRow } from "./portfolio-import-parser";

export interface ImportRowResult {
  symbol: string;
  action: "create" | "valuation_only" | "adjust_buy" | "adjust_sell";
  error?: string;
}

// Read-side for the import preview — the customer's current equity holdings, keyed by
// symbol (investment name), so the client can classify each uploaded row before
// submitting. Server Component call only (page.tsx), not itself a form action.
export async function getEquityHoldings(): Promise<Record<string, ExistingHolding>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investmentsData } = await supabase
    .from("investments")
    .select("*")
    .eq("customer_id", user.id)
    .eq("investment_type", "equity")
    .eq("status", "active");
  const investments = (investmentsData ?? []) as Investment[];
  if (investments.length === 0) return {};

  const { data: transactionsData } = await supabase
    .from("transactions")
    .select("*")
    .in(
      "investment_id",
      investments.map((inv) => inv.id),
    )
    .in("transaction_type", ["buy_shares", "sell_shares"]);
  const transactions = (transactionsData ?? []) as Transaction[];

  const txByInvestment = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const list = txByInvestment.get(tx.investment_id) ?? [];
    list.push(tx);
    txByInvestment.set(tx.investment_id, list);
  }

  const holdings: Record<string, ExistingHolding> = {};
  for (const inv of investments) {
    const state = computeEquityHoldingState(txByInvestment.get(inv.id) ?? []);
    holdings[inv.name.trim().toUpperCase()] = {
      investmentId: inv.id,
      heldQuantity: state.heldQuantity,
      averageCostPerUnit: state.averageCostPerUnit,
    };
  }
  return holdings;
}

// Executes the import: for each row, either creates a new equity investment seeded with
// one buy_shares transaction (reproducing the file's Vốn/Giá trị TT exactly) plus a
// broker_quote valuation, or — for a symbol already tracked — adds a fresh valuation and,
// if the held quantity changed since last import, an auto-computed adjustment transaction.
// See classifyImportRow for the reconciliation policy. Every adjustment is clearly noted
// so it's easy to find and correct by hand later — this never silently overwrites history.
export async function importEquityPortfolio(
  rows: ParsedHoldingRow[],
  asOfDate: string,
): Promise<{ error?: string; results?: ImportRowResult[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("customer_id", user.id)
    .eq("is_default", true)
    .single();
  if (!portfolio) {
    return { error: "Không tìm thấy danh mục mặc định. Vui lòng đăng xuất và đăng nhập lại." };
  }

  const holdings = await getEquityHoldings();

  const results: ImportRowResult[] = [];
  for (const row of rows) {
    const classified = classifyImportRow(row, holdings[row.symbol]);
    try {
      if (classified.action === "create") {
        const { data: investment, error: insertError } = await supabase
          .from("investments")
          .insert({
            portfolio_id: portfolio.id,
            customer_id: user.id,
            investment_type: "equity",
            name: row.symbol,
            acquisition_date: asOfDate,
          })
          .select("id")
          .single();
        if (insertError || !investment) throw new Error(insertError?.message ?? "Không thể tạo khoản đầu tư.");

        const { error: txError } = await supabase.from("transactions").insert({
          investment_id: investment.id,
          transaction_type: "buy_shares",
          transaction_date: asOfDate,
          quantity: row.quantity,
          price_per_unit: row.avgCost,
          fee: 0,
          amount: row.quantity * row.avgCost,
          notes: "Baseline từ import danh mục",
        });
        if (txError) {
          await supabase.from("investments").delete().eq("id", investment.id);
          throw new Error(txError.message);
        }

        await supabase.from("valuations").insert({
          investment_id: investment.id,
          valuation_date: asOfDate,
          estimated_value: row.marketPrice,
          valuation_source: "broker_quote",
        });

        await recomputeInvestmentSnapshot(investment.id);
        results.push({ symbol: row.symbol, action: "create" });
        continue;
      }

      const investmentId = classified.existingInvestmentId!;

      if (classified.action === "adjust_buy") {
        await supabase.from("transactions").insert({
          investment_id: investmentId,
          transaction_type: "buy_shares",
          transaction_date: asOfDate,
          quantity: classified.adjustQuantity,
          price_per_unit: classified.adjustPrice,
          fee: 0,
          amount: classified.adjustQuantity! * classified.adjustPrice!,
          notes: "Điều chỉnh từ import — số lượng tăng so với lần import trước",
        });
      } else if (classified.action === "adjust_sell") {
        await supabase.from("transactions").insert({
          investment_id: investmentId,
          transaction_type: "sell_shares",
          transaction_date: asOfDate,
          quantity: classified.adjustQuantity,
          price_per_unit: classified.adjustPrice,
          fee: 0,
          amount: classified.adjustQuantity! * classified.adjustPrice!,
          notes: "Điều chỉnh từ import — giá bán ước tính theo giá thị trường, vui lòng cập nhật giá bán thực tế nếu biết",
        });
      }

      await supabase.from("valuations").insert({
        investment_id: investmentId,
        valuation_date: asOfDate,
        estimated_value: row.marketPrice,
        valuation_source: "broker_quote",
      });

      await recomputeInvestmentSnapshot(investmentId);
      results.push({ symbol: row.symbol, action: classified.action });
    } catch (err) {
      results.push({ symbol: row.symbol, action: classified.action, error: (err as Error).message });
    }
  }

  revalidatePath("/investments");
  return { results };
}
