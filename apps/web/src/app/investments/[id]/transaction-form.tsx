"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@pwpm/ui";
import type { TransactionType } from "@pwpm/shared";

import { createTransaction } from "@/lib/transactions/actions";

import { TRANSACTION_TYPE_LABEL } from "./labels";

const QUANTITY_BASED_TYPES = new Set<TransactionType>(["buy_shares", "sell_shares"]);

export function TransactionForm({ investmentId, allowedTypes }: { investmentId: string; allowedTypes: readonly TransactionType[] }) {
  const [state, action, pending] = useActionState(createTransaction, undefined);
  const [type, setType] = useState<TransactionType>(allowedTypes[0]);
  const quantityBased = QUANTITY_BASED_TYPES.has(type);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[14px] border border-input bg-surface p-4">
      <input type="hidden" name="investment_id" value={investmentId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="transaction_type" className="text-sm font-medium">
          Loại giao dịch
        </label>
        <select
          id="transaction_type"
          name="transaction_type"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {allowedTypes.map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="transaction_date" className="text-sm font-medium">
          Ngày giao dịch
        </label>
        <Input id="transaction_date" name="transaction_date" type="date" required />
      </div>

      {quantityBased ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quantity" className="text-sm font-medium">
              Số lượng
            </label>
            <Input id="quantity" name="quantity" type="number" min="0" step="any" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price_per_unit" className="text-sm font-medium">
              Giá/đơn vị
            </label>
            <Input id="price_per_unit" name="price_per_unit" type="number" min="0" step="any" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fee" className="text-sm font-medium">
              Phí
            </label>
            <Input id="fee" name="fee" type="number" min="0" step="any" defaultValue={0} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium">
            Số tiền (₫)
          </label>
          <Input id="amount" name="amount" type="number" min="0" step="any" required />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Ghi chú (không bắt buộc)
        </label>
        <Input id="notes" name="notes" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Thêm giao dịch"}
      </Button>
    </form>
  );
}
