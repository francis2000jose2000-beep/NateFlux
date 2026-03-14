import { NextResponse } from 'next/server';
import type { PipelineStatusResponse, JobInfo, GitLabPipelineStatus } from "@/shared/pipelineTypes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  const { pipelineId } = await params;
  const projectId = process.env.GITLAB_PROJECT_ID;
  const apiToken = process.env.GITLAB_TOKEN;

  if (!projectId || !apiToken) {
    return NextResponse.json(
      { ok: false, error: { message: "Server missing API read token." } },
      { status: 500 }
    );
  }

  try {
    const url = `https://gitlab.com/api/v4/projects/${projectId}/pipelines/${pipelineId}`;
    const res = await fetch(
      url,
      {
        headers: {
          'PRIVATE-TOKEN': apiToken,
        },
        cache: 'no-store',
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            message: data.message || "Failed to fetch status.",
            details: data
          } 
        },
        { status: res.status }
      );
    }

    // Fetch jobs for detailed status
    let jobs: JobInfo[] = [];
    try {
      const jobsRes = await fetch(
        `https://gitlab.com/api/v4/projects/${projectId}/pipelines/${pipelineId}/jobs`,
        {
          headers: { 'PRIVATE-TOKEN': apiToken },
          cache: 'no-store'
        }
      );
      
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (Array.isArray(jobsData)) {
          jobs = jobsData.map((job: { id: number; name: string; status: string; web_url: string }) => ({
            id: job.id,
            name: job.name,
            status: job.status as GitLabPipelineStatus,
            webUrl: job.web_url
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch jobs:", e);
    }

    const payload: PipelineStatusResponse = {
      ok: true,
      status: data.status, // GitLab statuses: 'created', 'pending', 'running', 'success', 'failed', 'canceled', etc.
      webUrl: data.web_url,
      createdAt: data.created_at,
      finishedAt: data.finished_at,
      checks: {
        sentinel: data.status === "success" ? "passed" : data.status === "failed" ? "failed" : "running",
        terraform: data.status === "success" ? "passed" : data.status === "failed" ? "failed" : "running",
      },
      jobs: jobs
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Polling error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
            message: "Network error fetching pipeline status.",
            details: error
        } 
      },
      { status: 500 }
    );
  }
}
