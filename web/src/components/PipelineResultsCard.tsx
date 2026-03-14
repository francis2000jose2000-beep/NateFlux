import { useEffect, useState } from "react";
import type { CheckState, GitLabPipelineStatus, PipelineStatusResponse, TriggerScanResult } from "@/shared/pipelineTypes";

function statusPillColor(status: GitLabPipelineStatus) {
  if (status === "success") return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  if (status === "failed") return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
  if (status === "canceled") return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30";
  if (status === "skipped") return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30";
  if (status === "manual") return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
  return "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30";
}

function checkPillColor(state: CheckState) {
  if (state === "passed") return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  if (state === "failed") return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
  if (state === "running") return "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30";
  return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30";
}

function titleCase(input: string) {
  return input.length ? input[0].toUpperCase() + input.slice(1) : input;
}

function getStatusText(status: GitLabPipelineStatus) {
  if (status === "created" || status === "pending") return "Initializing";
  if (status === "running") return "Scanning";
  if (status === "success") return "Provisioning";
  return titleCase(status);
}

function CheckRow({ label, state }: { label: string; state: CheckState }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-sm text-zinc-200">{label}</div>
      <div className={`rounded-full px-3 py-1 text-xs ${checkPillColor(state)}`}>{titleCase(state)}</div>
    </div>
  );
}

type Props = {
  trigger: TriggerScanResult | null;
  status: PipelineStatusResponse | null;
  isPolling: boolean;
  errorMessage: string | null;
  rawError?: unknown;
  onRetry?: () => void;
};

