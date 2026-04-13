import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getMetrics } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const m = await getMetrics();

  return (
    <>
      <Topbar title="Dashboard" subtitle="Client overview" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard data={{ label: "Total Leads", value: m.totalLeads.toString(), color: "blue" }} />
          <MetricCard data={{ label: "Qualified", value: m.qualifiedLeads.toString(), color: "green" }} />
          <MetricCard data={{ label: "Won Deals", value: m.wonDeals.toString(), color: "purple" }} />
          <MetricCard data={{ label: "New This Week", value: m.newThisWeek.toString(), color: "amber" }} />
        </div>
      </div>
    </>
  );
}
