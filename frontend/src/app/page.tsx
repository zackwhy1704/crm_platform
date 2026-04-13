import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full space-y-6 text-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-accent text-white font-bold rounded-lg flex items-center justify-center">
              C
            </div>
            <span className="text-xl font-bold">
              CRM<span className="text-accent">Platform</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Lead Management for SMEs</h1>
          <p className="text-ink-2 mt-2 text-sm">
            Capture leads from any channel, qualify them instantly with AI,
            and deliver qualified prospects to your clients.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/signup"
            className="block p-5 rounded-lg border border-accent bg-accent-light hover:bg-accent hover:text-white transition-colors"
          >
            <div className="font-bold">Get Started</div>
            <div className="text-xs mt-1 opacity-75">Create your free account</div>
          </Link>
          <Link
            href="/login"
            className="block p-5 rounded-lg border border-border1 bg-surface hover:border-accent transition-colors"
          >
            <div className="font-bold">Sign In</div>
            <div className="text-xs text-ink-3 mt-1">Already have an account</div>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/agency/dashboard"
            className="block p-3 rounded-lg border border-border1 bg-surface hover:border-accent transition-colors text-center"
          >
            <div className="text-sm font-semibold">Dashboard</div>
            <div className="text-[10px] text-ink-3">Metrics + Pipeline</div>
          </Link>
          <Link
            href="/agency/analytics"
            className="block p-3 rounded-lg border border-border1 bg-surface hover:border-accent transition-colors text-center"
          >
            <div className="text-sm font-semibold">Analytics</div>
            <div className="text-[10px] text-ink-3">Funnel + Sources</div>
          </Link>
          <Link
            href="/client/leads"
            className="block p-3 rounded-lg border border-border1 bg-surface hover:border-accent transition-colors text-center"
          >
            <div className="text-sm font-semibold">Client Portal</div>
            <div className="text-[10px] text-ink-3">Lead cards + Chat</div>
          </Link>
        </div>

        <div className="text-[10px] text-ink-3">
          Generic lead management · No niche restrictions · AI-powered qualification
        </div>
      </div>
    </div>
  );
}
