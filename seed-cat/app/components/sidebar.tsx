'use client';

import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

import { TouchTarget } from '@/app/components/button';

export function Sidebar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'aside'>) {
  return (
    <aside {...props} className={clsx(className, 'flex h-full flex-col')} />
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'flex flex-col border-b border-stone-950/5 px-2 pb-2'
      )}
    />
  );
}

export function SidebarBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx(className, 'flex flex-1 flex-col')} />;
}

export function SidebarHeading({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      {...props}
      className={clsx(className, 'mb-1 text-xs/6 font-medium text-stone-500')}
    />
  );
}

export const SidebarItem = React.forwardRef(function SidebarItem(
  {
    current,
    className,
    children,
    ...props
  }: { current?: boolean; className?: string; children: React.ReactNode } & (
    | Omit<Headless.ButtonProps, 'className'>
    | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'type' | 'className'>
  ),
  ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
  let classes = clsx(
    // Base
    'flex w-full transition-colors text-stone-950 hover:bg-stone-950/10 active:bg-transparent items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm sm:py-2',
    // Current
    current && 'font-medium bg-blue-600/20 text-blue-600'
  );

  return (
    <span className={clsx(className, 'relative')}>
      {'href' in props ? (
        <Link className={classes} {...props}>
          <TouchTarget>{children}</TouchTarget>
        </Link>
      ) : (
        <Headless.Button
          {...props}
          className={clsx('cursor-default', classes)}
          ref={ref}
        >
          <TouchTarget>{children}</TouchTarget>
        </Headless.Button>
      )}
    </span>
  );
});
