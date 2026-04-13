/**
 * Live WhatsApp qualification widget.
 * Shows the currently active AI conversation with a lead.
 */
export function LiveQualificationWidget() {
  return (
    <div className="rounded-lg p-3.5 flex flex-col gap-2.5 border border-accent/20 bg-gradient-to-br from-accent-light to-green-light">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red uppercase tracking-wider">
          <div className="w-[7px] h-[7px] rounded-full bg-red animate-pulse" />
          AI Live · WhatsApp
        </div>
        <div className="font-mono text-xs text-ink-2 font-medium">Turn 2 of 3</div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-sm font-bold text-white">
          ST
        </div>
        <div>
          <div className="text-sm font-bold">Sarah Tan</div>
          <div className="text-[11px] text-ink-3 font-mono">+65 9123 4567 · Facebook Ad</div>
        </div>
      </div>

      <div className="bg-white/70 border border-border1 rounded px-2.5 py-2 text-[11px] leading-relaxed max-h-20 overflow-hidden relative">
        <span className="text-accent font-semibold">Ava:</span> Hi Sarah! What are you looking for?
        <br />
        <span className="text-ink">Sarah:</span> I need help with a full service package
        <br />
        <span className="text-accent font-semibold">Ava:</span> Got it! What&apos;s your rough budget?
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white/70" />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-light text-green border border-green/20">
          Interest ✓
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-light text-accent border border-accent/20">
          Budget ⋯
        </span>
        <span className="text-[10px] text-ink-3 ml-auto">
          Score: <strong className="text-ink-2">Pending</strong>
        </span>
      </div>

      <div className="flex gap-1.5">
        <button className="flex-1 py-1.5 rounded-md text-[11px] font-bold bg-purple text-white hover:bg-purple/90 transition-colors">
          ⇆ Handoff
        </button>
        <button className="flex-1 py-1.5 rounded-md text-[11px] font-bold bg-red text-white hover:bg-red/90 transition-colors">
          ✕ End
        </button>
      </div>
    </div>
  );
}
