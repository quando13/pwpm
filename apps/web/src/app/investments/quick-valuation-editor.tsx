"use client";

import { useState, useTransition } from "react";

import { EditIcon } from "@/components/icons";
import { quickAddValuation } from "@/lib/valuations/actions";

export function QuickValuationEditor({ investmentId, placeholder }: { investmentId: string; placeholder: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={`Cập nhật ${placeholder.toLowerCase()}`}
        aria-label="Cập nhật định giá"
        className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <EditIcon className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <form
      className="flex flex-col items-end gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const num = Number(value);
        if (!value || Number.isNaN(num) || num <= 0) {
          setError("Nhập giá trị hợp lệ.");
          return;
        }
        startTransition(async () => {
          const result = await quickAddValuation(investmentId, num);
          if (result?.error) {
            setError(result.error);
          } else {
            setEditing(false);
            setValue("");
            setError(null);
          }
        });
      }}
    >
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="h-7 w-28 rounded-md border border-input bg-background px-2 text-right text-[11.5px] tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={pending}
          className="grid h-7 w-7 place-items-center rounded-md bg-emerald-soft text-emerald disabled:opacity-50"
          aria-label="Lưu"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2"
          aria-label="Hủy"
        >
          ✕
        </button>
      </div>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </form>
  );
}
