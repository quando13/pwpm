"use server";

import { revalidatePath } from "next/cache";
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

export type UpdateValuationInput = {
  valuation_date: string;
  estimated_value: number;
  valuation_source: string;
  notes: string | null;
};

// Same "customer owns the data" principle as Financing/Transactions — structural
// validation only, no attempt to judge whether a corrected valuation is "plausible".
export async function updateValuation(
  valuationId: string,
  investmentId: string,
  input: UpdateValuationInput,
): Promise<{ error?: string }> {
  const parsed = valuationSchema.safeParse({
    investment_id: investmentId,
    valuation_date: input.valuation_date,
    estimated_value: input.estimated_value,
    valuation_source: input.valuation_source,
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
    .eq("id", investmentId)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const { error: updateError } = await supabase
    .from("valuations")
    .update({
      valuation_date: parsed.data.valuation_date,
      estimated_value: parsed.data.estimated_value,
      valuation_source: parsed.data.valuation_source,
      notes: input.notes || null,
    })
    .eq("id", valuationId)
    .eq("investment_id", investmentId);
  if (updateError) {
    return { error: updateError.message };
  }

  await recomputeInvestmentSnapshot(investment.id);
  revalidatePath(`/investments/${investment.id}`);
  return {};
}

// Same effect as createValuation, but for the Investment List's inline "Định giá mới
// nhất" editor (Retro 2, 2026-08-07) — stays on /investments (revalidate, no redirect)
// and takes plain args since it's called directly from a Client Component, not a form.
export async function quickAddValuation(
  investmentId: string,
  estimatedValue: number,
): Promise<{ error?: string }> {
  const parsed = z
    .number({ error: "Nhập giá trị hợp lệ." })
    .positive({ error: "Giá trị phải lớn hơn 0." })
    .safeParse(estimatedValue);
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
    .eq("id", investmentId)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const { error: insertError } = await supabase.from("valuations").insert({
    investment_id: investment.id,
    valuation_date: new Date().toISOString().slice(0, 10),
    estimated_value: parsed.data,
    valuation_source: "manual_estimate",
  });
  if (insertError) {
    return { error: insertError.message };
  }

  await recomputeInvestmentSnapshot(investment.id);
  revalidatePath("/investments");
  return {};
}
