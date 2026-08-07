"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";

import { signIn } from "@/lib/auth/actions";

import { OAuthButtons } from "../oauth-buttons";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);

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
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/signup" className="underline underline-offset-2 hover:text-foreground">
            Tạo tài khoản
          </Link>
          <Link href="/forgot-password" className="underline underline-offset-2 hover:text-foreground">
            Quên mật khẩu?
          </Link>
        </div>
      </form>
    </div>
  );
}
