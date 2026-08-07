"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";

import { requestPasswordReset } from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Kiểm tra email để nhận liên kết đặt lại mật khẩu.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
          Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}
