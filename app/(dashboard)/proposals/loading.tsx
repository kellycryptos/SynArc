export default function ProposalsLoading() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-9 w-64 bg-surface-elevated rounded-xl animate-pulse" />
            <div className="h-4 w-80 bg-surface-elevated rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-surface-elevated rounded-xl animate-pulse" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex gap-3 p-4 bg-surface-elevated/50 rounded-2xl border border-border-thin">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-surface-elevated rounded-full animate-pulse" />
          ))}
          <div className="ml-auto h-9 w-56 bg-surface-elevated rounded-xl animate-pulse" />
        </div>

        {/* Proposal cards skeleton */}
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 bg-surface-elevated rounded-full" />
                <div className="h-6 w-24 bg-surface-elevated rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-surface-elevated rounded-lg" />
              <div className="h-4 w-full bg-surface-elevated rounded" />
              <div className="h-4 w-5/6 bg-surface-elevated rounded" />
              <div className="h-2 w-full bg-surface-elevated rounded-full mt-4" />
              <div className="h-2 w-full bg-surface-elevated rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
