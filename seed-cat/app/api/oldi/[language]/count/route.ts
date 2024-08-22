import { CACHE_REVALIDATION } from '@/app/lib/defaults';
import { getBaseUrl } from '@/app/lib/server/api';

export const revalidate = CACHE_REVALIDATION;
export const dynamic = 'force-static';

type Params = {
  params: {
    language: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const res = await fetch(`${getBaseUrl()}/api/oldi/${params.language}`, {
    next: { revalidate: CACHE_REVALIDATION },
  });
  const sentences = await res.json();

  if (!sentences.length) {
    return Response.error();
  }

  return Response.json({
    count: sentences.length,
  });
}
