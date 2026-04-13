import { cn } from "@/lib/utils";
import type { MetricCardData } from "@/lib/types";

const colorClass = {
  blue: "before:bg-accent",
  green: "before:bg-green",
  amber: "before:bg-amber",
  purple: "before:bg-purple",
};

export function MetricCard({ data }: { data: MetricCardData }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface border border-border1 rounded-lg px-4 py-4 shadow-sm",
        "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px]",
        colorClass[data.color]
      )}
    >
      <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-1.5">
        {data.label}
      </div>
      <div className="text-2xl font-bold tracking-tight leading-none mb-1.5">{data.value}</div>
      {data.delta && (
        <div className="text-[11px] text-ink-2 flex items-center gap-1">
          {data.deltaDirection === "up" && <span className="text-green font-semibold">▲ {data.delta}</span>}
          {data.deltaDirection === "down" && <span className="text-red font-semibold">▼ {data.delta}</span>}
          {!data.deltaDirection && <span>{data.delta}</span>}
        </div>
      )}
    </div>
  );
}
