import * as XLSX from "xlsx";

// Parses a brokerage portfolio export (.xlsx or .csv) — accepts the raw file as downloaded
// from the customer's brokerage, not a bespoke PwPM template. Only 4 columns matter; the
// header row position and every other column (bonus/hold/mortgage shares, % weight, etc.)
// are ignored. Column matching is keyword-based (Vietnamese/English) so minor wording
// differences between brokers still work, as long as the four concepts are present.
export interface ParsedHoldingRow {
  symbol: string;
  quantity: number;
  avgCost: number;
  marketPrice: number;
}

export interface ParseResult {
  rows: ParsedHoldingRow[];
  error?: string;
}

function normalizeHeader(cell: unknown): string {
  return String(cell ?? "")
    .replace(/\n/g, " ")
    .trim()
    .toLowerCase();
}

const COLUMN_MATCHERS: Record<keyof ParsedHoldingRow, RegExp> = {
  symbol: /mã ck|symbol/,
  quantity: /(tổng khối lượng|total volume)/,
  avgCost: /giá vốn|avg cost/,
  marketPrice: /giá thị trường|market price/,
};

export function parsePortfolioFile(data: ArrayBuffer): ParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    return { rows: [], error: "Không đọc được file. Hãy kiểm tra định dạng .xlsx hoặc .csv." };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { rows: [], error: "File không có dữ liệu." };
  }

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });

  let headerRowIndex = -1;
  let colIndex: Partial<Record<keyof ParsedHoldingRow, number>> = {};
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const row = grid[i];
    if (!row) continue;
    const found: Partial<Record<keyof ParsedHoldingRow, number>> = {};
    row.forEach((cell, colIdx) => {
      const normalized = normalizeHeader(cell);
      for (const key of Object.keys(COLUMN_MATCHERS) as (keyof ParsedHoldingRow)[]) {
        if (COLUMN_MATCHERS[key].test(normalized)) found[key] = colIdx;
      }
    });
    if (found.symbol !== undefined && found.quantity !== undefined && found.avgCost !== undefined) {
      headerRowIndex = i;
      colIndex = found;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return {
      rows: [],
      error: "Không tìm thấy các cột cần thiết (Mã CK, Tổng khối lượng, Giá vốn). Kiểm tra lại file gốc từ công ty chứng khoán.",
    };
  }

  const rows: ParsedHoldingRow[] = [];
  for (let i = headerRowIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row) continue;
    const rawSymbol = row[colIndex.symbol!];
    const symbol = String(rawSymbol ?? "").trim();
    if (!symbol || /^tổng|^total/i.test(symbol)) break; // stop at the Tổng/Total row or blank

    const quantity = Number(row[colIndex.quantity!]);
    const avgCost = Number(row[colIndex.avgCost!]);
    const marketPrice = colIndex.marketPrice !== undefined ? Number(row[colIndex.marketPrice]) : NaN;
    if (!Number.isFinite(quantity) || !Number.isFinite(avgCost) || quantity <= 0) continue;

    rows.push({
      symbol: symbol.toUpperCase(),
      quantity,
      avgCost,
      marketPrice: Number.isFinite(marketPrice) ? marketPrice : avgCost,
    });
  }

  if (rows.length === 0) {
    return { rows: [], error: "Không tìm thấy dòng dữ liệu nào hợp lệ trong file." };
  }

  return { rows };
}
