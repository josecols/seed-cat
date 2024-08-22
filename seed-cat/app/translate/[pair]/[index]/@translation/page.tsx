import React from 'react';

import { getLanguageSentence } from '@/app/lib/server/api';
import {localMTInference} from "@/app/lib/server/config";

import { Editor } from './editor';

export default async function Page({
  params,
}: {
  params: { pair: string; index: string };
}) {
  const [source, target] = params.pair.split('-');
  const original = await getLanguageSentence(source, params.index);

  return (
    <section className="flex flex-col gap-4">
      <Editor
        index={parseInt(params.index, 10)}
        original={original?.text ?? ''}
        sourceLanguage={source}
        targetLanguage={target}
        localInference={localMTInference()}
      />
    </section>
  );
}
