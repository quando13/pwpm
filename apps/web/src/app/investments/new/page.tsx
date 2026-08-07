import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { NewInvestmentForm } from "./new-investment-form";

export default async function NewInvestmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
        <PageHeader
          title="Thêm khoản đầu tư"
          subtitle="Hiện chỉ hỗ trợ Cổ phiếu — Bất động sản cho thuê sẽ có ở bản sau."
        />
        <NewInvestmentForm />
      </div>
    </AppShell>
  );
}
