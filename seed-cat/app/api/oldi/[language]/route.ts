import { CACHE_REVALIDATION, GITHUB_BASE_PATH } from '@/app/lib/defaults';
import { getFileContent, getGitHubContent } from '@/app/lib/server/api';

export const revalidate = CACHE_REVALIDATION;
export const dynamic = 'force-static';

type Params = {
  params: {
    language: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  let list: string[] = [];

  try {
    const data = await getGitHubContent(
      `${GITHUB_BASE_PATH}/${params.language}`
    );

    if (!Array.isArray(data) && data.download_url) {
      list = await getFileContent(data.download_url);
    }
  } catch (error) {
    return Response.error();
  }

  return Response.json(list);
}
