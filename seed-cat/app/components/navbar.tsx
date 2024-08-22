'use client';

import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

import { TouchTarget } from '@/app/components/button';

export function Navbar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav
      {...props}
      className={clsx(
        className,
        'relative flex flex-1 items-center gap-4 py-2.5'
      )}
    />
  );
}

export function NavbarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={clsx(className, 'h-6 w-px bg-stone-950/10')}
    />
  );
}

export function NavbarSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} className={clsx(className, 'flex items-center gap-2')} />
  );
}

export function NavbarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={clsx(className, '-ml-4 flex-1')}
    />
  );
}

export const NavbarItem = React.forwardRef(function NavbarItem(
  {
    current,
    className,
    children,
    ...props
  }: { current?: boolean; className?: string; children: React.ReactNode } & (
    | Omit<Headless.ButtonProps, 'className'>
    | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>
  ),
  ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
  const classes = clsx(
    // Base
    'relative flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-stone-950 sm:text-sm/5',
    // Leading icon/icon-only
    'data-[slot=icon]:*:size-6 data-[slot=icon]:*:shrink-0 sm:data-[slot=icon]:*:size-5',
    // Trailing icon (down chevron or similar)
    'data-[slot=icon]:last:[&:not(:nth-child(2))]:*:ml-auto data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-5 sm:data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-4',
    // Avatar
    'data-[slot=avatar]:*:-m-0.5 data-[slot=avatar]:*:size-7 data-[slot=avatar]:*:[--avatar-radius:theme(borderRadius.DEFAULT)] data-[slot=avatar]:*:[--ring-opacity:10%] sm:data-[slot=avatar]:*:size-6',
    // Hover
    'hover:bg-stone-950/5',
    // Active
    'active:bg-stone-950/5'
  );

  return (
    <span className={clsx(className, 'relative')}>
      {'href' in props ? (
        <Link
          {...props}
          className={clsx(classes, {
            'bg-stone-950/5': current,
          })}
          data-current={current ? 'true' : undefined}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        >
          <TouchTarget>{children}</TouchTarget>
        </Link>
      ) : (
        <Headless.Button
          {...props}
          className={classes}
          data-current={current ? 'true' : undefined}
          ref={ref}
        >
          <TouchTarget>{children}</TouchTarget>
        </Headless.Button>
      )}
    </span>
  );
});
