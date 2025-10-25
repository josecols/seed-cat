import { CACHE_REVALIDATION, OLDI_DATASET_URL } from '@/app/lib/defaults';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{
    language: string;
  }>;
};

type SentenceData = {
  id: number;
  text: string;
};

export async function GET(request: Request, props: Params) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);

  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  const [code, script] = params.language.split('_');

  const url = new URL(OLDI_DATASET_URL);
  url.searchParams.set(
    'where',
    `"iso_639_3"='${code}'AND"iso_15924"='${script}'`
  );
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('length', limit.toString());

  const response = await fetch(url.toString(), {
    headers: process.env.HUGGINGFACE_TOKEN
      ? new Headers({
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        })
      : undefined,
    next: { revalidate: CACHE_REVALIDATION },
  });

  if (!response.ok) {
    return Response.error();
  }

  const { rows } = await response.json();
  if (!rows || !rows.length) {
    return Response.json({ sentences: [] });
  }

  const sentences: SentenceData[] = rows.map((row: any) => {
    const sentence = row.row;
    return {
      id: sentence.id,
      text: sentence.text,
    };
  });

  return Response.json({ sentences });
}
