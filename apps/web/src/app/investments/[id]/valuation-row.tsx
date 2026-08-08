"use client";

import { useState, useTransition } from "react";
import { formatDate, formatVND } from "@pwpm/utils";
import { VALUATION_SOURCES } from "@pwpm/shared";
import type { Valuation, ValuationSource } from "@pwpm/shared";

import { EditIcon } from "@/components/icons";
import { updateValuation } from "@/lib/valuations/actions";

import { VALUATION_SOURCE_LABEL } from "./labels";

export function ValuationRow({ investmentId, valuation }: { investmentId: string; valuation: Valuation }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [date, setDate] = useState(valuation.valuation_date);
  const [value, setValue] = useState(String(valuation.estimated_value));
  const [source, setSource] = useState<ValuationSource>(valuation.valuation_source);
  const [notes, setNotes] = useState(valuation.notes ?? "");

  function resetFields() {
    setDate(valuation.valuation_date);
    setValue(String(valuation.estimated_value));
    setSource(valuation.valuation_source);
    setNotes(valuation.notes ?? "");
    setError(null);
  }

  if (!editing) {
    return (
      <tr>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
          {formatDate(valuation.valuation_date)}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
          {formatVND(valuation.estimated_value)}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle last:border-b-0">
          {VALUATION_SOURCE_LABEL[valuation.valuation_source]}
        </td>
        <td className="border-b border-input py-[7px] pl-2.5 align-middle last:border-b-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Sửa định giá"
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <EditIcon className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={4} className="border-b border-input py-2.5 pr-2.5 last:border-b-0">
        <div className="flex flex-wrap items-end gap-2 rounded-lg bg-surface-2 p-2.5">
          <Field label="Ngày định giá">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-[11.5px] tabular-nums"
            />
          </Field>
          <Field label="Giá trị ước tính">
            <input
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
            />
          </Field>
          <Field label="Nguồn định giá">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ValuationSource)}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-[11.5px]"
            >
              {VALUATION_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {VALUATION_SOURCE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ghi chú">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-7 w-40 rounded-md border border-input bg-background px-1.5 text-[11.5px]"
            />
          </Field>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!date || !value || Number(value) <= 0) {
                  setError("Nhập ngày và giá trị hợp lệ.");
                  return;
                }
                startTransition(async () => {
                  const result = await updateValuation(valuation.id, investmentId, {
                    valuation_date: date,
                    estimated_value: Number(value),
                    valuation_source: source,
                    notes: notes || null,
                  });
                  if (result?.error) {
                    setError(result.error);
                  } else {
                    setEditing(false);
                    setError(null);
                  }
                });
              }}
              className="grid h-7 w-7 place-items-center rounded-md bg-emerald-soft text-emerald disabled:opacity-50"
              aria-label="Lưu"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                resetFields();
              }}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface"
              aria-label="Hủy"
            >
              ✕
            </button>
          </div>

          {error && <span className="w-full text-[11px] text-destructive">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
