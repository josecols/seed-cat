import {CACHE_REVALIDATION} from '@/app/lib/defaults';

import languages from '@/data/oldi/languages.json'

export const revalidate = CACHE_REVALIDATION;

export async function GET() {
  languages.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  return Response.json(languages);
}
