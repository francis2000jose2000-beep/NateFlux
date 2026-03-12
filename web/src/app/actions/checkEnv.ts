'use server';

export async function checkEnv() {
  const isMissing = !process.env.TFC_TOKEN;
  return {
    ok: !isMissing,
    message: isMissing ? 'Deployment Setup Incomplete: TFC_TOKEN is missing.' : 'Environment check passed.'
  };
}
