import React from 'react';

import { getLanguageSentencesCount } from '@/app/lib/server/api';

import { SentencesPagination } from './sentences-pagination';

export default async function Page({
  params,
}: {
  params: { pair: string; index: string };
}) {
  const index = parseInt(params.index, 10);
  const [source, _] = params.pair.split('-');
  const { count } = await getLanguageSentencesCount(source);

  return <SentencesPagination page={index} total={count} />;
}
