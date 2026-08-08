"use client";

import { useState, useTransition } from "react";
import { formatDate } from "@pwpm/utils";
import type { ReferenceEvent, ReferenceEventType } from "@pwpm/shared";

import { EditIcon } from "@/components/icons";
import { updateReferenceEvent } from "@/lib/reference-events/actions";

import { REFERENCE_EVENT_TYPE_LABEL } from "./labels";

export function ReferenceEventCard({
  investmentId,
  event,
  allowedTypes,
}: {
  investmentId: string;
  event: ReferenceEvent;
  allowedTypes: readonly ReferenceEventType[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<ReferenceEventType>(event.event_type);
  const [date, setDate] = useState(event.event_date);
  const [description, setDescription] = useState(event.description);

  function resetFields() {
    setType(event.event_type);
    setDate(event.event_date);
    setDescription(event.description);
    setError(null);
  }

  if (!editing) {
    return (
      <li className="border-b border-input pb-3 last:border-b-0 last:pb-0">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-gold-soft px-2 py-[3px] text-[10.5px] font-semibold text-gold-bright">
            {REFERENCE_EVENT_TYPE_LABEL[event.event_type]}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] tabular-nums text-muted-foreground">{formatDate(event.event_date)}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Sửa sự kiện"
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              <EditIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[12.5px]">{event.description}</p>
      </li>
    );
  }

  return (
    <li className="border-b border-input pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-2 rounded-lg bg-surface-2 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Loại sự kiện">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReferenceEventType)}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-[11.5px]"
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {REFERENCE_EVENT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-[11.5px] tabular-nums"
            />
          </Field>
        </div>
        <Field label="Mô tả">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-1.5 py-1 text-[11.5px]"
          />
        </Field>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!date || !description.trim()) {
                setError("Nhập ngày và mô tả hợp lệ.");
                return;
              }
              startTransition(async () => {
                const result = await updateReferenceEvent(event.id, investmentId, {
                  event_type: type,
                  event_date: date,
                  description: description.trim(),
                });
                if (result?.error) {
                  setError(result.error);
                } else {
                  setEditing(false);
                  setError(null);
                }
              });
            }}
            className="grid h-7 w-7 place-items-center rounded-md bg-emerald-soft text-emerald disabled:opacity-50"
            aria-label="Lưu"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              resetFields();
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface"
            aria-label="Hủy"
          >
            ✕
          </button>
        </div>

        {error && <span className="text-[11px] text-destructive">{error}</span>}
      </div>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
