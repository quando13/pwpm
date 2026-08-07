"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";

import { signUp } from "@/lib/auth/actions";

import { OAuthButtons } from "../oauth-buttons";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  if (state?.checkEmail) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <OAuthButtons />
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Mật khẩu
          </label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={6} />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}
