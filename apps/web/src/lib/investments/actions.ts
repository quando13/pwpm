"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recomputeInvestmentSnapshot } from "@/lib/investments/recompute";
import { createClient } from "@/lib/supabase/server";

// Rental Property's full calculation engine (Financing, outstanding balance, etc.) is
// still Sprint 2.1 work — but registering one and recording its initial capital
// contribution is simple enough (a single amount, per calculation-spec.md's Rental
// Property "Invested Capital = Σ(capital_contribution.amount)") to support now,
// alongside Equity, per the 2026-08-07 Investment List retro.

const baseInvestmentSchema = z.object({
  name: z.string().trim().min(1, { error: "Nhập tên khoản đầu tư." }).max(200),
  acquisition_date: z.iso.date({ error: "Chọn ngày mua hợp lệ." }),
  investment_type: z.enum(["equity", "rental_property"], { error: "Chọn loại đầu tư." }),
});

const equityValueSchema = z.object({
  quantity: z.coerce.number({ error: "Nhập số lượng hợp lệ." }).positive({ error: "Số lượng phải lớn hơn 0." }),
  price_per_unit: z.coerce
    .number({ error: "Nhập giá/đơn vị hợp lệ." })
    .positive({ error: "Giá/đơn vị phải lớn hơn 0." }),
});

const rentalValueSchema = z.object({
  purchase_value: z.coerce
    .number({ error: "Nhập tổng giá trị mua hợp lệ." })
    .positive({ error: "Tổng giá trị mua phải lớn hơn 0." }),
});

export type InvestmentFormState = { error?: string } | undefined;

export async function createInvestment(
  _state: InvestmentFormState,
  formData: FormData,
): Promise<InvestmentFormState> {
  const base = baseInvestmentSchema.safeParse({
    name: formData.get("name"),
    acquisition_date: formData.get("acquisition_date"),
    investment_type: formData.get("investment_type"),
  });
  if (!base.success) {
    return { error: base.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  let quantity: number | undefined;
  let pricePerUnit: number | undefined;
  let purchaseValue: number | undefined;

  if (base.data.investment_type === "equity") {
    const parsed = equityValueSchema.safeParse({
      quantity: formData.get("quantity"),
      price_per_unit: formData.get("price_per_unit"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    }
    ({ quantity, price_per_unit: pricePerUnit } = parsed.data);
  } else {
    const parsed = rentalValueSchema.safeParse({ purchase_value: formData.get("purchase_value") });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    }
    ({ purchase_value: purchaseValue } = parsed.data);
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

  const { data: investment, error: insertError } = await supabase
    .from("investments")
    .insert({
      portfolio_id: portfolio.id,
      customer_id: user.id,
      investment_type: base.data.investment_type,
      name: base.data.name,
      acquisition_date: base.data.acquisition_date,
    })
    .select("id")
    .single();
  if (insertError || !investment) {
    return { error: insertError?.message ?? "Không thể tạo khoản đầu tư." };
  }

  // Not atomic with the insert above (supabase-js has no multi-statement transaction) —
  // compensate by deleting the investment if recording its purchase transaction fails,
  // rather than leaving a valueless investment behind.
  const { error: txError } =
    base.data.investment_type === "equity"
      ? await supabase.from("transactions").insert({
          investment_id: investment.id,
          transaction_type: "buy_shares",
          transaction_date: base.data.acquisition_date,
          amount: quantity! * pricePerUnit!,
          quantity,
          price_per_unit: pricePerUnit,
          fee: 0,
        })
      : await supabase.from("transactions").insert({
          investment_id: investment.id,
          transaction_type: "capital_contribution",
          transaction_date: base.data.acquisition_date,
          amount: purchaseValue,
        });

  if (txError) {
    await supabase.from("investments").delete().eq("id", investment.id);
    return { error: txError.message };
  }

  await recomputeInvestmentSnapshot(investment.id);
  redirect("/investments");
}

const updateInvestmentSchema = z.object({
  investment_id: z.uuid(),
  name: z.string().trim().min(1, { error: "Nhập tên khoản đầu tư." }).max(200),
  acquisition_date: z.iso.date({ error: "Chọn ngày mua hợp lệ." }),
});

export async function updateInvestment(
  _state: InvestmentFormState,
  formData: FormData,
): Promise<InvestmentFormState> {
  const base = updateInvestmentSchema.safeParse({
    investment_id: formData.get("investment_id"),
    name: formData.get("name"),
    acquisition_date: formData.get("acquisition_date"),
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

  const { data: investment, error: fetchError } = await supabase
    .from("investments")
    .select("id, investment_type")
    .eq("id", base.data.investment_id)
    .eq("customer_id", user.id)
    .single();
  if (fetchError || !investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const { error: updateError } = await supabase
    .from("investments")
    .update({ name: base.data.name, acquisition_date: base.data.acquisition_date })
    .eq("id", investment.id);
  if (updateError) {
    return { error: updateError.message };
  }

  // Only edit the purchase transaction here if exactly one exists — once a second
  // transaction has been recorded (Sprint 1.2's Add Transaction), which one is "the"
  // purchase value becomes ambiguous, so this form leaves them alone.
  const purchaseType = investment.investment_type === "equity" ? "buy_shares" : "capital_contribution";
  const { data: purchaseTxs } = await supabase
    .from("transactions")
    .select("id")
    .eq("investment_id", investment.id)
    .eq("transaction_type", purchaseType);

  if (purchaseTxs && purchaseTxs.length === 1) {
    const txId = purchaseTxs[0].id;
    if (investment.investment_type === "equity") {
      const parsed = equityValueSchema.safeParse({
        quantity: formData.get("quantity"),
        price_per_unit: formData.get("price_per_unit"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
      }
      await supabase
        .from("transactions")
        .update({
          quantity: parsed.data.quantity,
          price_per_unit: parsed.data.price_per_unit,
          amount: parsed.data.quantity * parsed.data.price_per_unit,
          transaction_date: base.data.acquisition_date,
        })
        .eq("id", txId);
    } else {
      const parsed = rentalValueSchema.safeParse({ purchase_value: formData.get("purchase_value") });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
      }
      await supabase
        .from("transactions")
        .update({ amount: parsed.data.purchase_value, transaction_date: base.data.acquisition_date })
        .eq("id", txId);
    }
    await recomputeInvestmentSnapshot(investment.id);
  }

  redirect("/investments");
}

export async function archiveInvestment(investmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  await supabase.from("investments").update({ status: "archived" }).eq("id", investmentId).eq("customer_id", user.id);
  revalidatePath("/investments");
}

export async function restoreInvestment(investmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  await supabase.from("investments").update({ status: "active" }).eq("id", investmentId).eq("customer_id", user.id);
  revalidatePath("/investments");
}
