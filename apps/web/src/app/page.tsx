import { computePortfolioSummary } from "@pwpm/domain";

import { Dashboard } from "@/components/dashboard/dashboard";
import { RealDashboard } from "@/components/dashboard/real-dashboard";
import { getPortfolioData } from "@/lib/portfolio/get-portfolio-summary";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous visitors preview the product on illustrative mock data — there's no
  // portfolio to show them yet. Signed-in customers see their own real default
  // portfolio (auto-created by the handle_new_user trigger on signup).
  if (!user) {
    return <Dashboard name="Khách" demo />;
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "bạn";

  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("customer_id", user.id)
    .eq("is_default", true)
    .single();

  const { summary, investments } = portfolio
    ? await getPortfolioData(supabase, portfolio.id)
    : { summary: computePortfolioSummary([]), investments: [] };

  return <RealDashboard name={name} summary={summary} investments={investments} />;
}
