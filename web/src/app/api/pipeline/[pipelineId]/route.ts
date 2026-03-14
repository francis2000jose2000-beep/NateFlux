import { NextResponse } from 'next/server';
import type { PipelineStatusResponse, JobInfo, GitLabPipelineStatus } from "@/shared/pipelineTypes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  const { pipelineId } = await params;
  const projectId = process.env.GITLAB_PROJECT_ID;
  const apiToken = process.env.GITLAB_TOKEN;

  // 1. Validate GITLAB_PROJECT_ID existence
  if (!projectId) {
    console.error("Error: GITLAB_PROJECT_ID is not defined in environment variables.");
    return NextResponse.json(
      { ok: false, error: { message: "Server configuration error: Missing GITLAB_PROJECT_ID" } },
      { status: 500 }
    );
  }

  if (!apiToken) {
    console.error("Error: GITLAB_TOKEN is not defined in environment variables.");
    return NextResponse.json(
      { ok: false, error: { message: "Server configuration error: Missing GITLAB_TOKEN" } },
      { status: 500 }
    );
  }

  try {
    // 2. Verify URL construction
    const baseUrl = "https://gitlab.com/api/v4";
    const url = `${baseUrl}/projects/${projectId}/pipelines/${pipelineId}`;
    
    // 3. Add debug logging
    console.log(`Fetching GitLab API: ${url}`);

    const res = await fetch(
      url,
      {
        headers: {
          'PRIVATE-TOKEN': apiToken,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('GitLab API Error:', res.status, res.url, errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            message: errorData.message || "Failed to fetch status.",
            details: errorData
          } 
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Fetch jobs for detailed status
    let jobs: JobInfo[] = [];
    try {
      const jobsUrl = `${baseUrl}/projects/${projectId}/pipelines/${pipelineId}/jobs`;
      // console.log(`[API] Fetching pipeline jobs from: ${jobsUrl}`);
      
      const jobsRes = await fetch(
        jobsUrl,
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
