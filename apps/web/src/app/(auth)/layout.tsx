export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-1.5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--gold-deep)] via-[var(--gold)] to-[var(--gold-bright)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold-ink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </svg>
        </div>
        <div className="mt-1 font-[var(--font-serif)] text-xl font-semibold tracking-tight">PwPM</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--gold-bright)]">
          Wealth &amp; Portfolio
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-input bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
        {children}
      </div>
    </div>
  );
}
