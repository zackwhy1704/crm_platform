import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAnalytics } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const sourceLabels: Record<string, string> = {
  meta_facebook: "Facebook", meta_instagram: "Instagram",
  google: "Google", tiktok: "TikTok", landing_page: "Landing Page", manual: "Manual",
};
const sourceColors: Record<string, string> = {
  meta_facebook: "bg-accent", meta_instagram: "bg-purple",
  google: "bg-amber", tiktok: "bg-teal", landing_page: "bg-green", manual: "bg-ink-3",
};

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  const maxSourceCount = Math.max(...Object.values(a.leadsBySource), 1);

  return (
    <>
      <Topbar title="Analytics & Reports" subtitle={`${a.totalLeads} leads · All sources`} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard data={{ label: "Total Leads", value: a.totalLeads.toString(), color: "blue" }} />
          <MetricCard data={{ label: "Qualified", value: a.qualifiedLeads.toString(), delta: `${a.qualificationRate}% rate`, color: "green" }} />
          <MetricCard data={{ label: "Avg AI Score", value: a.avgScore.toString(), color: "amber" }} />
          <MetricCard data={{ label: "Won Deals", value: (a.leadsByStatus.won ?? 0).toString(), color: "purple" }} />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Funnel */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">Conversion Funnel</div>
            </div>
            <div className="p-4 space-y-3">
              {a.conversionFunnel.map((step, i) => {
                const maxCount = a.conversionFunnel[0].count || 1;
                const pct = (step.count / maxCount) * 100;
                const dropoff = i > 0 && a.conversionFunnel[i - 1].count > 0
                  ? Math.round(((a.conversionFunnel[i - 1].count - step.count) / a.conversionFunnel[i - 1].count) * 100)
                  : 0;
                return (
                  <div key={step.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{step.stage}</span>
                      <div className="flex items-center gap-2">
                        {i > 0 && dropoff > 0 && <span className="text-[10px] text-red font-mono">-{dropoff}%</span>}
                        <span className="text-xs font-mono font-semibold text-accent">{step.count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By source */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">Leads by Source</div>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(a.leadsBySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{sourceLabels[source] ?? source}</span>
                      <span className="text-xs font-mono">{count} <span className="text-ink-3">({a.totalLeads > 0 ? Math.round((count / a.totalLeads) * 100) : 0}%)</span></span>
                    </div>
                    <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", sourceColors[source] ?? "bg-ink-3")} style={{ width: `${(count / maxSourceCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1">
            <div className="text-[13px] font-bold">Lead Status Breakdown</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(a.leadsByStatus)
                .filter(([, c]) => c > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="bg-surface2 rounded px-3 py-2 text-center">
                    <div className="text-lg font-bold tracking-tight">{count}</div>
                    <div className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">{status.replace(/_/g, " ")}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
