import type { PortfolioSummary } from "@pwpm/domain";

import { AppShell } from "../app-shell";
import type { InvestmentPerformance } from "@/lib/portfolio/get-portfolio-summary";
import { RealAllocationCard } from "./real-allocation-card";
import { RealKpiRow } from "./real-kpi-row";
import { RealPerformersCard } from "./real-performers-card";
import { DashboardTopbar } from "./topbar";

export function RealDashboard({
  name,
  summary,
  investments,
}: {
  name: string;
  summary: PortfolioSummary;
  investments: InvestmentPerformance[];
}) {
  return (
    <AppShell active="dashboard">
      <div
        className="grid h-full min-h-0 gap-3.5 overflow-hidden px-6 py-5"
        style={{ gridTemplateRows: "auto auto 1fr" }}
      >
        <DashboardTopbar name={name} />
        <RealKpiRow summary={summary} investmentCount={investments.length} />
        <section className="grid min-h-0 gap-3" style={{ gridTemplateColumns: "0.86fr 1.3fr" }}>
          <RealAllocationCard summary={summary} />
          <RealPerformersCard investments={investments} />
        </section>
      </div>
    </AppShell>
  );
}
