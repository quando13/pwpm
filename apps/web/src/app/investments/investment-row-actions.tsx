"use client";

import Link from "next/link";
import { useTransition } from "react";

import { CopyIcon, EditIcon, RestoreIcon, TrashIcon } from "@/components/icons";
import { archiveInvestment, restoreInvestment } from "@/lib/investments/actions";

const iconButton =
  "grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

export function InvestmentRowActions({ investmentId, archived }: { investmentId: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-0.5">
      <Link href={`/investments/${investmentId}/edit`} className={iconButton} title="Sửa" aria-label="Sửa">
        <EditIcon className="h-4 w-4" />
      </Link>
      <Link
        href={`/investments/new?cloneFrom=${investmentId}`}
        className={iconButton}
        title="Sao chép"
        aria-label="Sao chép"
      >
        <CopyIcon className="h-4 w-4" />
      </Link>
      {archived ? (
        <button
          type="button"
          disabled={pending}
          title="Khôi phục"
          aria-label="Khôi phục"
          className={iconButton}
          onClick={() => startTransition(() => restoreInvestment(investmentId))}
        >
          <RestoreIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          title="Lưu trữ"
          aria-label="Lưu trữ"
          className={iconButton}
          onClick={() => {
            if (confirm("Lưu trữ khoản đầu tư này? Bạn có thể khôi phục lại sau.")) {
              startTransition(() => archiveInvestment(investmentId));
            }
          }}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
