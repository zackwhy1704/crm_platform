import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { LiveQualificationWidget } from "@/components/dashboard/LiveQualificationWidget";
import { AIActionList } from "@/components/dashboard/AIActionList";
import { ContactTable } from "@/components/contacts/ContactTable";
import { mockMetrics, mockLeads, mockPipelineColumns } from "@/lib/mock-data";

const mockKanbanCards = [
  { stage: "new", name: "Rachel Ng", subtitle: "Buyer · East Coast", value: "~$1.5M", initials: "RN", age: "2m ago" },
  { stage: "new", name: "Vincent Goh", subtitle: "IG lead · New", value: "Pending", initials: "VG", age: "5m ago" },
  { stage: "qualified", name: "Kevin Tay", subtitle: "Buyer · EC Tengah", value: "$900k", initials: "KT", age: "2h ago" },
  { stage: "qualified", name: "Amanda Chew", subtitle: "Investor · Condo", value: "$1.2M", initials: "AC", age: "4h ago" },
  { stage: "proposal", name: "Priya Nair", subtitle: "Investor · Novena", value: "$1.35M", initials: "PN", age: "1d ago" },
  { stage: "negotiation", name: "Jason Lim", subtitle: "Seller · HDB Bishan", value: "$580k", initials: "JL", age: "2d ago" },
  { stage: "won", name: "Sarah Lee", subtitle: "Buyer · Landed D10", value: "$4.8M", initials: "SL", age: "6d ago", won: true },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" subtitle="Sat, 11 Apr 2026 · Good morning" />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {mockMetrics.map((m) => (
            <MetricCard key={m.label} data={m} />
          ))}
        </div>

        {/* Pipeline + Live + AI Actions */}
        <div className="grid grid-cols-[2fr_1fr] gap-3.5">
          <div className="bg-surface border border-border1 rounded-lg shadow-sm">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold">Deal Pipeline</div>
                <div className="text-[11px] text-ink-3 mt-px">22 open deals · $264k total</div>
              </div>
              <span className="text-[11px] font-semibold text-accent cursor-pointer hover:underline">
                Full view →
              </span>
            </div>
            <KanbanBoard columns={mockPipelineColumns} cards={mockKanbanCards} />
          </div>

          <div className="flex flex-col gap-3">
            <LiveQualificationWidget />
            <AIActionList />
          </div>
        </div>

        {/* Recent contacts */}
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
            <div className="text-[13px] font-bold">Recent Leads</div>
            <span className="text-[11px] font-semibold text-accent cursor-pointer hover:underline">
              All contacts →
            </span>
          </div>
          <ContactTable leads={mockLeads} />
        </div>
      </div>
    </>
  );
}
