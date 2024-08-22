import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type React from 'react';

import { Button } from './button';

export function Pagination({
  'aria-label': ariaLabel = 'Page navigation',
  className,
  ...props
}: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav
      aria-label={ariaLabel}
      {...props}
      className={clsx(className, 'flex gap-x-2')}
    />
  );
}

export function PaginationPrevious({
  href = null,
  className,
  children = 'Previous',
}: React.PropsWithChildren<{ href?: string | null; className?: string }>) {
  return (
    <span className={clsx(className, 'grow basis-0')}>
      <Button
        {...(href === null ? { disabled: true } : { href })}
        plain
        aria-label="Previous page"
        className="transition-colors hover:bg-zinc-700/5"
      >
        <ArrowLongLeftIcon />
        {children}
      </Button>
    </span>
  );
}

export function PaginationNext({
  href = null,
  className,
  children = 'Next',
}: React.PropsWithChildren<{ href?: string | null; className?: string }>) {
  return (
    <span className={clsx(className, 'flex grow basis-0 justify-end')}>
      <Button
        {...(href === null ? { disabled: true } : { href })}
        plain
        aria-label="Next page"
        className="transition-colors hover:bg-zinc-700/5"
      >
        {children}
        <ArrowLongRightIcon />
      </Button>
    </span>
  );
}

export function PaginationList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(className, 'hidden items-baseline gap-x-2 sm:flex')}
    />
  );
}

export function PaginationPage({
  href,
  className,
  current = false,
  children,
}: React.PropsWithChildren<{
  href: string;
  className?: string;
  current?: boolean;
}>) {
  return (
    <Button
      href={href}
      plain
      aria-label={`Page ${children}`}
      aria-current={current ? 'page' : undefined}
      className={clsx(
        className,
        'min-w-[2.25rem] transition-colors before:absolute before:-inset-px before:rounded-lg hover:bg-zinc-700/5',
        current && 'before:bg-zinc-950/5'
      )}
    >
      <span className="-mx-0.5">{children}</span>
    </Button>
  );
}

export function PaginationGap({
  className,
  children = <>&hellip;</>,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      aria-hidden="true"
      {...props}
      className={clsx(
        className,
        'w-[2.25rem] select-none text-center text-sm/6 font-semibold text-zinc-950'
      )}
    >
      {children}
    </span>
  );
}
