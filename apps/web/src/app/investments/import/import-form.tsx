"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@pwpm/ui";
import { formatVND } from "@pwpm/utils";

import {
  classifyImportRow,
  type ClassifiedImportRow,
  type ExistingHolding,
} from "@/lib/investments/portfolio-import-classify";
import { importEquityPortfolio } from "@/lib/investments/import-actions";
import { parsePortfolioFile } from "@/lib/investments/portfolio-import-parser";

const ACTION_LABEL: Record<ClassifiedImportRow["action"], { label: string; className: string }> = {
  create: { label: "Mới", className: "bg-emerald-soft text-emerald" },
  valuation_only: { label: "Cập nhật giá", className: "bg-gold-soft text-gold-bright" },
  adjust_buy: { label: "Điều chỉnh tăng SL", className: "bg-gold-soft text-gold-bright" },
  adjust_sell: { label: "Điều chỉnh giảm SL — giá bán ước tính", className: "bg-ruby-soft text-[#ff9c8c]" },
};

export function ImportForm({ existingHoldings }: { existingHoldings: Record<string, ExistingHolding> }) {
  const router = useRouter();
  const [rows, setRows] = useState<ClassifiedImportRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setFileError(null);
    setSubmitted(false);
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const result = parsePortfolioFile(buffer);
    if (result.error) {
      setFileError(result.error);
      setRows([]);
      return;
    }
    setRows(result.rows.map((row) => classifyImportRow(row, existingHoldings[row.symbol])));
  }

  function handleConfirm() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await importEquityPortfolio(rows, asOfDate);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  }

  const createCount = rows.filter((r) => r.action === "create").length;
  const adjustCount = rows.filter((r) => r.action === "adjust_buy" || r.action === "adjust_sell").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-[14px] border border-input bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium">
            File danh mục (.xlsx hoặc .csv)
          </label>
          <input
            id="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="text-[12.5px] file:mr-3 file:rounded-md file:border file:border-input file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="as_of_date" className="text-sm font-medium">
            Ngày ghi nhận
          </label>
          <Input
            id="as_of_date"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {fileError && <p className="text-sm text-destructive">{fileError}</p>}

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-[14px] border border-input bg-surface p-4">
            <div className="text-[12.5px] text-muted-foreground">
              {fileName} — {rows.length} mã: {createCount} mã mới, {adjustCount} mã cần điều chỉnh số lượng,{" "}
              {rows.length - createCount - adjustCount} mã chỉ cập nhật giá.
            </div>
            <Button onClick={handleConfirm} disabled={pending}>
              {pending ? "Đang xử lý…" : "Xác nhận nhập"}
            </Button>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          {submitted && (
            <p className="rounded-[10px] bg-emerald-soft px-3.5 py-2.5 text-[12.5px] font-medium text-emerald">
              Đã nhập xong. Vào Danh mục để xem kết quả.
            </p>
          )}

          <div className="overflow-x-auto rounded-[14px] border border-input bg-surface p-4">
            <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <Th>Mã</Th>
                  <Th>Trạng thái</Th>
                  <Th align="right">SL hệ thống</Th>
                  <Th align="right">SL trong file</Th>
                  <Th align="right">Giá vốn</Th>
                  <Th align="right">Giá TT</Th>
                  <Th>Điều chỉnh</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol}>
                    <td className="border-b border-input py-[7px] pr-2.5 align-middle font-semibold last:border-b-0">
                      {row.symbol}
                    </td>
                    <td className="border-b border-input py-[7px] pr-2.5 align-middle last:border-b-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${ACTION_LABEL[row.action].className}`}
                      >
                        {ACTION_LABEL[row.action].label}
                      </span>
                    </td>
                    <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums text-muted-foreground last:border-b-0">
                      {row.existingQuantity ?? "—"}
                    </td>
                    <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                      {row.quantity}
                    </td>
                    <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                      {formatVND(row.avgCost)}
                    </td>
                    <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                      {formatVND(row.marketPrice)}
                    </td>
                    <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
                      {row.adjustQuantity != null
                        ? `${row.action === "adjust_sell" ? "-" : "+"}${row.adjustQuantity} CP @ ${formatVND(row.adjustPrice ?? 0)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`border-b border-input pb-2 pr-2.5 text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
