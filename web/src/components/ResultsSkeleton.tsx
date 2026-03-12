export function ResultsSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-80 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-16 animate-pulse rounded-lg bg-white/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

