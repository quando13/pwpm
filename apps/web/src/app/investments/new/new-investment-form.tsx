"use client";

import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";

import { createEquityInvestment } from "@/lib/investments/actions";

export function NewInvestmentForm() {
  const [state, action, pending] = useActionState(createEquityInvestment, undefined);

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4 rounded-[14px] border border-input bg-surface p-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Tên khoản đầu tư
        </label>
        <Input id="name" name="name" placeholder="Ví dụ: FPT Corp" required autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="acquisition_date" className="text-sm font-medium">
          Ngày mua
        </label>
        <Input id="acquisition_date" name="acquisition_date" type="date" required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang tạo…" : "Tạo khoản đầu tư"}
      </Button>
    </form>
  );
}
