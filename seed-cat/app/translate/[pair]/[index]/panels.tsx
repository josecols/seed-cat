'use client';

import tailwindConfig from '@/tailwind.config';
import Cookies from 'js-cookie';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import resolveConfig from 'tailwindcss/resolveConfig';
import { useDebouncedCallback } from 'use-debounce';

import { CookieKey } from '@/app/lib/defaults';
import { ActivityProvider } from '@/app/translate/[pair]/[index]/activities';
import { MainContext } from '@/app/translate/[pair]/main';

const { theme } = resolveConfig(tailwindConfig);

type Breakpoint = keyof typeof theme.screens;

type PanelsProps = {
  children: ReactNode;
  defaultLayout?: [number, number];
  index: string;
  languagePair: string;
  primary: ReactNode;
  secondary: ReactNode;
};

export function Panels({
  children,
  defaultLayout,
  index,
  languagePair,
  primary,
  secondary,
}: PanelsProps) {
  const { acknowledgedGuidelines, toggleTranslationGuidelines } =
    useContext(MainContext);

  useEffect(() => {
    if (!acknowledgedGuidelines && toggleTranslationGuidelines) {
      toggleTranslationGuidelines(true);
    }
  }, [acknowledgedGuidelines, toggleTranslationGuidelines]);

  return (
    <ActivityProvider languagePair={languagePair} index={parseInt(index, 10)}>
      <div className="flex grow flex-col gap-6 rounded-lg bg-white p-4 pb-2 ring-1 ring-stone-950/5 lg:p-6 lg:pb-2 lg:shadow-sm">
        <PanelLayout
          primary={primary}
          secondary={secondary}
          defaultLayout={defaultLayout}
        >
          {children}
        </PanelLayout>
      </div>
    </ActivityProvider>
  );
}

function PanelLayout({
  primary,
  secondary,
  defaultLayout,
  children,
}: Pick<PanelsProps, 'primary' | 'secondary' | 'defaultLayout' | 'children'>) {
  const isMd = useBreakpoint('md');

  return (
    <>
      {isMd ? (
        <HorizontalLayout
          primary={primary}
          secondary={secondary}
          defaultLayout={defaultLayout}
        />
      ) : (
        <VerticalLayout primary={primary} secondary={secondary} />
      )}
      {children}
    </>
  );
}

function HorizontalLayout({
  primary,
  secondary,
  defaultLayout = [50, 50],
}: Pick<PanelsProps, 'primary' | 'secondary' | 'defaultLayout'>) {
  const handleLayout = useDebouncedCallback((sizes: number[]) => {
    Cookies.set(CookieKey.PanelLayout, JSON.stringify(sizes));
  }, 100);

  return (
    <div className="grow">
      <PanelGroup
        className="gap-2"
        direction="horizontal"
        onLayout={handleLayout}
      >
        <Panel
          collapsible
          minSize={25}
          defaultSize={defaultLayout[0]}
          order={1}
        >
          {primary}
        </Panel>
        <PanelResizeHandle className="group flex flex-col justify-center rounded px-4 py-4 transition-colors duration-200 ease-linear">
          <span className="hidden h-20 w-1 rounded bg-stone-200 transition-colors hover:bg-stone-300 group-hover:bg-stone-300 group-[[data-resize-handle-active]]:bg-blue-500 md:block" />
        </PanelResizeHandle>
        <Panel
          collapsible
          minSize={25}
          defaultSize={defaultLayout[1]}
          order={2}
        >
          {secondary}
        </Panel>
      </PanelGroup>
    </div>
  );
}

function VerticalLayout({
  primary,
  secondary,
}: Pick<PanelsProps, 'primary' | 'secondary'>) {
  return (
    <>
      {primary}
      {secondary}
      <div className="flex-grow" />
    </>
  );
}

function useBreakpoint(targetBreakpoint: Breakpoint): boolean {
  const [isBreakpoint, setIsBreakpoint] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${theme.screens[targetBreakpoint]})`
    );
    const handleChange = (e: MediaQueryListEvent) => {
      setIsBreakpoint(e.matches);
    };

    setIsBreakpoint(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [targetBreakpoint]);

  return isBreakpoint;
}
