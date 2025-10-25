import React, { type ReactNode } from 'react';

import { Heading } from '@/app/components/heading';

export default async function Layout(
  props: Readonly<{
    children: ReactNode;
    params: Promise<{
      pair: string;
      index: string;
    }>;
  }>
) {
  const params = await props.params;

  const { children } = props;

  const index = parseInt(params.index, 10);

  return (
    <section className="flex flex-col">
      <Heading className="mb-4 w-full border-b border-stone-950/10 pb-2 dark:border-white/10">
        <div className="inline-flex gap-2">
          <span>Sentence</span>
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            #{index}
          </span>
        </div>
      </Heading>
      {children}
    </section>
  );
}
