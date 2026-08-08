import type { ReactNode } from "react";

import { Sidebar, type ActiveNav } from "./sidebar";

export function AppShell({
  active,
  authenticated,
  children,
}: {
  active: ActiveNav;
  authenticated?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="grid text-foreground"
      style={{
        gridTemplateColumns: "220px 1fr",
        height: "100dvh",
        minHeight: 640,
        background: "var(--page-glow), var(--background)",
      }}
    >
      <Sidebar active={active} authenticated={authenticated} />
      <main className="min-h-0 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
