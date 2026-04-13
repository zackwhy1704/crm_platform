import { cn } from "@/lib/utils";

type Column = { stage: string; label: string; count: number; value: number };
type Card = { stage: string; name: string; subtitle: string; value: string; initials: string; age: string; won?: boolean };

const stageClass: Record<string, { label: string; bar: string }> = {
  new: { label: "text-slate-500", bar: "bg-slate-300" },
  qualified: { label: "text-accent", bar: "bg-accent" },
  proposal: { label: "text-amber", bar: "bg-amber" },
  negotiation: { label: "text-purple", bar: "bg-purple" },
  won: { label: "text-green", bar: "bg-green" },
};

export function KanbanBoard({ columns, cards }: { columns: Column[]; cards: Card[] }) {
  return (
    <div className="flex gap-2.5 p-3.5 overflow-x-auto">
      {columns.map((col) => {
        const cls = stageClass[col.stage] ?? stageClass.new;
        const colCards = cards.filter((c) => c.stage === col.stage);
        return (
          <div key={col.stage} className="flex-shrink-0 w-44 flex flex-col gap-1.5">
            <div className="pb-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[10.5px] font-bold uppercase tracking-wider", cls.label)}>
                  {col.label}
                </span>
                <span className="text-[10px] font-mono bg-surface2 text-ink-3 px-1.5 py-px rounded-full">
                  {col.count}
                </span>
              </div>
              <div className={cn("h-[3px] rounded w-full", cls.bar)} />
            </div>
            {colCards.map((card, i) => (
              <div
                key={i}
                className={cn(
                  "bg-surface border border-border1 rounded px-2.5 py-2.5 cursor-pointer shadow-sm transition-all hover:border-accent hover:-translate-y-px",
                  card.won && "border-green/30 bg-green-light/40"
                )}
              >
                <div className="text-xs font-semibold mb-0.5">{card.name}</div>
                <div className="text-[10.5px] text-ink-3 mb-2">{card.subtitle}</div>
                <div className={cn("font-mono text-[11px] font-medium", card.won ? "text-green" : "text-accent")}>
                  {card.value}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8.5px] font-bold bg-accent-light text-accent">
                    {card.initials}
                  </div>
                  <span className="text-[10px] text-ink-3 font-mono">{card.age}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
