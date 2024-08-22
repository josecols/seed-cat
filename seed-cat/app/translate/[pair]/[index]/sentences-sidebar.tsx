'use client';

import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { SidebarItem } from '@/app/components/sidebar';
import { useIsReview, useLanguageSentences } from '@/app/lib/client/api';

export function SentencesSidebar() {
  const params = useParams<{ pair: string; index: string }>();
  const [source, _] = params.pair.split('-');
  const { data: sentences, isLoading } = useLanguageSentences(source);

  if (!sentences || isLoading) {
    return null;
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <SentencesWindow sentences={sentences} height={height} width={width} />
      )}
    </AutoSizer>
  );
}

type SentencesWindowProps = {
  sentences: string[];
  width: number;
  height: number;
};

function SentencesWindow({ width, height, sentences }: SentencesWindowProps) {
  const isReview = useIsReview();
  const params = useParams<{ pair: string; index: string }>();
  const indexRef = React.useRef<string>(params.index);
  const listRef = React.useRef<FixedSizeList>(null);

  const baseHref = `${isReview ? '/review' : '/translate'}/${params.pair}`;

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
        <SidebarItem
          key={index}
          aria-label={`Sentence #${index + 1}`}
          style={style}
          href={`${baseHref}/${index + 1}`}
          className="flex w-full"
          current={params.index === `${index + 1}`}
        >
          <span className="font-bold">{index + 1}</span>
          <span className="truncate font-normal">{sentences[index]}</span>
        </SidebarItem>
      )}
    </FixedSizeList>
  );
}
