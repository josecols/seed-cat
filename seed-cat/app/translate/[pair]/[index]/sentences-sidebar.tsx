'use client';

import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { useIsReview } from '@/app/lib/client/api';
import { DATASET_SIZE } from '@/app/lib/defaults';
import { SentencesSidebarItem } from '@/app/translate/[pair]/[index]/sentences-sidebar-item';

export function SentencesSidebar() {
  return (
    <AutoSizer>
      {({ height, width }) => <SentencesWindow height={height} width={width} />}
    </AutoSizer>
  );
}

type SentencesWindowProps = {
  width: number;
  height: number;
};

function SentencesWindow({ width, height }: SentencesWindowProps) {
  const isReview = useIsReview();
  const params = useParams<{ pair: string; index: string }>();
  const indexRef = React.useRef<string>(params.index);
  const listRef = React.useRef<FixedSizeList>(null);
  const sentences = new Array(DATASET_SIZE).fill(null);
  const baseHref = `${isReview ? '/review' : '/translate'}/${params.pair}`;
  const [sourceLanguage, _] = params.pair.split('-');

  useEffect(() => {
    if (listRef.current && indexRef.current) {
      listRef.current.scrollToItem(parseInt(indexRef.current, 10) - 1, 'start');
    }
  }, []);

  return (
    <FixedSizeList
      className="pr-2"
      height={height}
      itemCount={sentences.length}
      itemSize={44}
      ref={listRef}
      width={width}
    >
      {({ index, style }) => (
        <SentencesSidebarItem
          key={index}
          baseHref={baseHref}
          current={params.index === `${index + 1}`}
          index={index}
          language={sourceLanguage}
          style={style}
        />
      )}
    </FixedSizeList>
  );
}
