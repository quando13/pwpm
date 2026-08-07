"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { TRANSACTION_TYPES, TRANSACTION_TYPES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { InvestmentType } from "@pwpm/shared";

import { recomputeInvestmentSnapshot } from "@/lib/investments/recompute";
import { createClient } from "@/lib/supabase/server";

const QUANTITY_BASED_TYPES = new Set(["buy_shares", "sell_shares"]);

const baseSchema = z.object({
  investment_id: z.uuid(),
  transaction_type: z.enum(TRANSACTION_TYPES, { error: "Chọn loại giao dịch." }),
  transaction_date: z.iso.date({ error: "Chọn ngày giao dịch hợp lệ." }),
});

const quantityValueSchema = z.object({
  quantity: z.coerce.number({ error: "Nhập số lượng hợp lệ." }).positive({ error: "Số lượng phải lớn hơn 0." }),
  price_per_unit: z.coerce
    .number({ error: "Nhập giá/đơn vị hợp lệ." })
    .positive({ error: "Giá/đơn vị phải lớn hơn 0." }),
  fee: z.coerce.number({ error: "Phí không hợp lệ." }).nonnegative().default(0),
});

const amountValueSchema = z.object({
  amount: z.coerce.number({ error: "Nhập số tiền hợp lệ." }).positive({ error: "Số tiền phải lớn hơn 0." }),
});

export type TransactionFormState = { error?: string } | undefined;

export async function createTransaction(
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const base = baseSchema.safeParse({
    investment_id: formData.get("investment_id"),
    transaction_type: formData.get("transaction_type"),
    transaction_date: formData.get("transaction_date"),
  });
  if (!base.success) {
    return { error: base.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: investment } = await supabase
    .from("investments")
    .select("id, investment_type")
    .eq("id", base.data.investment_id)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const allowedTypes = TRANSACTION_TYPES_BY_INVESTMENT_TYPE[investment.investment_type as InvestmentType];
  if (!allowedTypes.includes(base.data.transaction_type)) {
    return { error: "Loại giao dịch không hợp lệ cho khoản đầu tư này." };
  }

  const isQuantityBased = QUANTITY_BASED_TYPES.has(base.data.transaction_type);

  let insertPayload: Record<string, unknown>;
  if (isQuantityBased) {
    const parsed = quantityValueSchema.safeParse({
      quantity: formData.get("quantity"),
      price_per_unit: formData.get("price_per_unit"),
      fee: formData.get("fee") || 0,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    }
    insertPayload = {
      quantity: parsed.data.quantity,
      price_per_unit: parsed.data.price_per_unit,
      fee: parsed.data.fee,
      amount: parsed.data.quantity * parsed.data.price_per_unit + parsed.data.fee,
    };
  } else {
    const parsed = amountValueSchema.safeParse({ amount: formData.get("amount") });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    }
    insertPayload = { amount: parsed.data.amount };
  }

  const { error: insertError } = await supabase.from("transactions").insert({
    investment_id: investment.id,
    transaction_type: base.data.transaction_type,
    transaction_date: base.data.transaction_date,
    notes: formData.get("notes") || null,
    ...insertPayload,
  });
  if (insertError) {
    return { error: insertError.message };
  }

  await recomputeInvestmentSnapshot(investment.id);
  redirect(`/investments/${investment.id}`);
}
