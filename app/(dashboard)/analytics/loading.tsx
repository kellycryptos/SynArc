export default function AnalyticsLoading() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-surface-elevated rounded-xl animate-pulse" />
            <div className="h-4 w-80 bg-surface-elevated rounded animate-pulse" />
          </div>
          <div className="h-10 w-48 bg-surface-elevated rounded-2xl animate-pulse" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-surface-elevated rounded" />
                <div className="h-4 w-28 bg-surface-elevated rounded" />
              </div>
              <div className="h-10 w-20 bg-surface-elevated rounded-lg" />
              <div className="h-3 w-24 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card p-6 col-span-1 lg:col-span-2 h-[400px] animate-pulse">
            <div className="h-6 w-56 bg-surface-elevated rounded mb-6" />
            <div className="h-full bg-surface-elevated rounded-xl" />
          </div>
          <div className="glass-card p-6 h-[400px] animate-pulse">
            <div className="h-6 w-40 bg-surface-elevated rounded mb-6" />
            <div className="h-full bg-surface-elevated rounded-xl" />
          </div>
          <div className="glass-card p-6 col-span-1 lg:col-span-2 h-[380px] animate-pulse">
            <div className="h-6 w-56 bg-surface-elevated rounded mb-6" />
            <div className="h-full bg-surface-elevated rounded-xl" />
          </div>
          <div className="glass-card p-6 h-[380px] animate-pulse space-y-4">
            <div className="h-6 w-48 bg-surface-elevated rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-surface-elevated rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