export function PipelineResultsCard({ trigger, status, isPolling, errorMessage, rawError, onRetry }: Props) {
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (retryCountdown === null) return;
    if (retryCountdown <= 0) {
      const t = setTimeout(() => {
        setRetryCountdown(null);
        onRetry?.();
      }, 0);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryCountdown, onRetry]);

  const handleRetry = () => {
    setRetryCountdown(10);
  };

  // Defensive checks to prevent object rendering crashes
  const safeError = errorMessage ? String(errorMessage) : null;
  const isStatusValid = status && typeof status === "object" && "ok" in status;
  const safeStatus = isStatusValid ? status : null;
  const fallbackStatus = status && !isStatusValid ? "Invalid status received" : null;

  const renderDebugConsole = () => {
    // 1. If we have explicit rawError (from catch blocks or 422 manual action required)
    if (rawError) {
      return (
        <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-zinc-400">
          <div className="border-b border-white/10 bg-white/5 px-3 py-2 font-semibold text-zinc-300">Debug Console</div>
          <div className="overflow-x-auto p-3">
            <pre>{JSON.stringify(rawError, null, 2)}</pre>
          </div>
        </div>
      );
    }

    // 2. If we have success data (GitLab/Terraform logs), show them in a Live Log Panel
    if (trigger?.ok && (trigger.gitlabData || trigger.tfcData)) {
      return (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-100">Live Log Panel</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {!!trigger.gitlabData && (
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-zinc-400">
                <div className="border-b border-white/10 bg-white/5 px-3 py-2 font-semibold text-zinc-300">GitLab Response</div>
                <div className="max-h-60 overflow-y-auto overflow-x-auto p-3">
                  <pre>{JSON.stringify(trigger.gitlabData, null, 2)}</pre>
                </div>
              </div>
            )}
            {!!trigger.tfcData && (
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-zinc-400">
                <div className="border-b border-white/10 bg-white/5 px-3 py-2 font-semibold text-zinc-300">Terraform Response</div>
                <div className="max-h-60 overflow-y-auto overflow-x-auto p-3">
                  <pre>{JSON.stringify(trigger.tfcData, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  if (safeError) {
    return (
      <div className="glass-card rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200">
        {safeError}
        {safeError.includes("Reference not found") && (
          <div className="mt-2 font-medium text-rose-300">
            Tip: Check if your GITLAB_TRIGGER_REF matches your GitLab branch name (main/master).
          </div>
        )}
        {renderDebugConsole()}
      </div>
    );
  }

  if (fallbackStatus) {
    return (
      <div className="glass-card rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
        {fallbackStatus}
        {renderDebugConsole()}
      </div>
    );
  }

  if (!trigger) {
    return (
      <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-400">
        Run a scan to see pipeline results.
      </div>
    );
  }

  if (!trigger.ok) {
    const msg = String(trigger.error?.message || "Unknown trigger error");
    return (
      <div className="glass-card rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200">
        {msg}
        {msg.includes("Reference not found") && (
          <div className="mt-2 font-medium text-rose-300">
            Tip: Check if your GITLAB_TRIGGER_REF matches your GitLab branch name (main/master).
          </div>
        )}
        {renderDebugConsole()}
      </div>
    );
  }

  const webUrl = (safeStatus && safeStatus.ok ? safeStatus.webUrl : undefined) ?? trigger.webUrl;
  
  // Try to find a specific job URL if available and status is success
  let displayWebUrl = webUrl;
  let linkText = "View in GitLab";
  
  if (safeStatus && safeStatus.ok && safeStatus.status === 'success' && safeStatus.jobs && safeStatus.jobs.length > 0) {
      // Prioritize 'apply' or 'deploy' jobs, otherwise first job
      const relevantJob = safeStatus.jobs.find(j => j.name.toLowerCase().includes('apply') || j.name.toLowerCase().includes('deploy')) || safeStatus.jobs[0];
      if (relevantJob.webUrl) {
          displayWebUrl = relevantJob.webUrl;
          linkText = `View Job #${relevantJob.id}`;
      }
  }

  const isInitializing = safeStatus && safeStatus.ok && (safeStatus.status === 'created' || safeStatus.status === 'pending');

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Results</div>
          <div className="mt-1 text-xs text-zinc-400">
            Pipeline <span className="text-zinc-200">#{String(trigger.pipelineId)}</span> · {String(trigger.repoUrl)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {trigger?.ok && (
             <div className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 sm:block">
               VCS Link: Connected
             </div>
          )}
          {safeStatus && safeStatus.ok ? (
            <div className={`rounded-full px-3 py-1 text-xs ${statusPillColor(safeStatus.status)}`}>
              {getStatusText(safeStatus.status)}
            </div>
          ) : (
            <div className={`rounded-full px-3 py-1 text-xs ${trigger?.ok ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : statusPillColor("running")} ${isPolling ? "animate-pulse" : ""}`}>
              {trigger?.ok ? "System Online" : (isPolling ? "Pipeline Live" : "Queued")}
            </div>
          )}

          {displayWebUrl ? (
            <a
              href={String(displayWebUrl)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              {linkText}
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <CheckRow
          label="Security Scan"
          state={trigger?.ok ? "passed" : "unknown"}
        />
        <CheckRow
          label="Sentinel policy tests"
          state={safeStatus && safeStatus.ok ? safeStatus.checks.sentinel : isPolling ? "running" : "unknown"}
        />
        <CheckRow
          label="Infrastructure"
          state={trigger?.ok ? "passed" : (safeStatus && safeStatus.ok ? safeStatus.checks.terraform : isPolling ? "running" : "unknown")}
        />
      </div>

      {/* Live Pipeline Logs (Detailed Status Table) */}
      {safeStatus && safeStatus.ok && safeStatus.jobs && safeStatus.jobs.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">Live Pipeline Logs</h3>
            <span className="text-xs text-zinc-500">Real-time Job Status</span>
          </div>
          <div className="grid gap-2">
             <div className="grid grid-cols-[1fr_auto] px-4 text-xs font-medium text-zinc-500">
               <div>Job Name</div>
               <div>Status</div>
             </div>
             {safeStatus.jobs.map(job => (
               <div key={job.id} className="grid grid-cols-[1fr_auto] items-center rounded-lg bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
                 <div className="flex items-center gap-2">
                    <span className="text-zinc-200">{job.name}</span>
                    <a href={job.webUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline opacity-50 hover:opacity-100">#{job.id}</a>
                 </div>
                 <div>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs ${statusPillColor(job.status)}`}>
                      {titleCase(job.status)}
                    </span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Smart Retry Button */}
      {isInitializing && onRetry && (
        <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
            <button 
                onClick={handleRetry}
                disabled={retryCountdown !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/20 px-4 py-2 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30 transition hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {retryCountdown !== null ? (
                    <>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                        Retrying in {retryCountdown}s...
                    </>
                ) : (
                    "Retry Trigger"
                )}
            </button>
        </div>
      )}

      {safeStatus && !safeStatus.ok ? (
        <div className="mt-4 text-xs text-rose-200">
          {String(safeStatus.error?.message || "Unknown status error")}
          {String(safeStatus.error?.message || "").includes("Reference not found") && (
            <div className="mt-1 font-medium text-rose-300">
              Tip: Check if your GITLAB_TRIGGER_REF matches your GitLab branch name (main/master).
            </div>
          )}
          {renderDebugConsole()}
        </div>
      ) : null}
      
      {/* Debug Console / Live Log Panel (if not already shown in error blocks) */}
      {!safeError && !fallbackStatus && !(safeStatus && !safeStatus.ok) && (
          renderDebugConsole()
      )}
    </div>
  );
}
