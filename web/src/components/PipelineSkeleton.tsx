export function PipelineSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/10" />
      <div className="mt-6 grid gap-3">
        <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-black/20" />
        <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-black/20" />
      </div>
    </div>
  );
}

