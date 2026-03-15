"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { checkEnv } from "@/app/actions/checkEnv";
import { triggerScan } from "@/app/actions/triggerPipeline";
import { PipelineHero } from "@/components/PipelineHero";
import { PipelineResultsCard } from "@/components/PipelineResultsCard";
import { PipelineSkeleton } from "@/components/PipelineSkeleton";
import { DebugConsole, DebugLog } from "@/components/DebugConsole";
import { Toast } from "@/components/Toast";
import type { PipelineStatusResponse, TriggerScanResult } from "@/shared/pipelineTypes";

interface SuccessfulRun {
  pipelineId: number | string;
  repoUrl: string;
  timestamp: string;
  webUrl: string;
}

function getSafeErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    // @ts-expect-error - handling loose error objects
    if (error.message) return getSafeErrorMessage(error.message);
    // @ts-expect-error - handling specific validation error case mentioned by user
    if (error.base) return getSafeErrorMessage(error.base);
    if (Array.isArray(error)) return error.map(getSafeErrorMessage).join(", ");
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error object";
    }
  }
  return String(error || "Unknown error");
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [isTriggering, setIsTriggering] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerScanResult | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error"; linkUrl?: string; linkText?: string } | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [successfulRuns, setSuccessfulRuns] = useState<SuccessfulRun[]>([]);
  const pollStartedAtRef = useRef<number | null>(null);

  const addDebugLog = (log: Omit<DebugLog, 'timestamp'>) => {
    setDebugLogs(prev => {
      const newLogs = [...prev, { ...log, timestamp: new Date().toLocaleTimeString() }];
      // Keep the last 20 logs in state as well
      return newLogs.slice(-20);
    });
  };

  // Load logs and runs from localStorage on mount
  useEffect(() => {
    // Check environment status
    checkEnv().then(res => {
        if (!res.ok) {
            addDebugLog({ source: 'System', status: 500, data: { message: res.message } });
        }
    });

    const savedLogs = localStorage.getItem('debugLogs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        if (Array.isArray(parsedLogs)) {
          setDebugLogs(parsedLogs);
        }
      } catch (e) {
        console.error("Failed to parse logs from localStorage", e);
      }
    }

    const savedRuns = localStorage.getItem('nateflux_successful_runs');
    if (savedRuns) {
      try {
        setSuccessfulRuns(JSON.parse(savedRuns));
      } catch (e) {
        console.error("Failed to parse runs from localStorage", e);
      }
    }
  }, []);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    // Keep only the last 20 logs (approx. 5 triggers) to avoid localStorage overflow
    const logsToSave = debugLogs.slice(-20);
    localStorage.setItem('debugLogs', JSON.stringify(logsToSave));
  }, [debugLogs]);

  const canRun = useMemo(
    () => repoUrl.trim().length > 0 && !isTriggering && !isPolling,
    [repoUrl, isTriggering, isPolling]
  );

  const [isSuccess, setIsSuccess] = useState(false);

  async function onRun() {
    if (!canRun) return;

    setIsTriggering(true);
    setIsPolling(false);
    setIsSuccess(false);
    pollStartedAtRef.current = null;
    setErrorMessage(null);
    setRawError(null);
    setTriggerResult(null);
    setPipelineStatus(null);
    setToast(null);

    try {
      const res = await triggerScan(repoUrl);
      
      // Debug Logging
      if (res.ok) {
        if (res.gitlabData) addDebugLog({ source: 'GitLab', status: 200, data: res.gitlabData });
        if (res.tfcData) addDebugLog({ source: 'Terraform', status: 201, data: res.tfcData });

        // Save to successful runs
        const newRun: SuccessfulRun = {
          pipelineId: res.pipelineId!,
          repoUrl: repoUrl,
          timestamp: new Date().toLocaleString(),
          webUrl: res.webUrl!
        };
        
        setSuccessfulRuns(prev => {
          const newRuns = [newRun, ...prev].slice(0, 5);
          localStorage.setItem('nateflux_successful_runs', JSON.stringify(newRuns));
          return newRuns;
        });
      } else {
        const msg = res.error?.message || "";
        // Use explicit source from backend if available, otherwise fallback to detection
        // @ts-expect-error - source property added in backend
        let source: DebugLog['source'] = res.error?.source || "GitLab";
        
        if (source === "GitLab" && (msg.includes("Terraform") || msg.includes("TFC"))) {
             source = "Terraform";
        }

        if (res.error?.details) {
            addDebugLog({ source, status: 400, data: res.error.details });
        }
      }

      setTriggerResult(res as TriggerScanResult);
      if (!res.ok) {
        if (res.status === 'INITIALIZING') {
             setToast({
                 message: 'Infrastructure Syncing: Terraform is connecting to your GitLab repo. Please wait 30 seconds and try again.',
                 type: 'info'
             });
             return;
        }

        // Ensure we never pass a raw object to the state
        const msg = res.error?.message || "An unknown error occurred";
        setErrorMessage(getSafeErrorMessage(msg));
        setRawError(res.error?.details || res.error);
        return;
      }
      setToast({
          message: "Pipeline Orchestrated",
          type: "success",
          linkUrl: res.webUrl,
          linkText: "View Pipeline"
      });
      setIsSuccess(true);
      setIsPolling(true);
      pollStartedAtRef.current = Date.now();
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error) || "Pipeline trigger failed.");
      setRawError(error);
    } finally {
      setIsTriggering(false);
    }
  }

  useEffect(() => {
    if (!triggerResult?.ok) return;

    let cancelled = false;
    const pipelineId = triggerResult.pipelineId;
    const maxMs = 5 * 60_000;
    const intervalMs = 3000;

    async function pollOnce() {
      if (cancelled) return;
      const startedAt = pollStartedAtRef.current ?? Date.now();
      pollStartedAtRef.current = startedAt;
      if (Date.now() - startedAt > maxMs) {
        setIsPolling(false);
        setErrorMessage("Polling timed out. Check the pipeline in GitLab.");
        return;
      }

      try {
        const res = await fetch(`/api/pipeline/${pipelineId}`, { cache: "no-store" });
        
        if (res.status === 404) {
          // Pipeline might be initializing
          return;
        }
        const data = (await res.json()) as PipelineStatusResponse;

        // Debug Logging
        addDebugLog({
            source: 'GitLab',
            url: `/api/pipeline/${pipelineId}`,
            status: res.status,
            data: data
        });

        if (cancelled) return;
        setPipelineStatus(data);

        if (data.ok) {
          if (
            data.status === "success" ||
            data.status === "failed" ||
            data.status === "canceled" ||
            data.status === "skipped"
          ) {
            setIsPolling(false);
          }
        } else {
          setIsPolling(false);
          setErrorMessage(getSafeErrorMessage(data.error.message));
          setRawError(data.error.details || data.error);
        }
      } catch (error) {
        setIsPolling(false);
        setErrorMessage("Failed to fetch pipeline status.");
        setRawError(error);
      }
    }

    pollOnce();
    const timer = setInterval(pollOnce, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [triggerResult]);

  return (
    <div className="min-h-screen text-zinc-50">

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-indigo-500/30">
            <Image
              src="/logo.svg"
              alt="NateFlux Logo"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-sm font-semibold tracking-wide">NateFlux</div>
        </div>
        <div className="text-xs text-zinc-400">DevSecOps Pipeline Orchestrator</div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-6 pb-20">
        <PipelineHero repoUrl={repoUrl} setRepoUrl={setRepoUrl} isLoading={isTriggering || isPolling} isSuccess={isSuccess} onRun={onRun} />

        <div className="mt-10">
          {isTriggering ? (
            <PipelineSkeleton />
          ) : (
            <PipelineResultsCard
              trigger={triggerResult}
              status={pipelineStatus}
              isPolling={isPolling}
              errorMessage={errorMessage && String(errorMessage)}
              rawError={rawError}
              onRetry={onRun}
            />
          )}
        </div>

        {successfulRuns.length > 0 && (
          <div className="mt-12 border-t border-white/10 pt-8">
            <h3 className="mb-4 text-sm font-semibold text-zinc-400">Recent Successful Orchestrations</h3>
            <div className="grid gap-3">
              {successfulRuns.map((run) => (
                <div key={run.pipelineId} className="flex items-center justify-between rounded-lg border border-white/10 !bg-[#060010]/40 backdrop-blur-2xl px-4 py-3 transition hover:!bg-[#060010]/55">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-200">#{run.pipelineId}</span>
                    <span className="text-xs text-zinc-500">{run.repoUrl}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500">{run.timestamp}</span>
                    <a 
                      href={run.webUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      View Pipeline
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-zinc-500">
          Secrets never reach the client. Server actions proxy requests to GitLab.
        </footer>
        
        <DebugConsole logs={debugLogs} />
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          linkUrl={toast.linkUrl}
          linkText={toast.linkText}
          onClose={() => setToast(null)}
          duration={toast.type === 'success' ? 10000 : 5000}
        />
      )}
    </div>
  );
}
