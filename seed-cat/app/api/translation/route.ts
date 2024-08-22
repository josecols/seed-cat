import { HfInference, type TranslationArgs } from '@huggingface/inference';
import { type NextRequest } from 'next/server';

export const maxDuration = 60;

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

export async function POST(request: NextRequest) {
  const { source, target, query } = await request.json();

  if (!process.env.HUGGINGFACE_TOKEN || !source || !target || !query) {
    return Response.error();
  }

  const output = await hf.translation({
    model: 'facebook/nllb-200-distilled-600M',
    inputs: query,
    parameters: {
      src_lang: source,
      tgt_lang: target,
    },
  } as TranslationArgs);

  if (Array.isArray(output)) {
    return Response.json({ translation: output[0].translation_text });
  }

  return Response.json({ translation: output.translation_text });
}
