"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { REFERENCE_EVENT_TYPES, REFERENCE_EVENT_TYPES_BY_INVESTMENT_TYPE } from "@pwpm/shared";
import type { InvestmentType } from "@pwpm/shared";

import { createClient } from "@/lib/supabase/server";

// No evidence attachment (Supabase Storage upload) yet — sprint-plan.md's Sprint 1.3
// scope is UC-04 recording only; file upload is a later addition.
const referenceEventSchema = z.object({
  investment_id: z.uuid(),
  event_type: z.enum(REFERENCE_EVENT_TYPES, { error: "Chọn loại sự kiện." }),
  event_date: z.iso.date({ error: "Chọn ngày hợp lệ." }),
  description: z.string().trim().min(1, { error: "Nhập mô tả sự kiện." }).max(2000),
});

export type ReferenceEventFormState = { error?: string } | undefined;

export async function createReferenceEvent(
  _state: ReferenceEventFormState,
  formData: FormData,
): Promise<ReferenceEventFormState> {
  const parsed = referenceEventSchema.safeParse({
    investment_id: formData.get("investment_id"),
    event_type: formData.get("event_type"),
    event_date: formData.get("event_date"),
    description: formData.get("description"),
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
    .select("id, investment_type")
    .eq("id", parsed.data.investment_id)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const allowedTypes = REFERENCE_EVENT_TYPES_BY_INVESTMENT_TYPE[investment.investment_type as InvestmentType];
  if (!allowedTypes.includes(parsed.data.event_type)) {
    return { error: "Loại sự kiện không hợp lệ cho khoản đầu tư này." };
  }

  const { error: insertError } = await supabase.from("reference_events").insert({
    investment_id: investment.id,
    event_type: parsed.data.event_type,
    event_date: parsed.data.event_date,
    description: parsed.data.description,
  });
  if (insertError) {
    return { error: insertError.message };
  }

  redirect(`/investments/${investment.id}?tab=events`);
}

export type UpdateReferenceEventInput = {
  event_type: string;
  event_date: string;
  description: string;
};

// Same "customer owns the data" principle — a Reference Event is a note, not a
// calculation input, so editing it never touches any Performance Snapshot figure.
export async function updateReferenceEvent(
  eventId: string,
  investmentId: string,
  input: UpdateReferenceEventInput,
): Promise<{ error?: string }> {
  const parsed = referenceEventSchema.safeParse({
    investment_id: investmentId,
    event_type: input.event_type,
    event_date: input.event_date,
    description: input.description,
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
    .select("id, investment_type")
    .eq("id", investmentId)
    .eq("customer_id", user.id)
    .single();
  if (!investment) {
    return { error: "Không tìm thấy khoản đầu tư." };
  }

  const allowedTypes = REFERENCE_EVENT_TYPES_BY_INVESTMENT_TYPE[investment.investment_type as InvestmentType];
  if (!allowedTypes.includes(parsed.data.event_type)) {
    return { error: "Loại sự kiện không hợp lệ cho khoản đầu tư này." };
  }

  const { error: updateError } = await supabase
    .from("reference_events")
    .update({
      event_type: parsed.data.event_type,
      event_date: parsed.data.event_date,
      description: parsed.data.description,
    })
    .eq("id", eventId)
    .eq("investment_id", investmentId);
  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/investments/${investment.id}`);
  return {};
}
