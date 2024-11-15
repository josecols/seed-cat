import React from 'react';

import { SentencesPagination } from './sentences-pagination';
import { DATASET_SIZE } from '@/app/lib/defaults';

export default function Page({
  params,
}: {
  params: { pair: string; index: string };
}) {
  const index = parseInt(params.index, 10);
  const [source, _] = params.pair.split('-');

  return <SentencesPagination page={index} total={DATASET_SIZE} />;
}
