import { AppShell } from "../app-shell";
import { AllocationCard } from "./allocation-card";
import { CashflowCard } from "./cashflow-card";
import { InvestmentsTable } from "./investments-table";
import { KpiRow } from "./kpi-row";
import { DashboardTopbar } from "./topbar";

export function Dashboard({ name }: { name: string }) {
  return (
    <AppShell active="dashboard">
      <div
        className="grid h-full min-h-0 gap-3.5 overflow-hidden px-6 py-5"
        style={{ gridTemplateRows: "auto auto 1fr" }}
      >
        <DashboardTopbar name={name} />
        <KpiRow />
        <div className="grid min-h-0 gap-3" style={{ gridTemplateRows: "0.82fr 1.18fr" }}>
          <section className="grid min-h-0 gap-3" style={{ gridTemplateColumns: "0.86fr 1.3fr" }}>
            <AllocationCard />
            <CashflowCard />
          </section>
          <InvestmentsTable />
        </div>
      </div>
    </AppShell>
  );
}
