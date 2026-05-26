export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-surface-elevated rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-surface-elevated rounded animate-pulse" />
      </div>

      {/* Stats overview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-surface-elevated rounded" />
              <div className="h-4 w-24 bg-surface-elevated rounded" />
            </div>
            <div className="h-10 w-20 bg-surface-elevated rounded-lg" />
            <div className="h-3 w-28 bg-surface-elevated rounded" />
          </div>
        ))}
      </div>

      {/* Recent proposals + treasury summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 animate-pulse space-y-4">
          <div className="h-6 w-40 bg-surface-elevated rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-elevated rounded-xl" />
          ))}
        </div>
        <div className="glass-card p-6 animate-pulse space-y-4">
          <div className="h-6 w-36 bg-surface-elevated rounded" />
          <div className="h-24 bg-surface-elevated rounded-xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-elevated rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
