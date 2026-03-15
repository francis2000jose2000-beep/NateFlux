import type { ComplianceFinding } from "@/shared/scanTypes";

type Props = {
  finding: ComplianceFinding;
};

function badgeClasses(status: ComplianceFinding["status"]) {
  if (status === "PASSED") return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30";
  if (status === "FAILED") return "bg-rose-500/15 text-rose-200 ring-rose-500/30";
  return "bg-white/10 text-zinc-200 ring-white/20";
}

export function ReportCard({ finding }: Props) {
  const location =
    finding.lineStart && finding.lineEnd
      ? `${String(finding.filePath)}:${finding.lineStart}-${finding.lineEnd}`
      : finding.lineStart
        ? `${String(finding.filePath)}:${finding.lineStart}`
        : String(finding.filePath);

  return (
    <div className="rounded-xl border border-white/10 !bg-[#060010]/40 backdrop-blur-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">{String(finding.title)}</div>
          <div className="mt-1 text-xs text-zinc-400">{location}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${badgeClasses(finding.status)}`}>
            {String(finding.status)}
          </span>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
            {String(finding.severity)}
          </span>
        </div>
      </div>

      <div className="mt-3 text-sm text-zinc-200/90">{String(finding.message)}</div>
      {finding.remediation ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200">
          {String(finding.remediation)}
        </div>
      ) : null}
    </div>
  );
}
