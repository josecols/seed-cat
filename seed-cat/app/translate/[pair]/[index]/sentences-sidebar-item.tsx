'use client';

import React from 'react';

import { SidebarItem } from '@/app/components/sidebar';

type SentencesSidebarItemProps = {
  baseHref: string;
  current?: boolean;
  index: number;
  sentence?: { text: string };
  isLoading?: boolean;
  style?: React.CSSProperties;
};

export function SentencesSidebarItem({
  baseHref,
  current = false,
  index,
  sentence,
  isLoading = false,
  style,
}: SentencesSidebarItemProps) {
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
      {isLoading || !sentence?.text ? (
        <span className="ml-4 flex w-full animate-pulse gap-x-2">
          <span className="block h-2 w-60 rounded-lg bg-zinc-300 dark:bg-zinc-700" />
        </span>
      ) : (
        <span className="truncate font-normal">{sentence.text}</span>
      )}
    </SidebarItem>
  );
}
