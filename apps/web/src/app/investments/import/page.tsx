import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getEquityHoldings } from "@/lib/investments/import-actions";
import { createClient } from "@/lib/supabase/server";

import { ImportForm } from "./import-form";

export default async function ImportPortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const existingHoldings = await getEquityHoldings();

  return (
    <AppShell active="investments">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5">
        <PageHeader
          title="Nhập danh mục chứng khoán"
          subtitle="Upload file danh mục từ công ty chứng khoán — hệ thống tự nhận diện mã mới và cập nhật mã đã có."
        />
        <ImportForm existingHoldings={existingHoldings} />
      </div>
    </AppShell>
  );
}
