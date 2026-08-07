"use client";

import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";
import type { Investment } from "@pwpm/shared";

import { updateInvestment } from "@/lib/investments/actions";

const TYPE_LABEL: Record<Investment["investment_type"], string> = {
  equity: "Cổ phiếu",
  rental_property: "BĐS cho thuê",
};

export function EditInvestmentForm({
  investment,
  quantity,
  pricePerUnit,
  purchaseValue,
  valueEditable,
}: {
  investment: Investment;
  quantity?: number;
  pricePerUnit?: number;
  purchaseValue?: number;
  valueEditable: boolean;
}) {
  const [state, action, pending] = useActionState(updateInvestment, undefined);

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4 rounded-[14px] border border-input bg-surface p-5">
      <input type="hidden" name="investment_id" value={investment.id} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Loại đầu tư</span>
        <div className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          {TYPE_LABEL[investment.investment_type]} — không thể đổi sau khi tạo
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Tên khoản đầu tư
        </label>
        <Input id="name" name="name" defaultValue={investment.name} required autoFocus />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="acquisition_date" className="text-sm font-medium">
          Ngày mua
        </label>
        <Input
          id="acquisition_date"
          name="acquisition_date"
          type="date"
          defaultValue={investment.acquisition_date}
          required
        />
      </div>

      {valueEditable ? (
        investment.investment_type === "equity" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="quantity" className="text-sm font-medium">
                Số lượng
              </label>
              <Input id="quantity" name="quantity" type="number" min="0" step="any" defaultValue={quantity} required />
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
                defaultValue={pricePerUnit}
                required
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="purchase_value" className="text-sm font-medium">
              Tổng giá trị mua (₫)
            </label>
            <Input
              id="purchase_value"
              name="purchase_value"
              type="number"
              min="0"
              step="any"
              defaultValue={purchaseValue}
              required
            />
          </div>
        )
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          Khoản đầu tư này đã có nhiều giao dịch — sửa giá trị mua trực tiếp trong tab Giao dịch (sắp có).
        </p>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
