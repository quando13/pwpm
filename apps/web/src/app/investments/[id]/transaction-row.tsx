"use client";

import { useState, useTransition } from "react";
import { formatDate, formatVND } from "@pwpm/utils";
import type { Transaction, TransactionType } from "@pwpm/shared";

import { EditIcon } from "@/components/icons";
import { updateTransaction } from "@/lib/transactions/actions";

import { TRANSACTION_TYPE_LABEL } from "./labels";

const QUANTITY_BASED_TYPES = new Set<TransactionType>(["buy_shares", "sell_shares"]);

export function TransactionRow({
  investmentId,
  transaction,
  allowedTypes,
}: {
  investmentId: string;
  transaction: Transaction;
  allowedTypes: readonly TransactionType[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<TransactionType>(transaction.transaction_type);
  const [date, setDate] = useState(transaction.transaction_date);
  const [quantity, setQuantity] = useState(transaction.quantity != null ? String(transaction.quantity) : "");
  const [pricePerUnit, setPricePerUnit] = useState(
    transaction.price_per_unit != null ? String(transaction.price_per_unit) : "",
  );
  const [fee, setFee] = useState(transaction.fee != null ? String(transaction.fee) : "0");
  const [amount, setAmount] = useState(String(transaction.amount));
  const [notes, setNotes] = useState(transaction.notes ?? "");

  const quantityBased = QUANTITY_BASED_TYPES.has(type);

  function resetFields() {
    setType(transaction.transaction_type);
    setDate(transaction.transaction_date);
    setQuantity(transaction.quantity != null ? String(transaction.quantity) : "");
    setPricePerUnit(transaction.price_per_unit != null ? String(transaction.price_per_unit) : "");
    setFee(transaction.fee != null ? String(transaction.fee) : "0");
    setAmount(String(transaction.amount));
    setNotes(transaction.notes ?? "");
    setError(null);
  }

  if (!editing) {
    return (
      <tr>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
          {formatDate(transaction.transaction_date)}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 align-middle font-medium last:border-b-0">
          {TRANSACTION_TYPE_LABEL[transaction.transaction_type]}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
          {transaction.quantity ?? "—"}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
          {transaction.price_per_unit ? formatVND(transaction.price_per_unit) : "—"}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
          {transaction.fee ? formatVND(transaction.fee) : "—"}
        </td>
        <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
          {formatVND(transaction.amount)}
        </td>
        <td className="border-b border-input py-[7px] pl-2.5 align-middle last:border-b-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Sửa giao dịch"
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
          <Field label="Loại giao dịch">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-[11.5px]"
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {TRANSACTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày giao dịch">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-[11.5px] tabular-nums"
            />
          </Field>

          {quantityBased ? (
            <>
              <Field label="Số lượng">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-7 w-24 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
                />
              </Field>
              <Field label="Giá/đơn vị">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="h-7 w-28 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
                />
              </Field>
              <Field label="Phí">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="h-7 w-24 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
                />
              </Field>
            </>
          ) : (
            <Field label="Số tiền">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-right text-[11.5px] tabular-nums"
              />
            </Field>
          )}

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
                if (!date) {
                  setError("Chọn ngày giao dịch hợp lệ.");
                  return;
                }
                startTransition(async () => {
                  const result = await updateTransaction(transaction.id, investmentId, {
                    transaction_type: type,
                    transaction_date: date,
                    quantity: quantityBased ? Number(quantity) || 0 : null,
                    price_per_unit: quantityBased ? Number(pricePerUnit) || 0 : null,
                    fee: quantityBased ? Number(fee) || 0 : null,
                    amount: quantityBased ? null : Number(amount) || 0,
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
