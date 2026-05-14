"use client";

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
        <div className="w-16 h-6 rounded-full bg-white/[0.04]" />
      </div>
      <div className="space-y-2">
        <div className="w-24 h-4 rounded bg-white/[0.04]" />
        <div className="w-32 h-8 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 h-12 rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-white/[0.04]"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
