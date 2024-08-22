import { Octokit } from '@octokit/core';

import { CACHE_REVALIDATION } from '@/app/lib/defaults';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  );
}

export async function getGitHubContent(resource: string) {
  const [owner, repo, ...path] = resource.split('/').slice(1);

  const { data } = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {
      owner,
      repo,
      path: path.join('/'),
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  return data;
}

export async function getFileContent(downloadUrl: string) {
  const response = await fetch(downloadUrl, {
    next: { revalidate: CACHE_REVALIDATION },
  });
  if (!response.ok) {
    return [];
  }

  const content = await response.text();
  const list = content.split(/\r?\n/);
  list.pop();

  return list;
}

export async function getFromApi<T>(path: string): Promise<T | undefined> {
  const res = await fetch(`${getBaseUrl()}/api/${path}`, {
    next: { revalidate: CACHE_REVALIDATION },
  });

  if (res.ok) {
    return res.json();
  }
}

export async function getLanguageSentencesCount(language: string) {
  return (
    (await getFromApi<{ count: number }>(`oldi/${language}/count`)) ?? {
      count: 0,
    }
  );
}

export async function getLanguageSentence(
  language: string,
  index: string | number
) {
  return (
    (await getFromApi<{
      source: string;
      tags: [string, string][];
      text: string;
    }>(`oldi/${language}/${index}`)) ?? null
  );
}
