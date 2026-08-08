import Link from "next/link";

import { signOut } from "@/lib/auth/actions";

import { BarsIcon, GearIcon, GridIcon, LayersIcon, LoginIcon, LogoMarkIcon, LogoutIcon, SwapIcon } from "./icons";

export type ActiveNav = "dashboard" | "investments" | "transactions" | "reports";

const NAV_ITEMS: { key: ActiveNav; label: string; href: string; icon: typeof GridIcon }[] = [
  { key: "dashboard", label: "Tổng quan", href: "/", icon: GridIcon },
  { key: "investments", label: "Danh mục", href: "/investments", icon: LayersIcon },
  { key: "transactions", label: "Giao dịch", href: "#", icon: SwapIcon },
  { key: "reports", label: "Báo cáo", href: "#", icon: BarsIcon },
];

export function Sidebar({ active, authenticated = true }: { active: ActiveNav; authenticated?: boolean }) {
  return (
    <aside className="flex min-h-0 flex-col gap-1 border-r border-input px-3.5 py-5">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-0.5">
        <div className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-gradient-to-br from-[var(--gold-deep)] via-gold to-gold-bright shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
          <LogoMarkIcon className="h-[17px] w-[17px] text-[var(--gold-ink)]" />
        </div>
        <div>
          <div className="font-[var(--font-serif)] text-[17px] font-bold leading-none">PwPM</div>
          <div className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-gold-bright">
            Wealth &amp; Portfolio
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
        Điều hướng
      </div>
      {NAV_ITEMS.map(({ key, label, href, icon: ItemIcon }) => (
        <Link
          key={key}
          href={href}
          className={
            key === active
              ? "flex w-full items-center gap-2.5 rounded-[9px] bg-gold-soft px-2.5 py-2 text-[13.5px] font-semibold text-gold-bright shadow-[inset_2px_0_0_var(--gold)]"
              : "flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          }
        >
          <ItemIcon className="h-[17px] w-[17px] flex-none" />
          {label}
        </Link>
      ))}

      <div className="flex-1" />

      <div className="flex flex-col gap-0.5 border-t border-input pt-2.5">
        <a className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground">
          <GearIcon className="h-[17px] w-[17px] flex-none" />
          Cài đặt
        </a>
        {authenticated ? (
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              <LogoutIcon className="h-[17px] w-[17px] flex-none" />
              Đăng xuất
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <LoginIcon className="h-[17px] w-[17px] flex-none" />
            Đăng nhập
          </Link>
        )}
      </div>
    </aside>
  );
}
