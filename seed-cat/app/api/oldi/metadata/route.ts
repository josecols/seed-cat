import { CACHE_REVALIDATION, GITHUB_BASE_PATH } from '@/app/lib/defaults';
import { getFileContent, getGitHubContent } from '@/app/lib/server/api';

export const revalidate = CACHE_REVALIDATION;

export async function GET() {
  let list: string[] = [];

  try {
    const data = await getGitHubContent(`${GITHUB_BASE_PATH}/metadata.tsv`);

    if (!Array.isArray(data) && data.download_url) {
      list = await getFileContent(data.download_url);
      list.shift();
    }
  } catch (error) {
    return Response.error();
  }

  return Response.json(list);
}
