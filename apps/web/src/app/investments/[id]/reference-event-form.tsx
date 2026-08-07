"use client";

import { useActionState } from "react";
import { Button, Input } from "@pwpm/ui";
import type { ReferenceEventType } from "@pwpm/shared";

import { createReferenceEvent } from "@/lib/reference-events/actions";

import { REFERENCE_EVENT_TYPE_LABEL } from "./labels";

export function ReferenceEventForm({
  investmentId,
  allowedTypes,
}: {
  investmentId: string;
  allowedTypes: readonly ReferenceEventType[];
}) {
  const [state, action, pending] = useActionState(createReferenceEvent, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[14px] border border-input bg-surface p-4">
      <input type="hidden" name="investment_id" value={investmentId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event_type" className="text-sm font-medium">
          Loại sự kiện
        </label>
        <select
          id="event_type"
          name="event_type"
          defaultValue={allowedTypes[0]}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {allowedTypes.map((t) => (
            <option key={t} value={t}>
              {REFERENCE_EVENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event_date" className="text-sm font-medium">
          Ngày sự kiện
        </label>
        <Input id="event_date" name="event_date" type="date" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Thêm sự kiện"}
      </Button>
    </form>
  );
}
