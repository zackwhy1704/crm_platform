import { cn } from "@/lib/utils";

type Action = {
  title: string;
  reason: string;
  chip: string;
  priority: "hi" | "med" | "lo";
  cta: string;
};

const prioClass = { hi: "bg-red", med: "bg-amber", lo: "bg-green" };

const mockActions: Action[] = [
  {
    title: "Assign Rachel Ng to agent",
    reason: "Score 88, pre-approved buyer, wants to move in 3 months",
    chip: "$1.5M deal · hot lead",
    priority: "hi",
    cta: "Assign",
  },
  {
    title: "Follow up Kevin Tay",
    reason: "Qualified 2h ago, no agent contact yet",
    chip: "EC Tengah · $900k",
    priority: "med",
    cta: "Nudge",
  },
  {
    title: "Book viewing · Priya Nair",
    reason: "Interested in 3 units near Novena MRT",
    chip: "Investor · $1.35M budget",
    priority: "lo",
    cta: "Schedule",
  },
  {
    title: "Re-engage Diana Ong",
    reason: "Renter lead, nurture for 30 days then re-qualify",
    chip: "Auto-sequence available",
    priority: "lo",
    cta: "Start",
  },
];

export function AIActionList() {
  return (
    <div className="bg-surface border border-border1 rounded-lg shadow-sm">
      <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
        <div className="text-[13px] font-bold">AI Next Actions</div>
        <span className="text-[11px] font-semibold text-accent cursor-pointer hover:underline">View all</span>
      </div>
      {mockActions.map((action, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 px-3.5 py-2.5 border-b border-border1 last:border-0 cursor-pointer hover:bg-surface2 transition-colors"
        >
          <div className={cn("w-[3px] rounded self-stretch min-h-9", prioClass[action.priority])} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold">{action.title}</div>
            <div className="text-[10.5px] text-ink-3 leading-snug mt-0.5">{action.reason}</div>
            <span className="text-[10px] bg-surface2 text-ink-2 px-1.5 py-0.5 rounded inline-block mt-1">
              {action.chip}
            </span>
          </div>
          <button className="text-[10px] font-bold bg-accent-light text-accent border-0 rounded-md px-2.5 py-1 cursor-pointer whitespace-nowrap mt-0.5 hover:bg-accent hover:text-white transition-colors">
            {action.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
