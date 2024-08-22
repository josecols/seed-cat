import type { DataRecord } from 'natural/lib/natural/wordnet';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';

import {
  SeedDB,
  getDB,
  getLatestTranslation,
  getObject,
} from '@/app/lib/client/db';
import { ProvJson, serialize } from '@/app/lib/client/prov-json';

const defaultSwrRevalidateOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

async function apiFetcher<T>(resource: string): Promise<T> {
  const res = await fetch(`/api${resource}`);
  return (await res.json()) as T;
}

type Sentence =
  | {
      attributes: {
        content: string;
      };
      readonly: true;
    }
  | (SeedDB['translations']['value'] & { readonly: false });

async function sentenceFetcherResolver(
  resource: string
): Promise<Sentence | undefined> {
  const [language, index] = resource.split('/').slice(1);
  const isLocalLanguage = Boolean(
    await getObject('target_languages', language)
  );

  async function getFromApi() {
    const { text } = await apiFetcher<{ text: string }>(`/oldi${resource}`);
    return { attributes: { content: text }, readonly: true as const };
  }

  async function getFromDb() {
    const data = await getLatestTranslation(language, parseInt(index, 10));

    if (!data) {
      return undefined;
    }

    return {
      ...data,
      readonly: false as const,
    };
  }

  return isLocalLanguage ? getFromDb() : getFromApi();
}

export function useLanguageList() {
  return useSWR(
    '/oldi/languages',
    apiFetcher<{ name: string }[]>,
    defaultSwrRevalidateOptions
  );
}

export function useLanguageSentences(language: string) {
  return useSWR(
    `/oldi/${language}`,
    apiFetcher<string[]>,
    defaultSwrRevalidateOptions
  );
}

export function useLanguageSentencesCount(language: string) {
  return useSWR(
    `/oldi/${language}/count`,
    apiFetcher<{ count: number }>,
    defaultSwrRevalidateOptions
  );
}

export function useLanguageSentence(language: string, index: number) {
  return useSWR(
    `/${language}/${index}`,
    sentenceFetcherResolver,
    defaultSwrRevalidateOptions
  );
}

export function useMachineTranslation(targetLanguage: string, index: number) {
  return useSWR(
    `/machine-translations/${targetLanguage}/${index}`,
    async () => {
      return await getObject('machine_translations', [targetLanguage, index]);
    },
    defaultSwrRevalidateOptions
  );
}

export function useWordNet(term: string) {
  return useSWR(
    `/wordnet?term=${term}`,
    apiFetcher<DataRecord[]>,
    defaultSwrRevalidateOptions
  );
}

export function useCompletedTranslationsCount(targetLanguage?: string) {
  return useSWR(
    targetLanguage ? `/${targetLanguage}/completed/count` : null,
    async () => {
      const db = await getDB();
      const range = IDBKeyRange.bound(
        [0, targetLanguage, 0],
        [0, targetLanguage, Infinity]
      );
      return {
        count: await db.countFromIndex('translations', 'byCompleted', range),
      };
    },
    defaultSwrRevalidateOptions
  );
}

export function useIsReview() {
  const pathname = usePathname();
  return pathname.includes('review/');
}

export async function machineTranslateSentence(
  source: string,
  target: string,
  query: string
): Promise<{ translation: string }> {
  const res = await fetch('/api/translation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target, query }),
  });

  return res.json();
}

export async function uploadBackup(
  sourceLanguage: string,
  targetLanguage: string,
  index: number
) {
  async function uploadFile(type: string, content: string) {
    const res = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type, language: targetLanguage, index }),
    });
    return res.json();
  }

  const currentTranslation = await getLatestTranslation(targetLanguage, index);
  if (!currentTranslation || !currentTranslation.attributes.content) {
    return;
  }

  const prov = await serialize(sourceLanguage, targetLanguage, index, true);

  return Promise.all([
    uploadFile('prov', JSON.stringify(prov)),
    uploadFile('translation', currentTranslation.attributes.content),
  ]);
}

export async function downloadBackup(targetLanguage: string, index: number) {
  const searchParams = new URLSearchParams({
    type: 'prov',
    language: targetLanguage,
    index: index.toString(),
  });
  const res = await fetch(`/api/storage?${searchParams.toString()}`);

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as ProvJson;
}

export async function getProvDiagram(
  sourceLanguage: string,
  targetLanguage: string,
  index: number
) {
  const prov = await serialize(sourceLanguage, targetLanguage, index);
  const res = await fetch('/graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prov }),
  });

  if (!res.ok) {
    return null;
  }

  return res.blob();
}
