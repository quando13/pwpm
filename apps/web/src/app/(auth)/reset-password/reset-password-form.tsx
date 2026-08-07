"use client";

import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";

import { updatePassword } from "@/lib/auth/actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Mật khẩu mới
        </label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={6} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Lưu mật khẩu mới"}
      </Button>
    </form>
  );
}
