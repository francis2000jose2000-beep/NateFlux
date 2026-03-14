import type { ScanApiResponse } from "@/shared/scanTypes";
import { ReportCard } from "@/components/ReportCard";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";

type Props = {
  response: ScanApiResponse | null;
  isLoading: boolean;
};

export function ResultsDashboard({ response, isLoading }: Props) {
  if (isLoading) return <ResultsSkeleton />;

  if (!response) {
    return (
      <div className="glass-card rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-6 text-sm text-zinc-300">
        <div className="text-base font-semibold text-zinc-100">Results</div>
        <div className="mt-2 text-zinc-400">
          Paste a public GitHub repository URL and run a scan to see a compliance report.
        </div>
      </div>
    );
  }

  if (!response.ok) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        <div className="text-base font-semibold">Scan failed</div>
        <div className="mt-2 text-rose-100/90">{String(response.error?.message || "Unknown error")}</div>
        <div className="mt-2 text-xs text-rose-100/70">Error code: {String(response.error?.code || "UNKNOWN")}</div>
      </div>
    );
  }

  const { report } = response;

  const passed = report.findings.filter((f) => f.status === "PASSED");
  const failed = report.findings.filter((f) => f.status === "FAILED");
  const skipped = report.findings.filter((f) => f.status === "SKIPPED");

  const overall = report.summary.failed > 0 ? "FAIL" : "PASS";

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-base font-semibold text-zinc-100">Compliance Report</div>
          <div className="mt-1 text-xs text-zinc-400">
            {String(report.repoUrl)}
            {report.ref ? ` @ ${String(report.ref)}` : ""}
            {report.subpath ? ` • ${String(report.subpath)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              overall === "PASS"
                ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/30"
                : "rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-200 ring-1 ring-rose-500/30"
            }
          >
            {overall}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300 ring-1 ring-white/10">
            {String(report.scanner)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="glass-card rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-4">
          <div className="text-xs text-zinc-400">Files scanned</div>
          <div className="mt-1 text-xl font-semibold text-zinc-100">
            {String(report.summary.filesScanned)}
          </div>
        </div>
        <div className="glass-card rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-4">
          <div className="text-xs text-zinc-400">Passed</div>
          <div className="mt-1 text-xl font-semibold text-emerald-200">
            {String(report.summary.passed)}
          </div>
        </div>
        <div className="glass-card rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-4">
          <div className="text-xs text-zinc-400">Failed</div>
          <div className="mt-1 text-xl font-semibold text-rose-200">{String(report.summary.failed)}</div>
        </div>
        <div className="glass-card rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-4">
          <div className="text-xs text-zinc-400">Duration</div>
          <div className="mt-1 text-xl font-semibold text-zinc-100">
            {(report.durationMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="text-sm font-semibold text-rose-100">Failing checks</div>
          <div className="mt-3 space-y-3">
            {failed.length === 0 ? (
              <div className="text-sm text-rose-100/70">No failing checks.</div>
            ) : (
              failed.map((f) => <ReportCard key={`${f.id}:${f.filePath}:${f.message}`} finding={f} />)
            )}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="text-sm font-semibold text-emerald-100">Passing checks</div>
          <div className="mt-3 space-y-3">
            {passed.length === 0 ? (
              <div className="text-sm text-emerald-100/70">No passing checks.</div>
            ) : (
              passed.map((f) => <ReportCard key={`${f.id}:${f.filePath}:${f.message}`} finding={f} />)
            )}
          </div>
        </div>
      </div>

      {skipped.length > 0 ? (
        <div className="glass-card mt-6 rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-4">
          <div className="text-sm font-semibold text-zinc-100">Skipped checks</div>
          <div className="mt-3 space-y-3">
            {skipped.map((f) => (
              <ReportCard key={`${f.id}:${f.filePath}:${f.message}`} finding={f} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-zinc-500">
          Finished {new Date(report.finishedAt).toLocaleString()} • Export JSON from DevTools
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(JSON.stringify(report, null, 2))}
          className="h-10 rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl px-4 text-sm text-zinc-200 transition hover:bg-zinc-900/55"
        >
          Copy report JSON
        </button>
      </div>
    </div>
  );
}
