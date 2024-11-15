'use client';

import React from 'react';

import { SidebarItem } from '@/app/components/sidebar';
import { useLanguageSentence } from '@/app/lib/client/api';

type SentencesSidebarItemProps = {
  baseHref: string;
  current?: boolean;
  index: number;
  language: string;
  style?: React.CSSProperties;
};

export function SentencesSidebarItem({
  baseHref,
  current = false,
  index,
  language,
  style,
}: SentencesSidebarItemProps) {
  let { data: translation, isLoading: loadingTranslation } =
    useLanguageSentence(language, index + 1);

  return (
    <SidebarItem
      key={index}
      aria-label={`Sentence #${index + 1}`}
      style={style}
      href={`${baseHref}/${index + 1}`}
      className="flex w-full font-normal"
      current={current}
    >
      <span className="font-bold">{index + 1}</span>
      {loadingTranslation || !translation?.attributes?.content ? (
        <span className="ml-4 flex w-full animate-pulse gap-x-2">
          <span className="block h-2 w-60 rounded-lg bg-zinc-300" />
        </span>
      ) : (
        <span className="truncate font-normal">
          {translation?.attributes?.content}
        </span>
      )}
    </SidebarItem>
  );
}
