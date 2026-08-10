import type { ParsedHoldingRow } from "./portfolio-import-parser";

// Shared between the import page's client-side preview and the Server Action's write
// logic, so both agree on what each row means — the preview uses whatever holdings state
// was loaded when the page rendered; the Server Action re-derives it fresh from the DB at
// write time (authoritative, avoids acting on a stale preview).
export type ImportAction = "create" | "valuation_only" | "adjust_buy" | "adjust_sell";

export interface ExistingHolding {
  investmentId: string;
  heldQuantity: number;
  averageCostPerUnit: number;
}

export interface ClassifiedImportRow extends ParsedHoldingRow {
  action: ImportAction;
  existingInvestmentId?: string;
  existingQuantity?: number;
  /** For adjust_buy/adjust_sell — the quantity of the auto-generated adjustment transaction. */
  adjustQuantity?: number;
  /** For adjust_buy/adjust_sell — the price used for the auto-generated adjustment transaction. */
  adjustPrice?: number;
}

// A tiny quantity gap (odd-lot rounding, a stray test-data artifact) shouldn't trigger an
// adjustment transaction — solving for the price of a 1-share delta against a large
// existing position produces an absurd implied price (observed: a 1-share gap on a
// 27,000-share NVL position implied ~2.1 million/share against a ~14k market price).
// 0.1% of the existing position, floor 1 share, is negligible for any real trade but still
// catches genuine buys/sells (a few percent of the position or more).
function quantityTolerance(existingQuantity: number): number {
  return Math.max(1, existingQuantity * 0.001);
}

export function classifyImportRow(
  row: ParsedHoldingRow,
  existing: ExistingHolding | undefined,
): ClassifiedImportRow {
  if (!existing) {
    return { ...row, action: "create" };
  }

  const diff = row.quantity - existing.heldQuantity;
  if (Math.abs(diff) <= quantityTolerance(existing.heldQuantity)) {
    return {
      ...row,
      action: "valuation_only",
      existingInvestmentId: existing.investmentId,
      existingQuantity: existing.heldQuantity,
    };
  }

  if (diff > 0) {
    // Solve for the price that makes the new blended average cost land exactly on the
    // file's reported Avg Cost — same weighted-average formula the engine already uses.
    const adjustPrice = Math.max(
      0,
      (row.avgCost * row.quantity - existing.averageCostPerUnit * existing.heldQuantity) / diff,
    );
    return {
      ...row,
      action: "adjust_buy",
      existingInvestmentId: existing.investmentId,
      existingQuantity: existing.heldQuantity,
      adjustQuantity: diff,
      adjustPrice,
    };
  }

  // Quantity dropped — some shares were sold, but a holdings snapshot never records the
  // actual sale price. Approximate with the file's market price (closest available
  // estimate); flagged clearly in the UI and the transaction note so the customer can
  // correct it if they know the real price.
  return {
    ...row,
    action: "adjust_sell",
    existingInvestmentId: existing.investmentId,
    existingQuantity: existing.heldQuantity,
    adjustQuantity: -diff,
    adjustPrice: row.marketPrice,
  };
}
