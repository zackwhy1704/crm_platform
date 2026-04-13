/**
 * Shared layout for all auth pages (login, signup, forgot password, etc.)
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-accent text-white font-bold rounded-lg flex items-center justify-center">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">
              CRM<span className="text-accent">Platform</span>
            </span>
          </div>
          {children}
        </div>
      </div>
      {/* Right: branding panel */}
      <div className="hidden lg:flex w-[420px] bg-accent items-center justify-center p-10">
        <div className="text-white max-w-xs">
          <div className="text-2xl font-bold mb-3 leading-tight">
            AI-powered lead management for growing businesses
          </div>
          <div className="text-sm opacity-80 leading-relaxed">
            Capture leads from any channel. Qualify them instantly with AI.
            Deliver qualified prospects to your team.
          </div>
          <div className="mt-8 space-y-3">
            {[
              "Multi-channel lead capture",
              "AI qualification via WhatsApp",
              "Real-time analytics dashboard",
              "Configurable scoring rules",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm opacity-90">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  ✓
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
