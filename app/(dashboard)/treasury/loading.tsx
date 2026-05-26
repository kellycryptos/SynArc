export default function TreasuryLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-surface-elevated rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-surface-elevated rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-surface-elevated rounded-xl animate-pulse" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse space-y-3">
            <div className="h-4 w-28 bg-surface-elevated rounded" />
            <div className="h-10 w-36 bg-surface-elevated rounded-lg" />
            <div className="h-3 w-20 bg-surface-elevated rounded" />
          </div>
        ))}
      </div>

      {/* Deposit section + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 animate-pulse space-y-4">
          <div className="h-6 w-40 bg-surface-elevated rounded" />
          <div className="h-12 w-full bg-surface-elevated rounded-xl" />
          <div className="h-12 w-full bg-surface-elevated rounded-xl" />
          <div className="h-10 w-full bg-surface-elevated rounded-xl mt-2" />
        </div>
        <div className="glass-card p-6 animate-pulse space-y-4">
          <div className="h-6 w-40 bg-surface-elevated rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border-thin">
              <div className="h-4 w-32 bg-surface-elevated rounded" />
              <div className="h-4 w-24 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
