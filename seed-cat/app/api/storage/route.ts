import { Storage } from '@google-cloud/storage';
import { type NextRequest } from 'next/server';

const VALID_TYPES = ['translation', 'prov'];
const GCS_BUCKET = process.env.GCS_BUCKET;

const credentials = JSON.parse(
  Buffer.from(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
    'base64'
  ).toString()
);
const storage = new Storage({ credentials });

async function uploadFile(bucket: string, filename: string, content: string) {
  await storage.bucket(bucket).file(filename).save(content);
}

async function downloadFile(bucket: string, filename: string) {
  const file = storage.bucket(bucket).file(filename);
  const [content] = await file.download();
  return content.toString('utf-8');
}

function getPath(language: string, index: string, type: string) {
  const basePath = `${language}/${index}`;

  switch (type) {
    case 'translation':
      return `${basePath}/translation.txt`;
    case 'prov':
      return `${basePath}/prov.json`;
  }
}

export async function POST(request: NextRequest) {
  const { content, type, language, index } = await request.json();

  if (!GCS_BUCKET) {
    return Response.json({ error: `GCS_BUCKET is not set` }, { status: 500 });
  }

  const required = [content, type, language, index];
  if (required.some((value) => !value) || !VALID_TYPES.includes(type)) {
    return Response.error();
  }

  const filepath = getPath(language, index, type);
  if (!filepath) {
    return Response.error();
  }

  await uploadFile(GCS_BUCKET, filepath, content);

  return Response.json({ success: true });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const type = searchParams.get('type');
  const language = searchParams.get('language');
  const index = searchParams.get('index');

  if (!GCS_BUCKET) {
    return Response.json({ error: `GCS_BUCKET is not set` }, { status: 500 });
  }

  if (!type || !language || !index || !VALID_TYPES.includes(type)) {
    return Response.error();
  }

  const filepath = getPath(language, index, type);
  if (!filepath) {
    return Response.error();
  }

  const content = await downloadFile(GCS_BUCKET, filepath);
  switch (type) {
    case 'translation':
      return Response.json({ translation: content }, { status: 200 });
    case 'prov':
      return Response.json(JSON.parse(content), { status: 200 });
  }
}
