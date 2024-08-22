import { type DataRecord, WordNet } from 'natural/lib/natural/wordnet';
import path from 'path';

import { CACHE_REVALIDATION } from '@/app/lib/defaults';

export const revalidate = CACHE_REVALIDATION;

const wordnet = new WordNet(path.join(process.cwd(), 'data/wordnet'));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term');

  if (!term) {
    return Response.error();
  }

  try {
    const results = await lookup(term);
    return Response.json(results);
  } catch (error) {
    return Response.json([]);
  }
}

function lookup(term: string): Promise<DataRecord[]> {
  return new Promise((resolve, reject) => {
    wordnet.lookup(term, (results) => {
      if (results.length > 0) {
        resolve(results);
      } else {
        reject(new Error('No results found'));
      }
    });
  });
}
