"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { VALUATION_SOURCES } from "@pwpm/shared";

import { recomputeInvestmentSnapshot } from "@/lib/investments/recompute";
import { createClient } from "@/lib/supabase/server";

const valuationSchema = z.object({
  investment_id: z.uuid(),
  valuation_date: z.iso.date({ error: "Chọn ngày định giá hợp lệ." }),
  estimated_value: z.coerce
    .number({ error: "Nhập giá trị hợp lệ." })
    .positive({ error: "Giá trị phải lớn hơn 0." }),
  valuation_source: z.enum(VALUATION_SOURCES, { error: "Chọn nguồn định giá." }),
});

export type ValuationFormState = { error?: string } | undefined;

export async function createValuation(
  _state: ValuationFormState,
  formData: FormData,
): Promise<ValuationFormState> {
  const parsed = valuationSchema.safeParse({
    investment_id: formData.get("investment_id"),
    valuation_date: formData.get("valuation_date"),
    estimated_value: formData.get("estimated_value"),
    valuation_source: formData.get("valuation_source"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
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
    .select("id")
    .eq("id", parsed.data.investment_id)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const { error: insertError } = await supabase.from("valuations").insert({
    investment_id: investment.id,
    valuation_date: parsed.data.valuation_date,
    estimated_value: parsed.data.estimated_value,
    valuation_source: parsed.data.valuation_source,
    notes: formData.get("notes") || null,
  });
  if (insertError) {
    return { error: insertError.message };
  }

  await recomputeInvestmentSnapshot(investment.id);
  redirect(`/investments/${investment.id}?tab=valuations`);
}
