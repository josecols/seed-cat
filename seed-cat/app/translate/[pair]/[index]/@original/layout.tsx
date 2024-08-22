import React, { type ReactNode } from 'react';

import { Heading } from '@/app/components/heading';

export default function Layout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: {
    pair: string;
    index: string;
  };
}>) {
  const index = parseInt(params.index, 10);

  return (
    <section className="flex flex-col">
      <Heading className="mb-4 w-full border-b border-stone-950/10 pb-2">
        <div className="inline-flex gap-2">
          <span>Sentence</span>
          <span className="font-normal text-zinc-500">#{index}</span>
        </div>
      </Heading>
      {children}
    </section>
  );
}
