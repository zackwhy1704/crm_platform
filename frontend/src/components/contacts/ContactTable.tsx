import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

const pillClass: Record<string, string> = {
  qualified_hot: "bg-red-light text-red",
  qualified_warm: "bg-amber-light text-amber",
  nurture: "bg-surface2 text-ink-3",
  disqualified: "bg-surface3 text-ink-3",
  contacted: "bg-accent-light text-accent",
  assigned: "bg-green-light text-green",
  new: "bg-accent-light text-accent",
  qualifying: "bg-purple-light text-purple",
  in_progress: "bg-amber-light text-amber",
  won: "bg-green-light text-green",
  lost: "bg-red-light text-red",
};

const pillLabel: Record<string, string> = {
  qualified_hot: "Hot",
  qualified_warm: "Warm",
  nurture: "Nurture",
  disqualified: "Disqualified",
  contacted: "Contacted",
  assigned: "Assigned",
  new: "New",
  qualifying: "Qualifying",
  in_progress: "In Progress",
  won: "Won",
  lost: "Lost",
};

function scoreColor(score: number) {
  if (score >= 75) return "bg-green";
  if (score >= 55) return "bg-amber";
  return "bg-red";
}

const sourceIcon: Record<string, string> = {
  meta_facebook: "FB",
  meta_instagram: "IG",
  google: "G",
  tiktok: "TT",
  landing_page: "LP",
  manual: "M",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ContactTable({ leads }: { leads: Lead[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["", "Contact", "Source", "Score", "Status", "Value", "Created", ""].map((h, i) => (
            <th
              key={i}
              className="text-[10.5px] font-bold text-ink-3 uppercase tracking-wider px-3.5 py-2 text-left border-b border-border1 whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.id} className="hover:bg-surface2 transition-colors">
            <td className="px-3.5 py-2.5 border-b border-border1">
              <input type="checkbox" className="accent-accent" />
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1">
              <div className="font-semibold text-[12.5px]">{lead.name}</div>
              <div className="text-[11px] text-ink-3 mt-px">
                {lead.company ?? lead.email ?? lead.phone ?? "—"}
              </div>
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1">
              <span className="text-[10px] font-mono bg-surface2 text-ink-2 px-1.5 py-0.5 rounded">
                {sourceIcon[lead.source] ?? lead.source}
              </span>
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 max-w-16 h-1 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", scoreColor(lead.score))}
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-ink-2">{lead.score}</span>
              </div>
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  pillClass[lead.status] ?? "bg-surface2 text-ink-3"
                )}
              >
                {pillLabel[lead.status] ?? lead.status}
              </span>
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1 font-mono text-[11px]">
              {lead.dealValue ? `$${lead.dealValue.toLocaleString()}` : "—"}
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1 text-[11px] text-ink-3">
              {timeAgo(lead.createdAt)}
            </td>
            <td className="px-3.5 py-2.5 border-b border-border1">
              <button className="text-[10px] font-semibold text-accent hover:underline">View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
