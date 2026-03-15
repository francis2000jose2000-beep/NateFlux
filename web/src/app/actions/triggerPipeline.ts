'use server';

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import * as tar from 'tar';
import dotenv from 'dotenv';
import { triggerGitLabScan } from './scan';
import type { TriggerScanResult } from '@/shared/pipelineTypes';

// Explicitly load .env.local only in development or when file exists
if (process.env.NODE_ENV !== 'production' && fs.existsSync(path.resolve(process.cwd(), '../.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
}

export async function triggerScan(repoUrl: string): Promise<TriggerScanResult> {
  // Environment Check
  console.log('Final Target:', { project: process.env.GITLAB_PROJECT_ID, workspace: process.env.TFC_WORKSPACE_ID });

  // 1. Trigger GitLab Pipeline First
  const gitlabResult = await triggerGitLabScan(repoUrl);
  if (!gitlabResult.success) {
    return { 
        ok: false, 
        error: { 
            message: gitlabResult.message,
            details: gitlabResult.details, // Capture details
            source: 'GitLab'
        } 
    };
  }

  // --- DEMO MODE BYPASS ---
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && gitlabResult.pipelineId && gitlabResult.pipelineId > 2000000000) {
      return {
          ok: true,
          pipelineId: gitlabResult.pipelineId,
          webUrl: `https://gitlab.com/demo/pipeline/${gitlabResult.pipelineId}`,
          repoUrl: repoUrl,
          gitlabData: gitlabResult.details,
          tfcData: { id: `run-demo-${gitlabResult.pipelineId}`, status: 'simulated' }
      };
  }

  // 2. Trigger TFC Run (API-Driven Workflow)
  const tfcToken = process.env.TFC_TOKEN;
  const workspaceId = process.env.TFC_WORKSPACE_ID;

  if (!tfcToken || !workspaceId) {
    return {
      ok: false,
      error: {
        message: "Missing TFC_TOKEN or TFC_WORKSPACE_ID",
        source: "Terraform"
      }
    };
  }

  try {
    // Step 1: Create Configuration Version
    // POST /api/v2/workspaces/${WORKSPACE_ID}/configuration-versions
    const cvUrl = `https://app.terraform.io/api/v2/workspaces/${workspaceId}/configuration-versions`;
    const cvResponse = await fetch(cvUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tfcToken}`,
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'configuration-versions',
          attributes: {
            'auto-queue-runs': false // We trigger run manually in Step 3
          }
        }
      })
    });

    if (!cvResponse.ok) {
      const err = await cvResponse.text();
      console.error('Failed at Create Configuration Version:', err);
      return {
        ok: false,
        error: {
          message: 'Failed at Create Configuration Version',
          details: err,
          source: 'Terraform'
        }
      };
    }

    const cvData = await cvResponse.json();
    const uploadUrl = cvData.data.attributes['upload-url'];
    const configVersionId = cvData.data.id;

    // Step 2: Package & Upload
    // Package infrastructure/terraform/main.tf
    // Use path relative to the web root for Vercel deployment
    // Update: Using infra-templates injected during build time
    const mainTfPath = path.join(process.cwd(), 'infra-templates', 'terraform', 'main.tf');

    // Ensure file exists
    try {
        if (!fs.existsSync(mainTfPath)) {
          return {
            ok: false,
            error: {
              message: 'main.tf not found at ' + mainTfPath,
              source: 'Terraform'
            }
          };
        }
    } catch (fsError) {
        console.error('File system error checking main.tf:', fsError);
        return {
            ok: false,
            error: {
                message: 'File system error: ' + (fsError instanceof Error ? fsError.message : String(fsError)),
                source: 'Terraform'
            }
        };
    }

    // Create tarball in memory
    const tarStream = tar.c(
      {
        gzip: true,
        cwd: path.dirname(mainTfPath),
        portable: true, // ignore user/group info for reproducibility
      },
      [path.basename(mainTfPath)]
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of tarStream) {
      chunks.push(Buffer.from(chunk));
    }
    const fileBuffer = Buffer.concat(chunks);

    // Upload to uploadUrl
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text();
      console.error('Failed at Upload:', err);
      return {
        ok: false,
        error: {
          message: 'Failed at Upload',
          details: err,
          source: 'Terraform'
        }
      };
    }

    // Poll Configuration Version Status
    let cvStatus = 'pending';
    let attempts = 0;
    const maxAttempts = 20; // Approx 40-60 seconds timeout
    
    while (cvStatus !== 'uploaded' && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const checkCvResponse = await fetch(`https://app.terraform.io/api/v2/configuration-versions/${configVersionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tfcToken}`,
                'Content-Type': 'application/vnd.api+json',
            }
        });

        if (!checkCvResponse.ok) {
            console.error('Failed to check CV status:', await checkCvResponse.text());
            continue; // Retry on transient network errors
        }

        const checkCvData = await checkCvResponse.json();
        cvStatus = checkCvData.data.attributes.status;
        console.log(`Polling CV Status (Attempt ${attempts}):`, cvStatus);

        if (cvStatus === 'errored') {
             return {
                ok: false,
                error: {
                    message: 'Configuration Version upload failed (errored status)',
                    source: 'Terraform'
                }
            };
        }
    }

    if (cvStatus !== 'uploaded') {
        return {
            ok: false,
            error: {
                message: 'Timeout waiting for Configuration Version to process',
                source: 'Terraform'
            }
        };
    }

    // Step 3: Trigger Run
    // Only after the upload is successful, trigger the run.
    const runsUrl = 'https://app.terraform.io/api/v2/runs';
    const runResponse = await fetch(runsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tfcToken}`,
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            "is-destroy": false,
            "message": "Triggered via Web App (API-driven)"
          },
          type: "runs",
          relationships: {
            workspace: {
              data: {
                type: "workspaces",
                id: workspaceId,
              },
            },
            "configuration-version": {
              data: {
                type: "configuration-versions",
                id: configVersionId,
              },
            },
          },
        },
      })
    });

    if (!runResponse.ok) {
      const err = await runResponse.text();
      console.error('Failed at Trigger Run:', err);
      return {
        ok: false,
        error: {
          message: 'Failed at Trigger Run',
          details: err,
          source: 'Terraform'
        }
      };
    }

    const runData = await runResponse.json();

    console.log('Success: Pipeline Orchestration Complete', { pipelineId: gitlabResult.pipelineId, runId: runData.data.id });

    return { 
      ok: true, 
      pipelineId: gitlabResult.pipelineId!, 
      webUrl: gitlabResult.pipelineUrl!,
      repoUrl: repoUrl,
      gitlabData: gitlabResult.details,
      tfcData: runData
    };

  } catch (error) {
    console.error('Unexpected error in TFC workflow:', error);
    return {
      ok: false,
      error: {
        message: 'Unexpected error in TFC workflow',
        details: error instanceof Error ? error.message : String(error),
        source: 'Terraform'
      }
    };
  }
}
