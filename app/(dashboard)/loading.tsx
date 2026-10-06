export default function DefaultDashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header skeleton */}
      <div className="space-y-2 pb-2">
        <div className="h-7 w-48 bg-[#0B111C] border border-[#1B2536] rounded-xl animate-pulse" />
        <div className="h-4 w-72 bg-[#0B111C]/60 border border-[#1B2536]/40 rounded-lg animate-pulse" />
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#0B111C] border border-[#1B2536] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-[#151C29] rounded animate-pulse" />
              <div className="w-5 h-5 bg-[#151C29] rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-32 bg-[#151C29] rounded-lg animate-pulse" />
            <div className="h-3 w-40 bg-[#151C29] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="p-6 rounded-2xl bg-[#0B111C] border border-[#1B2536] space-y-4">
        <div className="h-5 w-40 bg-[#151C29] rounded animate-pulse" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-full bg-[#05080F] border border-[#151C29] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
