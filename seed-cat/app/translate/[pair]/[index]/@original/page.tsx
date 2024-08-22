import React from 'react';

import { getLanguageSentence } from '@/app/lib/server/api';

import { Sentence } from './sentence';

export default async function Page({
  params,
}: {
  params: { pair: string; index: string };
}) {
  const [sourceLanguage, _] = params.pair.split('-');

  const renderTimestamp = Date.now();
  const index = parseInt(params.index, 10);
  const sentence = await getLanguageSentence(sourceLanguage, index);

  return sentence ? (
    <Sentence
      index={index}
      language={sourceLanguage}
      renderTimestamp={renderTimestamp}
      sentence={sentence}
    />
  ) : null;
}
