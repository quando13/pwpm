"use client";

import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";
import { VALUATION_SOURCES } from "@pwpm/shared";

import { createValuation } from "@/lib/valuations/actions";

import { VALUATION_SOURCE_LABEL } from "./labels";

export function ValuationForm({ investmentId }: { investmentId: string }) {
  const [state, action, pending] = useActionState(createValuation, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[14px] border border-input bg-surface p-4">
      <input type="hidden" name="investment_id" value={investmentId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="valuation_date" className="text-sm font-medium">
          Ngày định giá
        </label>
        <Input id="valuation_date" name="valuation_date" type="date" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="estimated_value" className="text-sm font-medium">
          Giá trị ước tính (₫)
        </label>
        <Input id="estimated_value" name="estimated_value" type="number" min="0" step="any" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="valuation_source" className="text-sm font-medium">
          Nguồn định giá
        </label>
        <select
          id="valuation_source"
          name="valuation_source"
          defaultValue={VALUATION_SOURCES[0]}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {VALUATION_SOURCES.map((s) => (
            <option key={s} value={s}>
              {VALUATION_SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Ghi chú (không bắt buộc)
        </label>
        <Input id="notes" name="notes" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Thêm định giá"}
      </Button>
    </form>
  );
}
