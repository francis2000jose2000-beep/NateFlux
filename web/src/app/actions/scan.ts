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

  // 2. Validate Environment Variables
  const projectId = process.env.GITLAB_PROJECT_ID;
  const triggerToken = process.env.GITLAB_TOKEN;

  if (!projectId || !triggerToken) {
    console.error('Missing GitLab environment variables.');
    return {
      success: false,
      message: 'Server configuration error. Please contact the administrator.',
    };
  }

  // 3. Determine the ref to use: GITLAB_TRIGGER_REF -> main -> master
  // User requested to ensure ref is set to 'main'
  const targetRefs = [process.env.GITLAB_BRANCH || 'main'];

  // Remove duplicates
  const uniqueRefs = [...new Set(targetRefs)];
  
  let lastError: { type: string; message: string; details: unknown } | null = null;

  for (const ref of uniqueRefs) {
    try {
      // 3. Execute the secure API call to GitLab
      const url = `https://gitlab.com/api/v4/projects/${projectId}/pipeline`;
      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': triggerToken,
          },
          body: JSON.stringify({
            ref,
            variables: [
              { key: 'TARGET_REPO_URL', value: repoUrl }
            ],
          }),
        }
      );

      // Log the Response
      const responseText = await response.text();

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (error) {
          console.error('Failed to parse GitLab response:', error);
          data = { message: responseText };
      }

      // 4. Handle GitLab API errors gracefully
      if (!response.ok) {
        console.error('GitLab API Error:', response.status, response.url, responseText);
        if (response.status === 404) {
             throw new Error(`GitLab 404: Tried to fetch ${url} but got: ${responseText}`);
        }
        // Handle YAML syntax errors (400 Bad Request)
        if (response.status === 400) {
            return {
                success: false,
                message: 'GitLab CI Syntax Error. Please check your .gitlab-ci.yml formatting.',
                details: data,
            };
        }

        const msg = typeof data.message === 'string' 
            ? data.message 
            : JSON.stringify(data.message || {});

        if (msg.includes('Reference not found')) {
            lastError = { type: 'RefNotFound', message: msg, details: data };
            continue; // Try next ref
        }

        return {
          success: false,
          message: typeof data.message === 'string' ? data.message : 'Failed to trigger the scanning pipeline.',
          details: data,
        };
      }

      // 5. Return success with pipeline tracking details
      return {
        success: true,
        message: 'Scan initiated successfully.',
        pipelineId: data.id,
        pipelineUrl: data.web_url,
        details: data,
      };

    } catch (error) {
      // Catch network errors or unexpected exceptions
      console.error('Network or parsing error during pipeline trigger:', error);
      return {
        success: false,
        message: 'An unexpected network error occurred while contacting the CI/CD engine.',
        details: error,
      };
    }
  }

  if (lastError && lastError.type === 'RefNotFound') {
      return {
          success: false,
          message: 'Branch main/master not found. Check your GitLab project.',
          details: lastError.details,
      };
  }

  return {
      success: false,
      message: 'Failed to trigger pipeline. Please check configuration.'
  };
}
