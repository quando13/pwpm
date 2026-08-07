import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only reachable with the temporary session established by /auth/callback
  // after clicking the emailed reset link.
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Đặt mật khẩu mới</h1>
      </div>
      <ResetPasswordForm />
    </>
  );
}
