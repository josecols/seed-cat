import { CACHE_REVALIDATION, GITHUB_BASE_PATH } from '@/app/lib/defaults';
import { getGitHubContent } from '@/app/lib/server/api';

export const revalidate = CACHE_REVALIDATION;

export async function GET() {
  let languages: { name: string }[] = [];

  try {
    const data = await getGitHubContent(`${GITHUB_BASE_PATH}`);

    if (Array.isArray(data)) {
      languages = data?.filter((item) => item.name.match(/^\w{3}_\w{4}$/));
    }
  } catch (error) {
    return Response.error();
  }

  return Response.json(languages);
}
