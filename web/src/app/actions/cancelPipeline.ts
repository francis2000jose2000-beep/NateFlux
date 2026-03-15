'use server';

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Explicitly load .env.local only in development or when file exists
if (process.env.NODE_ENV !== 'production' && fs.existsSync(path.resolve(process.cwd(), '../.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
}

export interface CancelPipelineResponse {
  success: boolean;
  error?: string;
  details?: unknown;
}

export async function cancelGitLabPipeline(pipelineId: number): Promise<CancelPipelineResponse> {
  const token = process.env.GITLAB_TOKEN;
  const pId = process.env.GITLAB_PROJECT_ID;

  console.log('--- NUCLEAR DEBUG ---');
  console.log('Project ID:', pId);
  console.log('Token Exists:', !!token);
  console.log('Token Starts With:', token ? token.substring(0, 6) : 'undefined');
  console.log('Target Pipeline:', pipelineId);
  console.log('Full URL:', `https://gitlab.com/api/v4/projects/${pId}/pipelines/${pipelineId}/cancel`);
  console.log('---------------------');

  if (!token || !pId) {
    throw new Error('Next.js did not load the environment variables.');
  }

  // 1. Validate Input
  if (!pipelineId || typeof pipelineId !== 'number' || pipelineId <= 0) {
    return {
      success: false,
      error: 'Invalid input: A valid pipeline ID is required.',
    };
  }

  try {
    // 3. Execute the secure API call to GitLab
    const url = `https://gitlab.com/api/v4/projects/${pId}/pipelines/${pipelineId}/cancel`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PRIVATE-TOKEN': token,
      },
    });

    // 4. Handle GitLab API errors gracefully
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`GitLab API Error cancelling pipeline ${pipelineId}:`, response.status, responseText);
      
      return {
        success: false,
        error: responseText || `GitLab API Error: ${response.status}`,
        details: { status: response.status, raw: responseText },
      };
    }

    // 5. Return success
    return {
      success: true,
    };

  } catch (error) {
    // Catch network errors or unexpected exceptions
    console.error(`Network or unexpected error during pipeline ${pipelineId} cancellation:`, error);
    return {
      success: false,
      error: 'An unexpected network error occurred while contacting the CI/CD engine.',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
