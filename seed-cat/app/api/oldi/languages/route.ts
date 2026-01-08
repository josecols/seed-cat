import languages from '@/data/oldi/languages.json';

export const revalidate = 43200;

export async function GET() {
  languages.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return Response.json(languages);
}
