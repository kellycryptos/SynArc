export default function MembersLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-9 w-40 bg-surface-elevated rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-surface-elevated rounded animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse space-y-3">
            <div className="h-4 w-24 bg-surface-elevated rounded" />
            <div className="h-10 w-20 bg-surface-elevated rounded-lg" />
          </div>
        ))}
      </div>

      {/* Members table */}
      <div className="glass-card p-6 animate-pulse space-y-4">
        {/* Table header */}
        <div className="flex items-center gap-4 pb-3 border-b border-border-thin">
          {["Member", "Token Balance", "USDC Balance", "Joined"].map((_, i) => (
            <div key={i} className="h-4 flex-1 bg-surface-elevated rounded" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border-thin last:border-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-surface-elevated" />
              <div className="h-4 w-36 bg-surface-elevated rounded" />
            </div>
            <div className="h-4 w-20 bg-surface-elevated rounded flex-1" />
            <div className="h-4 w-20 bg-surface-elevated rounded flex-1" />
            <div className="h-4 w-24 bg-surface-elevated rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
