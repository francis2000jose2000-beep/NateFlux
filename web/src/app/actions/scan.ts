'use server';

// Define strict return types for predictable UI handling
export interface ScanResponse {
  success: boolean;
  message: string;
  pipelineId?: number;
  pipelineUrl?: string;
  details?: unknown;
}

export async function triggerGitLabScan(repoUrl: string): Promise<ScanResponse> {
  // 1. Defensive Input Validation
  if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.startsWith('https://github.com/')) {
    return {
      success: false,
      message: 'Invalid input: Please provide a valid public GitHub URL.',
    };
  }

  // --- DEMO MODE INTERCEPT ---
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    console.log('--- DEMO MODE: Mocking Trigger ---');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency
    const mockId = Date.now() + Math.floor(Math.random() * 1000); // Dynamic timestamp-based ID
    return {
      success: true,
      message: '[DEMO] Scan initiated successfully.',
      pipelineId: mockId,
      pipelineUrl: `https://gitlab.com/demo/pipeline/${mockId}`,
      details: { status: 'simulated' }
    };
  }

  // Strict Variable Check
  if (!process.env.GITLAB_TOKEN) throw new Error('Trigger: GITLAB_TOKEN is missing from env');

  // Debug Injection
  console.log('--- TRIGGER DEBUG ---');
  console.log('Token Exists:', !!process.env.GITLAB_TOKEN);
  console.log('Token Prefix:', process.env.GITLAB_TOKEN ? process.env.GITLAB_TOKEN.substring(0, 6) : 'N/A');
  console.log('---------------------');

  try {
    // Strict Fetch Formatting
    const res = await fetch(`https://gitlab.com/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/pipeline?ref=main`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PRIVATE-TOKEN': process.env.GITLAB_TOKEN
      },
      body: JSON.stringify({
        variables: [
          { key: 'TARGET_REPO_URL', value: repoUrl }
        ],
      }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('GitLab Trigger Error:', res.status, text);
        return {
            success: false,
            message: `GitLab Error: ${res.status} - ${text}`,
            details: text
        };
    }

    const data = await res.json();
    return {
        success: true,
        message: 'Scan initiated successfully.',
        pipelineId: data.id,
        pipelineUrl: data.web_url,
        details: data
    };

  } catch (error) {
      console.error('Trigger Exception:', error);
      return {
          success: false,
          message: 'Exception during trigger',
          details: error instanceof Error ? error.message : String(error)
      };
  }
}
