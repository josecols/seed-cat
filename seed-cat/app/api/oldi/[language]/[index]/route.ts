import {
  BrillPOSTagger,
  Lexicon,
  RuleSet,
} from 'natural/lib/natural/brill_pos_tagger';
import { TreebankWordTokenizer } from 'natural/lib/natural/tokenizers';

import { CACHE_REVALIDATION, OLDI_DATASET_URL } from '@/app/lib/defaults';

export const revalidate = CACHE_REVALIDATION;
export const dynamic = 'force-static';

type Params = {
  params: {
    language: string;
    index: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const id = parseInt(params.index, 10) - 1;
  const [code, script] = params.language.split('_');
  const url = new URL(OLDI_DATASET_URL);
  url.searchParams.set(
    'where',
    `"iso_639_3"='${code}'AND"iso_15924"='${script}'AND"id"=${id}`
  );

  const response = await fetch(url.toString(), {
    headers: process.env.HUGGINGFACE_TOKEN
      ? new Headers({
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        })
      : undefined,
  });
  if (!response.ok) {
    return Response.error();
  }

  const { rows } = await response.json();
  if (!rows || !rows.length) {
    return Response.error();
  }

  const sentence = rows[0].row;

  const tokenizer = new TreebankWordTokenizer();
  const words = tokenizer.tokenize(sentence.text);

  let tags: [string, string][] = [];
  if (params.language === 'eng_Latn') {
    const lexicon = new Lexicon('EN', 'NN');
    const tagger = new BrillPOSTagger(lexicon, new RuleSet('EN'));
    tags = tagger.tag(words).taggedWords.map((tag) => [tag.token, tag.tag]);
  }

  return Response.json({
    tags,
    source: sentence.url,
    text: sentence.text,
  });
}
