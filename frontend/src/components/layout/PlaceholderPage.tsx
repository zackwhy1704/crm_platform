import { Topbar } from "./Topbar";

export function PlaceholderPage({ title, subtitle, note }: { title: string; subtitle?: string; note?: string }) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-10 text-center">
          <div className="text-5xl mb-3">⎔</div>
          <div className="text-sm font-bold mb-1">{title}</div>
          <div className="text-xs text-ink-3 max-w-md mx-auto">
            {note ?? "This view will be wired up in M2. For now, the navigation shell and routing are in place."}
          </div>
        </div>
      </div>
    </>
  );
}
