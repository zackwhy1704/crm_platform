import { Topbar } from "@/components/layout/Topbar";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { mockPipelineColumns } from "@/lib/mock-data";

const cards = [
  { stage: "new", name: "Kitchen Reno", subtitle: "Tan Residence · Tampines", value: "$4,800", initials: "TT", age: "2d" },
  { stage: "new", name: "Bathroom Tiles", subtitle: "Lim · Jurong", value: "$2,200", initials: "LH", age: "1d" },
  { stage: "new", name: "Flooring Pkg", subtitle: "Yeo · AMK", value: "$3,100", initials: "YR", age: "4d" },
  { stage: "qualified", name: "Full Reno 4-rm", subtitle: "Chen · Bishan", value: "$28,000", initials: "CF", age: "4h" },
  { stage: "qualified", name: "EC Renovation", subtitle: "Lim · Sengkang", value: "$34,500", initials: "LS", age: "1d" },
  { stage: "proposal", name: "Office Fit-out", subtitle: "StartupBridge", value: "$62,000", initials: "SB", age: "1d" },
  { stage: "negotiation", name: "Condo Reno Pkg", subtitle: "Marina Bay", value: "$45,500", initials: "MB", age: "2d" },
  { stage: "won", name: "HDB 5-room Reno", subtitle: "Wong · Punggol", value: "$19,800", initials: "WR", age: "Today", won: true },
  { stage: "won", name: "Bathroom Suite", subtitle: "Park Residences", value: "$9,400", initials: "PR", age: "Yesterday", won: true },
];

export default function PipelinePage() {
  return (
    <>
      <Topbar title="Deal Pipeline" subtitle="$186k total · 22 open deals" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1">
            <div className="text-[13px] font-bold">All Deals — Kanban</div>
          </div>
          <KanbanBoard columns={mockPipelineColumns} cards={cards} />
        </div>
      </div>
    </>
  );
}
