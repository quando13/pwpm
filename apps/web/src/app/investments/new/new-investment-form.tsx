"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@pwpm/ui";
import type { FinancingSource, Investment } from "@pwpm/shared";

import { createInvestment } from "@/lib/investments/actions";

export type InitialInvestmentValues = {
  name: string;
  investment_type: Investment["investment_type"];
  acquisition_date: string;
  quantity?: number;
  price_per_unit?: number;
  purchase_value?: number;
};

export function NewInvestmentForm({ initial }: { initial?: InitialInvestmentValues }) {
  const [state, action, pending] = useActionState(createInvestment, undefined);
  const [type, setType] = useState<Investment["investment_type"]>(initial?.investment_type ?? "equity");
  const [financingSource, setFinancingSource] = useState<FinancingSource>("personal_capital");

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4 rounded-[14px] border border-input bg-surface p-5">
      <input type="hidden" name="investment_type" value={type} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Loại đầu tư</span>
        <div className="flex gap-2">
          <TypeButton label="Cổ phiếu" active={type === "equity"} onClick={() => setType("equity")} />
          <TypeButton
            label="BĐS cho thuê"
            active={type === "rental_property"}
            onClick={() => setType("rental_property")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Tên khoản đầu tư
        </label>
        <Input
          id="name"
          name="name"
          placeholder={type === "equity" ? "Ví dụ: FPT Corp" : "Ví dụ: Căn hộ Riverside Q7"}
          defaultValue={initial?.name}
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="acquisition_date" className="text-sm font-medium">
          Ngày mua
        </label>
        <Input
          id="acquisition_date"
          name="acquisition_date"
          type="date"
          defaultValue={initial?.acquisition_date}
          required
        />
      </div>

      {type === "equity" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quantity" className="text-sm font-medium">
              Số lượng
            </label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step="any"
              defaultValue={initial?.quantity}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price_per_unit" className="text-sm font-medium">
              Giá/đơn vị (₫)
            </label>
            <Input
              id="price_per_unit"
              name="price_per_unit"
              type="number"
              min="0"
              step="any"
              defaultValue={initial?.price_per_unit}
              required
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="purchase_value" className="text-sm font-medium">
              Vốn góp ban đầu (₫)
            </label>
            <Input
              id="purchase_value"
              name="purchase_value"
              type="number"
              min="0"
              step="any"
              defaultValue={initial?.purchase_value}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 border-t border-input pt-3.5">
            <span className="text-sm font-medium">Nguồn vốn</span>
            <div className="flex gap-2">
              <TypeButton
                label="Vốn tự có"
                active={financingSource === "personal_capital"}
                onClick={() => setFinancingSource("personal_capital")}
              />
              <TypeButton
                label="Vay ngân hàng"
                active={financingSource === "bank_loan"}
                onClick={() => setFinancingSource("bank_loan")}
              />
              <TypeButton
                label="Vay cá nhân"
                active={financingSource === "private_loan"}
                onClick={() => setFinancingSource("private_loan")}
              />
            </div>
          </div>
          <input type="hidden" name="financing_source_type" value={financingSource} />

          {financingSource !== "personal_capital" && (
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
                    {financingSource === "bank_loan" ? "Ngân hàng" : "Người cho vay"}
                  </label>
                  <Input id="lender_name" name="lender_name" />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang tạo…" : "Tạo khoản đầu tư"}
      </Button>
    </form>
  );
}

function TypeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-lg border border-gold bg-gold-soft px-3 py-2 text-sm font-semibold text-gold-bright"
          : "flex-1 rounded-lg border border-input px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
