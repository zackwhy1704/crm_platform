import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { mockAnalytics } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const sourceLabels: Record<string, string> = {
  meta_facebook: "Facebook",
  meta_instagram: "Instagram",
  google: "Google",
  tiktok: "TikTok",
  landing_page: "Landing Page",
  manual: "Manual",
};

const sourceColors: Record<string, string> = {
  meta_facebook: "bg-accent",
  meta_instagram: "bg-purple",
  google: "bg-amber",
  tiktok: "bg-teal",
  landing_page: "bg-green",
  manual: "bg-ink-3",
};

export default function AnalyticsPage() {
  const a = mockAnalytics;
  const maxSourceCount = Math.max(...Object.values(a.leadsBySource));

  return (
    <>
      <Topbar title="Analytics & Reports" subtitle="April 2026 · All sources" />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {/* Top metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            data={{ label: "Total Leads", value: a.totalLeads.toString(), delta: "All time", color: "blue" }}
          />
          <MetricCard
            data={{
              label: "Qualified",
              value: a.qualifiedLeads.toString(),
              delta: `${a.qualificationRate}% rate`,
              color: "green",
            }}
          />
          <MetricCard
            data={{
              label: "Avg AI Score",
              value: a.avgScore.toString(),
              delta: "Across all leads",
              color: "amber",
            }}
          />
          <MetricCard
            data={{
              label: "Won Deals",
              value: (a.leadsByStatus.won ?? 0).toString(),
              delta: `${((a.leadsByStatus.won ?? 0) / a.totalLeads * 100).toFixed(1)}% close rate`,
              deltaDirection: "up",
              color: "purple",
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Conversion funnel */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">Conversion Funnel</div>
              <div className="text-[11px] text-ink-3 mt-px">Lead → Qualified → Assigned → Contacted → Won</div>
            </div>
            <div className="p-4 space-y-3">
              {a.conversionFunnel.map((step, i) => {
                const maxCount = a.conversionFunnel[0].count;
                const pct = (step.count / maxCount) * 100;
                const dropoff =
                  i > 0
                    ? Math.round(
                        ((a.conversionFunnel[i - 1].count - step.count) / a.conversionFunnel[i - 1].count) * 100,
                      )
                    : 0;
                return (
                  <div key={step.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{step.stage}</span>
                      <div className="flex items-center gap-2">
                        {i > 0 && dropoff > 0 && (
                          <span className="text-[10px] text-red font-mono">-{dropoff}%</span>
                        )}
                        <span className="text-xs font-mono font-semibold text-accent">
                          {step.count}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leads by source */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">Leads by Source</div>
              <div className="text-[11px] text-ink-3 mt-px">All platforms breakdown</div>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(a.leadsBySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => {
                  const pct = (count / maxSourceCount) * 100;
                  const totalPct = ((count / a.totalLeads) * 100).toFixed(0);
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">
                          {sourceLabels[source] ?? source}
                        </span>
                        <span className="text-xs font-mono">
                          {count}{" "}
                          <span className="text-ink-3">({totalPct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            sourceColors[source] ?? "bg-ink-3",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Lead status breakdown */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">Lead Status Breakdown</div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(a.leadsByStatus)
                  .filter(([, c]) => c > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div
                      key={status}
                      className="bg-surface2 rounded px-3 py-2 text-center"
                    >
                      <div className="text-lg font-bold tracking-tight">{count}</div>
                      <div className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">
                        {status.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 7-day trend */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">7-Day Trend</div>
              <div className="text-[11px] text-ink-3 mt-px">Leads in vs qualified</div>
            </div>
            <div className="p-4">
              <div className="flex items-end gap-1.5 h-28">
                {a.recentTrend.map((day) => {
                  const maxLeads = Math.max(...a.recentTrend.map((d) => d.leads));
                  const totalH = (day.leads / maxLeads) * 100;
                  const qualH = (day.qualified / maxLeads) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex flex-col items-center relative" style={{ height: "100px" }}>
                        <div
                          className="w-full bg-surface2 rounded-t absolute bottom-0"
                          style={{ height: `${totalH}%` }}
                        />
                        <div
                          className="w-full bg-accent rounded-t absolute bottom-0"
                          style={{ height: `${qualH}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {a.recentTrend.map((day) => (
                  <div key={day.date} className="flex-1 text-center text-[9px] font-mono text-ink-3">
                    {day.date.split(" ")[1]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1.5 text-[10px] text-ink-3">
                  <div className="w-2.5 h-2.5 rounded bg-surface2" /> Total
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-ink-3">
                  <div className="w-2.5 h-2.5 rounded bg-accent" /> Qualified
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline velocity */}
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1">
            <div className="text-[13px] font-bold">Pipeline Velocity</div>
          </div>
          <div className="grid grid-cols-4">
            {[
              { label: "Avg days to qualify", value: "0.8 days", color: "text-accent" },
              { label: "Avg days to assign", value: "1.2 days", color: "text-accent" },
              { label: "Avg days to contact", value: "2.4 days", color: "text-amber" },
              { label: "Avg days to close", value: "12.4 days", color: "text-green" },
            ].map((m) => (
              <div
                key={m.label}
                className="p-4 border-r border-border1 last:border-0 text-center"
              >
                <div className={cn("text-xl font-bold tracking-tight", m.color)}>{m.value}</div>
                <div className="text-[10.5px] text-ink-3 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
