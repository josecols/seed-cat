import React from 'react';

type WordNetSkeletonProps = {
  count: number;
};

export function WordNetSkeleton({ count }: WordNetSkeletonProps) {
  const items = new Array(count).fill(null);

  return items.map((_, index) => (
    <section key={index} className="animate-pulse">
      <div className="h-32 rounded-lg bg-zinc-100" />
    </section>
  ));
}
