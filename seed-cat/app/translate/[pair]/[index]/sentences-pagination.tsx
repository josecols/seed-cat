'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import {
  Pagination,
  PaginationGap,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from '@/app/components/pagination';

type SentencesPaginationProps = {
  page: number;
  total: number;
};

export function SentencesPagination({ page, total }: SentencesPaginationProps) {
  const pathname = usePathname();
  const baseHref = pathname.split('/').slice(1, 3).join('/');

  const nextPath = `/${baseHref}/${Math.min(total, page + 1)}`;
  const previousPath = `/${baseHref}/${Math.max(1, page - 1)}`;

  function generatePaginationItems() {
    const items = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(total, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationPage key={i} href={`/${baseHref}/${i}`} current={i === page}>
          {i}
        </PaginationPage>
      );
    }

    return items;
  }

  return (
    <Pagination>
      <PaginationPrevious href={page > 1 ? previousPath : null} />
      <PaginationList>
        {page > 3 && (
          <>
            <PaginationPage href={`/${baseHref}/1`}>1</PaginationPage>
            {page > 4 && <PaginationGap />}
          </>
        )}
        {generatePaginationItems()}
        {page < total - 2 && (
          <>
            {page < total - 3 && <PaginationGap />}
            <PaginationPage href={`/${baseHref}/${total}`}>
              {total}
            </PaginationPage>
          </>
        )}
      </PaginationList>
      <PaginationNext href={page < total ? nextPath : null} />
    </Pagination>
  );
}
