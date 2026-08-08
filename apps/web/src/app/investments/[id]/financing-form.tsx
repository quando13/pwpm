"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@pwpm/ui";
import { FINANCING_SOURCES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { FinancingSource, InvestmentType } from "@pwpm/shared";

import { createFinancing } from "@/lib/financing/actions";

import { FINANCING_SOURCE_LABEL } from "./labels";

export function FinancingForm({
  investmentId,
  investmentType,
}: {
  investmentId: string;
  investmentType: InvestmentType;
}) {
  const sourceOptions = FINANCING_SOURCES_BY_INVESTMENT_TYPE[investmentType];
  const [state, action, pending] = useActionState(createFinancing, undefined);
  const [source, setSource] = useState<FinancingSource>(
    sourceOptions.includes("bank_loan") ? "bank_loan" : sourceOptions[0],
  );
  const requiresLoanDetails = source !== "personal_capital";

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[14px] border border-input bg-surface p-4">
      <input type="hidden" name="investment_id" value={investmentId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="source_type" className="text-sm font-medium">
          Nguồn vốn
        </label>
        <select
          id="source_type"
          name="source_type"
          value={source}
          onChange={(e) => setSource(e.target.value as FinancingSource)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {sourceOptions.map((s) => (
            <option key={s} value={s}>
              {FINANCING_SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="start_date" className="text-sm font-medium">
          Ngày giải ngân
        </label>
        <Input id="start_date" name="start_date" type="date" required />
        <p className="text-[11px] text-muted-foreground">
          Chỉ nhập khi tiền đã thực nhận — dùng cho cả khoản vay theo đợt/tiến độ.
        </p>
      </div>

      {requiresLoanDetails && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="principal_amount" className="text-sm font-medium">
                Số tiền vay (₫)
              </label>
              <Input id="principal_amount" name="principal_amount" type="number" min="0" step="any" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interest_rate" className="text-sm font-medium">
                Lãi suất (%/năm)
              </label>
              <Input id="interest_rate" name="interest_rate" type="number" min="0" step="any" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="loan_term_months" className="text-sm font-medium">
                Thời hạn (tháng)
              </label>
              <Input id="loan_term_months" name="loan_term_months" type="number" min="0" step="1" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lender_name" className="text-sm font-medium">
                {source === "bank_loan" ? "Ngân hàng" : source === "margin_loan" ? "Công ty chứng khoán" : "Người cho vay"}
              </label>
              <Input id="lender_name" name="lender_name" />
            </div>
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Đăng ký khoản vay"}
      </Button>
    </form>
  );
}
