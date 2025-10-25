'use client';

import Cookies from 'js-cookie';
import React, { ReactNode, useContext, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useDebouncedCallback } from 'use-debounce';

import { CookieKey } from '@/app/lib/defaults';
import { ActivityProvider } from '@/app/translate/[pair]/[index]/activities';
import { MainContext } from '@/app/translate/[pair]/main';

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
      <div className="flex grow flex-col gap-6 rounded-lg bg-white p-4 pb-2 ring-1 ring-stone-950/5 lg:p-6 lg:pb-2 lg:shadow-sm dark:bg-zinc-900 dark:ring-white/10">
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
  const isMd = true;

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
          <span className="hidden h-20 w-1 rounded bg-stone-200 transition-colors group-hover:bg-stone-300 group-[[data-resize-handle-active]]:bg-blue-500 hover:bg-stone-300 md:block dark:bg-white/10 dark:group-hover:bg-white/20 dark:group-[[data-resize-handle-active]]:bg-blue-400 dark:hover:bg-white/20" />
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
