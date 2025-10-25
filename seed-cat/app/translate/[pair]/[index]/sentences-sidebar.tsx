'use client';

import { useParams } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { List, ListImperativeAPI } from 'react-window';
import useSWRInfinite from 'swr/infinite';

import {
  defaultSwrRevalidateOptions,
  fetchLanguageSentences,
  type SentenceSummary,
  useIsReview,
} from '@/app/lib/client/api';
import { DATASET_SIZE } from '@/app/lib/defaults';
import { SentencesSidebarItem } from '@/app/translate/[pair]/[index]/sentences-sidebar-item';

const BATCH_SIZE = 50;
const ITEM_HEIGHT = 48;
const MAX_BATCH_INDEX = Math.ceil(DATASET_SIZE / BATCH_SIZE) - 1;
const EMPTY_BATCHES = new Set<number>();

type SentenceBatchKey = readonly ['language-sentences', string, number, number];

type RowProps = {
  baseHref: string;
  currentItemIndex: number;
  sentencesMap: Map<number, SentenceSummary>;
  loadingBatches: Set<number>;
};

type RowRenderProps = RowProps & {
  index: number;
  style: React.CSSProperties;
};

type RowRange = { startIndex: number; stopIndex: number };

function SentencesSidebarRow({
  index,
  style,
  baseHref,
  currentItemIndex,
  sentencesMap,
  loadingBatches,
}: RowRenderProps) {
  const batch = Math.floor(index / BATCH_SIZE);
  const sentence = sentencesMap.get(index);

  return (
    <SentencesSidebarItem
      baseHref={baseHref}
      current={index + 1 === currentItemIndex}
      index={index}
      sentence={sentence}
      isLoading={loadingBatches.has(batch)}
      style={style}
    />
  );
}

async function fetchSentenceBatch([
  ,
  language,
  offset,
  limit,
]: SentenceBatchKey): Promise<SentenceSummary[]> {
  return fetchLanguageSentences(language, offset, limit);
}

export function SentencesSidebar() {
  const params = useParams<{ pair: string; index: string }>();
  const isReview = useIsReview();
  const listRef = useRef<ListImperativeAPI>(null);

  const pair = params.pair ?? '';
  const [sourceLanguage] = pair.split('-');
  const parsedIndex = Number.parseInt(params.index ?? '1', 10);
  const safeIndex = Number.isFinite(parsedIndex) ? parsedIndex : 1;
  const clampedIndex = Math.min(Math.max(safeIndex, 1), DATASET_SIZE);
  const currentRowIndex = clampedIndex - 1;
  const initialBatch = Math.min(
    MAX_BATCH_INDEX,
    Math.max(0, Math.floor(currentRowIndex / BATCH_SIZE))
  );

  const baseHref = `${isReview ? '/review' : '/translate'}/${pair}`;

  const [batchesByLanguage, setBatchesByLanguage] = useState<
    Map<string, Set<number>>
  >(() => new Map());
  const languageKey = sourceLanguage || 'unknown';
  const extraBatches = batchesByLanguage.get(languageKey) ?? EMPTY_BATCHES;
  const requestedBatches = useMemo(() => {
    const next = new Set(extraBatches);
    next.add(initialBatch);
    return next;
  }, [extraBatches, initialBatch]);
  const batches = useMemo(
    () => Array.from(requestedBatches),
    [requestedBatches]
  );

  const getKey = useCallback(
    (pageIndex: number): SentenceBatchKey | null => {
      if (!sourceLanguage) {
        return null;
      }
      const batchIndex = batches[pageIndex];
      if (batchIndex === undefined) {
        return null;
      }
      const offset = batchIndex * BATCH_SIZE;
      return ['language-sentences', sourceLanguage, offset, BATCH_SIZE];
    },
    [batches, sourceLanguage]
  );

  const { data, setSize } = useSWRInfinite<SentenceSummary[]>(
    getKey,
    fetchSentenceBatch,
    defaultSwrRevalidateOptions
  );

  useEffect(() => {
    setSize(batches.length);
  }, [batches.length, setSize]);

  const sentencesMap = useMemo(() => {
    const map = new Map<number, SentenceSummary>();
    if (!data) {
      return map;
    }
    data.forEach((sentences) => {
      if (!sentences) {
        return;
      }
      sentences.forEach((sentence) => {
        map.set(sentence.id, sentence);
      });
    });
    return map;
  }, [data]);

  const loadingBatches = useMemo(() => {
    const loading = new Set<number>();
    if (!data) {
      batches.forEach((batch) => loading.add(batch));
      return loading;
    }
    batches.forEach((batch, index) => {
      if (!data[index]) {
        loading.add(batch);
      }
    });
    return loading;
  }, [batches, data]);

  const handleRowsRendered = (visibleRows: RowRange, allRows?: RowRange) => {
    if (!sourceLanguage) {
      return;
    }
    const startIndex = allRows?.startIndex ?? visibleRows.startIndex;
    const stopIndex = allRows?.stopIndex ?? visibleRows.stopIndex;
    const startBatch = Math.floor(startIndex / BATCH_SIZE);
    const endBatch = Math.floor(stopIndex / BATCH_SIZE);

    setBatchesByLanguage((prev) => {
      const next = new Map(prev);
      const existing = next.get(languageKey) ?? new Set<number>();
      const updated = new Set(existing);
      const minBatch = Math.max(0, startBatch - 1);
      const maxBatch = Math.min(MAX_BATCH_INDEX, endBatch + 1);
      let changed = false;

      for (let i = minBatch; i <= maxBatch; i += 1) {
        if (!updated.has(i)) {
          updated.add(i);
          changed = true;
        }
      }

      if (!changed) {
        return prev;
      }
      next.set(languageKey, updated);
      return next;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!listRef.current) {
        return;
      }
      try {
        if (currentRowIndex >= 0 && currentRowIndex < DATASET_SIZE) {
          listRef.current.scrollToRow({
            index: currentRowIndex,
            align: 'center',
          });
        }
      } catch (error) {
        console.warn('Unable to scroll to row:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentRowIndex]);

  const rowProps = useMemo<RowProps>(
    () => ({
      baseHref,
      currentItemIndex: clampedIndex,
      sentencesMap,
      loadingBatches,
    }),
    [baseHref, clampedIndex, sentencesMap, loadingBatches]
  );

  return (
    <div className="h-full">
      <List<RowProps>
        listRef={listRef}
        defaultHeight={typeof window !== 'undefined' ? window.innerHeight : 800}
        rowCount={DATASET_SIZE}
        rowHeight={ITEM_HEIGHT}
        onRowsRendered={handleRowsRendered}
        className="scrollbar-thin"
        rowComponent={SentencesSidebarRow}
        rowProps={rowProps}
      />
    </div>
  );
}
