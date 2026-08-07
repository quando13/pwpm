import { AllocationCard } from "./allocation-card";
import { CashflowCard } from "./cashflow-card";
import { DashboardSidebar } from "./sidebar";
import { InvestmentsTable } from "./investments-table";
import { KpiRow } from "./kpi-row";
import { DashboardTopbar } from "./topbar";

export function Dashboard({ name }: { name: string }) {
  return (
    <div
      className="grid overflow-hidden text-foreground"
      style={{
        gridTemplateColumns: "220px 1fr",
        height: "100dvh",
        minHeight: 640,
        background: "var(--page-glow), var(--background)",
      }}
    >
      <DashboardSidebar />
      <main className="grid min-h-0 min-w-0 gap-3.5 overflow-hidden px-6 py-5" style={{ gridTemplateRows: "auto auto 1fr" }}>
        <DashboardTopbar name={name} />
        <KpiRow />
        <div className="grid min-h-0 gap-3" style={{ gridTemplateRows: "0.82fr 1.18fr" }}>
          <section className="grid min-h-0 gap-3" style={{ gridTemplateColumns: "0.86fr 1.3fr" }}>
            <AllocationCard />
            <CashflowCard />
          </section>
          <InvestmentsTable />
        </div>
      </main>
    </div>
  );
}
