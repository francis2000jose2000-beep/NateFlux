export type GitLabPipelineStatus =
  | "created"
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "canceled"
  | "skipped"
  | "manual";

export type CheckState = "unknown" | "running" | "passed" | "failed";

export type TriggerScanErrorCode = "INVALID_URL" | "PIPELINE_TRIGGER_FAILED" | "CONFIG";

export type PipelineStatusErrorCode = "INVALID_PIPELINE" | "PIPELINE_STATUS_FAILED" | "CONFIG";

export type ApiError<TCode extends string> = { code: TCode; message: string };

export type TriggerScanResult =
  | { ok: true; pipelineId: string | number; webUrl: string; repoUrl: string; gitlabData?: unknown; tfcData?: unknown }
  | { ok: false; status?: 'INITIALIZING'; error: { message: string; details?: unknown; source?: string } };

export type JobInfo = {
  id: number;
  name: string;
  status: GitLabPipelineStatus;
  webUrl: string;
};

export type PipelineStatusResponse =
  | {
      ok: true;
      status: GitLabPipelineStatus;
      webUrl: string;
      createdAt: string;
      finishedAt?: string;
      checks: { sentinel: CheckState; terraform: CheckState };
      jobs?: JobInfo[];
    }
  | { ok: false; error: { message: string; details?: unknown } };