export type NormalizedRepoTarget = {
  normalizedRepoUrl: string;
  owner: string;
  repo: string;
};

export function normalizePublicGithubRepoUrl(input: string): NormalizedRepoTarget | null {
  const raw = input.trim().replace(/[)\],.\s]+$/g, "");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.hostname !== "github.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!owner || !repo) return null;

  return {
    normalizedRepoUrl: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
  };
}

