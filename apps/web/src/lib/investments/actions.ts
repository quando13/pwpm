"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

// Equity only for now — Rental Property (with its Financing step) lands in Sprint 2.1,
// per docs/product/sprint-plan.md.
const equityInvestmentSchema = z.object({
  name: z.string().trim().min(1, { error: "Nhập tên khoản đầu tư." }).max(200),
  acquisition_date: z.iso.date({ error: "Chọn ngày mua hợp lệ." }),
});

export type CreateInvestmentState = { error?: string } | undefined;

export async function createEquityInvestment(
  _state: CreateInvestmentState,
  formData: FormData,
): Promise<CreateInvestmentState> {
  const parsed = equityInvestmentSchema.safeParse({
    name: formData.get("name"),
    acquisition_date: formData.get("acquisition_date"),
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

  // Auto-created by the handle_new_user trigger on signup — see supabase/migrations.
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("customer_id", user.id)
    .eq("is_default", true)
    .single();
  if (portfolioError || !portfolio) {
    return { error: "Không tìm thấy danh mục mặc định. Vui lòng đăng xuất và đăng nhập lại." };
  }

  const { error: insertError } = await supabase.from("investments").insert({
    portfolio_id: portfolio.id,
    customer_id: user.id,
    investment_type: "equity",
    name: parsed.data.name,
    acquisition_date: parsed.data.acquisition_date,
  });
  if (insertError) {
    return { error: insertError.message };
  }

  redirect("/investments");
}
