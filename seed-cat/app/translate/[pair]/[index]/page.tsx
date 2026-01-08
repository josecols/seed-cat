import React from 'react';

import { SentencesPagination } from './sentences-pagination';
import { DATASET_SIZE } from '@/app/lib/defaults';

export default async function Page(props: {
  params: Promise<{ pair: string; index: string }>;
}) {
  const params = await props.params;
  const index = parseInt(params.index, 10);
  const [source, _] = params.pair.split('-');

  return <SentencesPagination page={index} total={DATASET_SIZE} />;
}
