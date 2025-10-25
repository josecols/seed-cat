import React from 'react';

import { getLanguageSentence } from '@/app/lib/server/api';

import { Sentence } from './sentence';

export default async function Page(props: {
  params: Promise<{ pair: string; index: string }>;
}) {
  const params = await props.params;
  const [sourceLanguage, _] = params.pair.split('-');

  const index = parseInt(params.index, 10);
  const sentence = await getLanguageSentence(sourceLanguage, index);

  return sentence ? (
    <Sentence index={index} language={sourceLanguage} sentence={sentence} />
  ) : null;
}
