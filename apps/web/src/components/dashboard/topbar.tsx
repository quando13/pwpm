import Link from "next/link";
import { Button } from "@pwpm/ui";

import { CalendarIcon, ChevronDownIcon } from "../icons";

export function DashboardTopbar({ name, demo = false }: { name: string; demo?: boolean }) {
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[19px] font-bold tracking-tight">
          {demo ? "Xem trước PwPM" : `Chào mừng trở lại, ${name}`}
        </h1>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          {demo
            ? "Đây là dữ liệu minh họa — đăng ký để quản lý danh mục thật của bạn."
            : "Đây là toàn bộ danh mục đầu tư của bạn, cập nhật đến hôm nay."}
        </p>
      </div>
      {demo ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Tạo tài khoản</Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-input bg-surface pl-3 pr-2.5 text-[12.5px] font-semibold text-muted-foreground hover:border-gold hover:text-foreground"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            12 tháng gần nhất
            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--gold-deep)] via-gold to-gold-bright text-[12.5px] font-bold text-[var(--gold-ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]">
            {initial}
          </div>
        </div>
      )}
    </header>
  );
}
