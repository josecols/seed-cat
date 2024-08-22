import {
  BrillPOSTagger,
  Lexicon,
  RuleSet,
} from 'natural/lib/natural/brill_pos_tagger';
import { TreebankWordTokenizer } from 'natural/lib/natural/tokenizers';

import { CACHE_REVALIDATION } from '@/app/lib/defaults';
import { getFromApi } from '@/app/lib/server/api';

export const revalidate = CACHE_REVALIDATION;
export const dynamic = 'force-static';

type Params = {
  params: {
    language: string;
    index: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const [sentencesResponse, metadataResponse] = await Promise.all([
    getFromApi<string[]>(`oldi/${params.language}`),
    getFromApi<string[]>('oldi/metadata'),
  ]);

  const [sentences, sources] = await Promise.all([
    sentencesResponse,
    metadataResponse,
  ]);

  if (!sentences?.length || !sources?.length) {
    return Response.json(null, { status: 404 });
  }

  const text = sentences[parseInt(params.index, 10) - 1];
  const source = sources[parseInt(params.index, 10) - 1];

  if (!text || !source) {
    return Response.json(null, { status: 404 });
  }

  const tokenizer = new TreebankWordTokenizer();
  const words = tokenizer.tokenize(text);

  let tags: [string, string][] = [];
  if (params.language === 'eng_Latn') {
    const lexicon = new Lexicon('EN', 'NN');
    const tagger = new BrillPOSTagger(lexicon, new RuleSet('EN'));
    tags = tagger.tag(words).taggedWords.map((tag) => [tag.token, tag.tag]);
  }

  return Response.json({
    source,
    tags,
    text,
  });
}
