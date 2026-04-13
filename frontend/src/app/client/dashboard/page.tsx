import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";

const clientMetrics = [
  { label: "Leads This Month", value: "18", delta: "+5 vs last month", deltaDirection: "up" as const, color: "blue" as const },
  { label: "In Progress", value: "7", color: "amber" as const },
  { label: "Won", value: "4", delta: "$68k", color: "green" as const },
  { label: "Close Rate", value: "57%", delta: "+12pts", deltaDirection: "up" as const, color: "purple" as const },
];

export default function ClientDashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" subtitle="Demo Reno Co · April 2026" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {clientMetrics.map((m) => (
            <MetricCard key={m.label} data={m} />
          ))}
        </div>
        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6 text-center text-xs text-ink-3">
          More client-side analytics coming in M3
        </div>
      </div>
    </>
  );
}
