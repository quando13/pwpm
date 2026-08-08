"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { FINANCING_SOURCES, FINANCING_SOURCES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { InvestmentType } from "@pwpm/shared";

import { recomputeInvestmentSnapshot } from "@/lib/investments/recompute";
import { createClient } from "@/lib/supabase/server";

// UC-02, standalone variant — the Register Investment wizard only captures one Financing
// row at acquisition time. This lets a customer add more afterward: a loan they forgot
// to record initially, a later tranche of a staged/progress-based disbursement, or a
// refinance. computeOutstandingFinancing (packages/domain) already sums principal across
// every financing row for an investment, so adding more rows here just works.
const financingSchema = z.object({
  source_type: z.enum(FINANCING_SOURCES, { error: "Chọn nguồn vốn." }),
  principal_amount: z.coerce.number({ error: "Nhập số tiền vay hợp lệ." }).nonnegative(),
  interest_rate: z.coerce.number({ error: "Nhập lãi suất hợp lệ." }).nonnegative(),
  loan_term_months: z.coerce.number().int().positive().nullable(),
  lender_name: z.string().trim().max(200).nullable(),
  start_date: z.iso.date({ error: "Chọn ngày giải ngân hợp lệ." }),
});

export type FinancingFormState = { error?: string } | undefined;

export async function createFinancing(
  _state: FinancingFormState,
  formData: FormData,
): Promise<FinancingFormState> {
  const investmentId = formData.get("investment_id");
  if (typeof investmentId !== "string" || investmentId.length === 0) {
    return { error: "Thiếu khoản đầu tư." };
  }

  const sourceType = formData.get("source_type");
  const requiresLoanDetails = sourceType !== "personal_capital";
  const parsed = financingSchema.safeParse({
    source_type: sourceType,
    principal_amount: requiresLoanDetails ? formData.get("principal_amount") : 0,
    interest_rate: requiresLoanDetails ? formData.get("interest_rate") : 0,
    loan_term_months:
      requiresLoanDetails && formData.get("loan_term_months") ? formData.get("loan_term_months") : null,
    lender_name: requiresLoanDetails && formData.get("lender_name") ? formData.get("lender_name") : null,
    start_date: formData.get("start_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu tài trợ không hợp lệ." };
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
    .eq("id", investmentId)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const allowedSources = FINANCING_SOURCES_BY_INVESTMENT_TYPE[investment.investment_type as InvestmentType];
  if (!allowedSources.includes(parsed.data.source_type)) {
    return { error: "Nguồn vốn không hợp lệ cho khoản đầu tư này." };
  }

  const { error } = await supabase.from("financings").insert({
    investment_id: investmentId,
    source_type: parsed.data.source_type,
    principal_amount: parsed.data.principal_amount,
    interest_rate: requiresLoanDetails ? parsed.data.interest_rate : null,
    loan_term_months: parsed.data.loan_term_months,
    start_date: parsed.data.start_date,
    lender_name: parsed.data.lender_name,
  });
  if (error) {
    return { error: error.message };
  }

  await recomputeInvestmentSnapshot(investmentId);
  revalidatePath(`/investments/${investmentId}`);
  return undefined;
}

export type UpdateFinancingInput = {
  source_type: string;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number | null;
  lender_name: string | null;
  start_date: string;
};

// Correcting a mis-entered financing row (wrong amount, wrong date, wrong source) is a
// data-entry fix, not a new event — unlike Transactions/Valuations, there's no historical
// "as of that point in time" calculation reading a financing row's own change history, so
// editing in place doesn't rewrite any other figure's meaning. PwPM's job here is to be an
// accurate ledger of what the customer says is true, not to arbitrate correctness — the
// customer owns whether the data is right.
export async function updateFinancing(
  financingId: string,
  investmentId: string,
  input: UpdateFinancingInput,
): Promise<{ error?: string }> {
  const requiresLoanDetails = input.source_type !== "personal_capital";
  const parsed = financingSchema.safeParse({
    source_type: input.source_type,
    principal_amount: requiresLoanDetails ? input.principal_amount : 0,
    interest_rate: requiresLoanDetails ? input.interest_rate : 0,
    loan_term_months: requiresLoanDetails ? input.loan_term_months : null,
    lender_name: requiresLoanDetails ? input.lender_name : null,
    start_date: input.start_date,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu tài trợ không hợp lệ." };
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
    .eq("id", investmentId)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const allowedSources = FINANCING_SOURCES_BY_INVESTMENT_TYPE[investment.investment_type as InvestmentType];
  if (!allowedSources.includes(parsed.data.source_type)) {
    return { error: "Nguồn vốn không hợp lệ cho khoản đầu tư này." };
  }

  const { error } = await supabase
    .from("financings")
    .update({
      source_type: parsed.data.source_type,
      principal_amount: parsed.data.principal_amount,
      interest_rate: requiresLoanDetails ? parsed.data.interest_rate : null,
      loan_term_months: parsed.data.loan_term_months,
      start_date: parsed.data.start_date,
      lender_name: parsed.data.lender_name,
    })
    .eq("id", financingId)
    .eq("investment_id", investmentId);
  if (error) {
    return { error: error.message };
  }

  await recomputeInvestmentSnapshot(investmentId);
  revalidatePath(`/investments/${investmentId}`);
  return {};
}
