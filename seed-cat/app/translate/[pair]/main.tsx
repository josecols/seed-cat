'use client';

import { clsx } from 'clsx';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarHeading,
} from '@/app/components/sidebar';
import { CookieKey, SENTENCE_RANGE } from '@/app/lib/defaults';
import { SentencesSidebar } from '@/app/translate/[pair]/[index]/sentences-sidebar';
import { Header } from '@/app/translate/[pair]/header';
import { LanguageCreate } from '@/app/translate/[pair]/language-create';
import { TranslationGuidelines } from '@/app/translate/[pair]/translation-guidelines';

export const MainContext = createContext<{
  acceptTranslationGuidelines: () => void;
  acknowledgedGuidelines: boolean;
  enableCloudBackup: boolean;
  sentenceRange: string;
  toggleLanguageCreate: (show?: boolean) => void;
  toggleTranslationGuidelines: (show?: boolean) => void;
}>({
  acceptTranslationGuidelines: () => {},
  acknowledgedGuidelines: false,
  enableCloudBackup: false,
  sentenceRange: SENTENCE_RANGE,
  toggleLanguageCreate: () => {},
  toggleTranslationGuidelines: () => {},
});

type MainProps = React.PropsWithChildren<{
  defaultShowSidebar: boolean;
  enableCloudBackup?: boolean;
  sourceLanguage: string;
  targetLanguage?: string;
}>;

export function Main({
  children,
  defaultShowSidebar,
  enableCloudBackup = false,
  ...props
}: MainProps) {
  const searchParams = useSearchParams();
  const [sentenceRange, setSentenceRange] = useState<string>(SENTENCE_RANGE);
  const [showSidebar, setShowSidebar] = useState(defaultShowSidebar);
  const [showLanguageCreate, setShowLanguageCreate] = useState(false);
  const [showTranslationGuidelines, setShowTranslationGuidelines] =
    useState(false);
  const [acknowledgedGuidelines, setAcknowledgedGuidelines] = useState(true);

  useEffect(() => {
    setAcknowledgedGuidelines(
      Cookies.get(CookieKey.AcknowledgedGuidelines) === '1'
    );
  }, []);

  useEffect(() => {
    if (searchParams.has('target')) {
      setShowLanguageCreate(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const value = Cookies.get(CookieKey.SentenceRange);
    setSentenceRange(value ?? SENTENCE_RANGE);
  }, []);

  function toggleSidebar() {
    setShowSidebar((prev) => {
      const next = !prev;
      Cookies.set(CookieKey.Sidebar, next ? '1' : '0');
      return next;
    });
  }

  function toggleLanguageCreate(show?: boolean) {
    setShowLanguageCreate((prev) => show ?? !prev);
  }

  function toggleTranslationGuidelines(show?: boolean) {
    setShowTranslationGuidelines((prev) => show ?? !prev);
  }

  const acceptTranslationGuidelines = useCallback(() => {
    setAcknowledgedGuidelines(true);
    Cookies.set(CookieKey.AcknowledgedGuidelines, '1', {
      expires: 100,
    });
    setShowTranslationGuidelines(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      acceptTranslationGuidelines,
      acknowledgedGuidelines,
      enableCloudBackup,
      sentenceRange,
      toggleLanguageCreate,
      toggleTranslationGuidelines,
    }),
    [
      acceptTranslationGuidelines,
      acknowledgedGuidelines,
      enableCloudBackup,
      sentenceRange,
    ]
  );

  return (
    <MainContext.Provider value={contextValue}>
      <div className="relative isolate flex min-h-svh w-full flex-col overflow-y-auto overflow-x-clip bg-stone-100 md:overflow-clip">
        <Header
          toggleSidebar={props.targetLanguage ? toggleSidebar : undefined}
          {...props}
        />
        <div className="absolute bottom-0 top-14 flex w-full px-2">
          {props.targetLanguage && (
            <Sidebar
              className={clsx('flex-shrink-0 transition-all', {
                'visible w-full opacity-100 sm:w-80': showSidebar,
                'invisible w-0 opacity-0': !showSidebar,
              })}
            >
              <SidebarHeader>
                <SidebarHeading>Source Sentences</SidebarHeading>
              </SidebarHeader>
              <SidebarBody className="flex-grow">
                <SentencesSidebar />
              </SidebarBody>
            </Sidebar>
          )}
          <main className="flex flex-grow flex-col pb-2">{children}</main>
        </div>
      </div>
      <LanguageCreate
        defaultName={searchParams.get('target') ?? ''}
        onClose={() => setShowLanguageCreate(false)}
        open={showLanguageCreate}
        sentenceRange={sentenceRange}
        sourceLanguage={props.sourceLanguage}
      />
      <TranslationGuidelines
        open={showTranslationGuidelines}
        onClose={() =>
          acknowledgedGuidelines && setShowTranslationGuidelines(false)
        }
        onConfirm={
          acknowledgedGuidelines ? undefined : acceptTranslationGuidelines
        }
      />
    </MainContext.Provider>
  );
}
