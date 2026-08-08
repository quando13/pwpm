"use client";

import { useState, useTransition } from "react";
import { formatDate, formatVND } from "@pwpm/utils";
import { FINANCING_SOURCES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { Financing, FinancingSource, InvestmentType } from "@pwpm/shared";

import { EditIcon } from "@/components/icons";
import { updateFinancing } from "@/lib/financing/actions";

import { FINANCING_SOURCE_LABEL } from "./labels";

export function FinancingRow({
  investmentId,
  investmentType,
  financing,
}: {
  investmentId: string;
  investmentType: InvestmentType;
  financing: Financing;
}) {
  const sourceOptions = FINANCING_SOURCES_BY_INVESTMENT_TYPE[investmentType];
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [source, setSource] = useState<FinancingSource>(financing.source_type);
  const [principal, setPrincipal] = useState(String(financing.principal_amount));
  const [interest, setInterest] = useState(financing.interest_rate != null ? String(financing.interest_rate) : "");
  const [term, setTerm] = useState(financing.loan_term_months != null ? String(financing.loan_term_months) : "");
  const [lender, setLender] = useState(financing.lender_name ?? "");
  const [startDate, setStartDate] = useState(financing.start_date);

  const requiresLoanDetails = source !== "personal_capital";

  function resetFields() {
    setSource(financing.source_type);
    setPrincipal(String(financing.principal_amount));
    setInterest(financing.interest_rate != null ? String(financing.interest_rate) : "");
    setTerm(financing.loan_term_months != null ? String(financing.loan_term_months) : "");
    setLender(financing.lender_name ?? "");
    setStartDate(financing.start_date);
    setError(null);
  }

  if (!editing) {
    return (
      <tr>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle font-medium last:border-b-0">
          {FINANCING_SOURCE_LABEL[financing.source_type]}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
          {formatVND(financing.principal_amount)}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
          {financing.interest_rate != null ? `${financing.interest_rate}%/năm` : "—"}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
          {financing.loan_term_months != null ? `${financing.loan_term_months} tháng` : "—"}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle last:border-b-0">
          {financing.lender_name ?? "—"}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
          {formatDate(financing.start_date)}
        </td>
        <td className="border-b border-input py-[7px] pl-2.5 align-middle last:border-b-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Sửa khoản vay"
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
      <td colSpan={7} className="border-b border-input py-2.5 pr-2.5 last:border-b-0">
        <div className="flex flex-wrap items-end gap-2 rounded-lg bg-surface-2 p-2.5">
          <Field label="Nguồn vốn">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as FinancingSource)}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-[11.5px]"
            >
              {sourceOptions.map((s) => (
                <option key={s} value={s}>
                  {FINANCING_SOURCE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày giải ngân">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-[11.5px] tabular-nums"
            />
          </Field>
          {requiresLoanDetails && (
            <>
              <Field label="Số tiền vay">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="h-7 w-28 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
                />
              </Field>
              <Field label="Lãi suất %/năm">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="h-7 w-16 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
                />
              </Field>
              <Field label="Thời hạn (tháng)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="h-7 w-16 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
                />
              </Field>
              <Field label={source === "bank_loan" ? "Ngân hàng" : source === "margin_loan" ? "Công ty chứng khoán" : "Người cho vay"}>
                <input
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-[11.5px]"
                />
              </Field>
            </>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!startDate) {
                  setError("Chọn ngày giải ngân hợp lệ.");
                  return;
                }
                startTransition(async () => {
                  const result = await updateFinancing(financing.id, investmentId, {
                    source_type: source,
                    principal_amount: Number(principal) || 0,
                    interest_rate: Number(interest) || 0,
                    loan_term_months: term ? Number(term) : null,
                    lender_name: lender || null,
                    start_date: startDate,
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
