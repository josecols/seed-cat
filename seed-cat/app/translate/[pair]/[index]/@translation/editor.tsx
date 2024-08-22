'use client';

import { CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import dynamic from 'next/dynamic';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { mutate } from 'swr';
import { useDebouncedCallback } from 'use-debounce';

import { Badge } from '@/app/components/badge';
import { Button, Spinner } from '@/app/components/button';
import { Heading } from '@/app/components/heading';
import { Textarea } from '@/app/components/input';
import { Text } from '@/app/components/text';
import {
  downloadBackup,
  uploadBackup,
  useIsReview,
  useLanguageSentence,
  useMachineTranslation,
} from '@/app/lib/client/api';
import {
  Activity,
  Agent,
  SeedDB,
  getLatestTranslation,
  getObject,
  saveObject,
} from '@/app/lib/client/db';
import { deserialize } from '@/app/lib/client/prov-json';
import { DiffDialog } from '@/app/translate/[pair]/[index]/@translation/diff-dialog';
import MachineTranslateRemote from '@/app/translate/[pair]/[index]/@translation/mt-remote';
import { ActivityContext } from '@/app/translate/[pair]/[index]/activities';
import { MainContext } from '@/app/translate/[pair]/main';

const DynamicMachineTranslateRemote = dynamic(() => import('./mt-local'), {
  loading: () => (
    <div className="animate-pulse">
      <div className="h-10 w-44 rounded-lg bg-zinc-100" />
    </div>
  ),
});

dayjs.extend(relativeTime);

type EditorProps = {
  index: number;
  localInference: boolean;
  original: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export function Editor({
  index,
  localInference,
  original,
  sourceLanguage,
  targetLanguage,
}: EditorProps) {
  const { endActivity, startActivity } = useContext(ActivityContext);
  const { enableCloudBackup } = useContext(MainContext);

  const emptyTranslationRef = useRef<boolean>(true);
  const mtActivityRef = useRef<SeedDB['activities']['key']>();
  const editStartRef = useRef<number>();
  const diffActivityRef = useRef<SeedDB['activities']['key']>();

  const isReview = useIsReview();

  const [diffAlert, setDiffAlert] = useState(false);
  const [importingTranslation, setImportingTranslation] = useState(true);
  const [loadingMachineTranslation, setLoadingMachineTranslation] =
    useState(false);
  const [loadingMarkAsDone, setLoadingMarkAsDone] = useState(false);

  const { data: storedTranslation, isLoading: loadingTranslation } =
    useLanguageSentence(targetLanguage, index);
  const [translation, setTranslation] = useState<string>(
    storedTranslation?.attributes.content ?? ''
  );
  const { data: storedMachineTranslation } = useMachineTranslation(
    targetLanguage,
    index
  );
  const [machineTranslation, setMachineTranslation] = useState<string>(
    storedMachineTranslation?.attributes.content ?? ''
  );

  useEffect(() => {
    if (storedTranslation?.attributes.content) {
      setTranslation(storedTranslation.attributes.content);
    }
  }, [storedTranslation]);

  useEffect(() => {
    if (storedMachineTranslation?.attributes.content) {
      setMachineTranslation(storedMachineTranslation.attributes.content);
    }
  }, [storedMachineTranslation]);

  const reviseTranslation = useCallback(
    async (
      text: string,
      activityKey: SeedDB['activities']['key'],
      completedAtTime?: number,
      wasQuotedFrom?: SeedDB['translations']['value']['wasQuotedFrom']
    ) => {
      const now = Date.now();
      const currentTranslation = await getLatestTranslation(
        targetLanguage,
        index
      );

      if (currentTranslation && !currentTranslation.invalidatedAtTime) {
        await saveObject('translations', {
          ...currentTranslation,
          invalidatedAtTime: now,
          wasInvalidatedBy: activityKey,
        });
      }

      if (text.length) {
        const content = text.replace(/\n/g, ' ').trim();
        await saveObject('translations', {
          attributes: {
            completedAtTime,
            content,
            index,
            targetLanguage,
          },
          invalidatedAtTime: 0, // Not invalidated.
          generatedAtTime: now,
          wasGeneratedBy: activityKey,
          wasQuotedFrom,
          wasRevisionOf:
            currentTranslation && !wasQuotedFrom
              ? [targetLanguage, index, currentTranslation.generatedAtTime]
              : undefined,
        });
        await mutate(`/${targetLanguage}/${index}`);
      }
    },
    [index, targetLanguage]
  );

  const saveMachineTranslation = useCallback(
    async (text: string, activityKey: SeedDB['activities']['key']) => {
      const machineTranslation = await getObject('machine_translations', [
        targetLanguage,
        index,
      ]);
      if (activityKey && !machineTranslation) {
        await saveObject('machine_translations', {
          wasGeneratedBy: activityKey,
          generatedAtTime: Date.now(),
          attributes: {
            content: text,
            index: index,
            targetLanguage: targetLanguage,
          },
        });
        await mutate(`/machine-translations/${targetLanguage}/${index}`);
      }
    },
    [index, targetLanguage]
  );

  const openDiff = useCallback(async () => {
    setDiffAlert(true);
    diffActivityRef.current = await startActivity(
      Activity.CompareMachineTranslation
    );
  }, [startActivity]);

  const importTranslationForReview = useDebouncedCallback(async () => {
    if (isReview) {
      setImportingTranslation(true);

      const translation = await getLatestTranslation(targetLanguage, index);
      if (!translation) {
        const provJson = await downloadBackup(targetLanguage, index);
        await deserialize(provJson);
        await mutate(`/${targetLanguage}/${index}`);
        await mutate(`/${targetLanguage}/completed/count`);
      }
    }

    setImportingTranslation(false);
  }, 10);

  useEffect(() => {
    importTranslationForReview();
  }, [importTranslationForReview]);

  const handleBlur = useDebouncedCallback(async () => {
    if (
      editStartRef.current &&
      translation !== storedTranslation?.attributes.content
    ) {
      const activity = await startActivity(Activity.EditTranslation, {
        startedAtTime: editStartRef.current,
      });
      if (!activity) {
        return;
      }

      await reviseTranslation(translation, activity);
      await endActivity(Activity.EditTranslation);

      if (enableCloudBackup) {
        await uploadBackup(sourceLanguage, targetLanguage, index);
      }

      editStartRef.current = 0;
    }
  }, 100);

  function handleFocus() {
    editStartRef.current = Date.now();
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setTranslation(event.target.value);
  }

  async function closeDiff() {
    setDiffAlert(false);
    await endActivity(Activity.CompareMachineTranslation);
    diffActivityRef.current = undefined;
  }

  async function confirmDiff() {
    setDiffAlert(false);

    if (machineTranslation) {
      setTranslation(machineTranslation);
      await overwriteWithMachineTranslation(
        Activity.CompareMachineTranslation,
        machineTranslation
      );
    }

    await endActivity(Activity.CompareMachineTranslation);
    diffActivityRef.current = undefined;
  }

  async function receiveMachineTranslation(text: string) {
    if (
      !translation.length ||
      (localInference && emptyTranslationRef.current)
    ) {
      setTranslation(text);
      await overwriteWithMachineTranslation(Activity.MachineTranslate, text);
      mtActivityRef.current = undefined;
    } else {
      await openDiff();
    }
  }

  async function overwriteWithMachineTranslation(
    activityType:
      | Activity.MachineTranslate
      | Activity.CompareMachineTranslation,
    text: string
  ) {
    const activityKey =
      activityType === Activity.MachineTranslate
        ? mtActivityRef.current
        : diffActivityRef.current;

    if (activityKey && text) {
      await reviseTranslation(
        text,
        activityKey,
        undefined,
        `seed:machine_translations/${targetLanguage}/${index}`
      );
    }
  }

  async function markAsDone() {
    const startedAtTime = editStartRef.current || Date.now();
    editStartRef.current = 0;

    const activityKey = await startActivity(Activity.EditTranslation, {
      startedAtTime,
    });

    if (activityKey) {
      setLoadingMarkAsDone(true);
      await reviseTranslation(translation, activityKey, Date.now());
      await endActivity(Activity.EditTranslation);
      await mutate(`/${targetLanguage}/completed/count`);

      if (enableCloudBackup) {
        await uploadBackup(sourceLanguage, targetLanguage, index);
      }

      setLoadingMarkAsDone(false);
    }
  }

  async function reopen() {
    if (storedTranslation && !storedTranslation.readonly) {
      await saveObject('translations', {
        ...storedTranslation,
        attributes: {
          ...storedTranslation.attributes,
          completedAtTime: 0,
        },
      });

      await mutate(`/${targetLanguage}/${index}`);
      await mutate(`/${targetLanguage}/completed/count`);
    }
  }

  async function machineTranslate() {
    if (machineTranslation) {
      await receiveMachineTranslation(machineTranslation);
      return false;
    }

    emptyTranslationRef.current = !translation.length;
    setLoadingMachineTranslation(true);
    mtActivityRef.current = await startActivity(Activity.MachineTranslate, {
      wasAssociatedWith: localInference
        ? Agent.NLLBTranslatorWorker
        : Agent.NLLBTranslatorHG,
    });

    return true;
  }

  function machineTranslateProgress(text: string) {
    setMachineTranslation(text);
    if (emptyTranslationRef.current) {
      setTranslation(text);
    }
  }

  async function machineTranslateComplete(text?: string) {
    if (text && mtActivityRef.current) {
      await saveMachineTranslation(text, mtActivityRef.current);
    }

    await endActivity(Activity.MachineTranslate);

    if (text) {
      await receiveMachineTranslation(text);
    }

    setLoadingMachineTranslation(false);
  }

  if (loadingTranslation || importingTranslation) {
    return (
      <>
        <EditorHeader storedTranslation={storedTranslation} />
        <section className="animate-pulse">
          <div className="h-32 w-full rounded-lg bg-zinc-100" />
        </section>
      </>
    );
  }

  return (
    <>
      <EditorHeader storedTranslation={storedTranslation} />

      {storedTranslation?.readonly ||
      storedTranslation?.attributes.completedAtTime ? (
        <Text>{translation}</Text>
      ) : (
        <Textarea
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={loadingMachineTranslation}
          rows={4}
          value={translation}
          aria-label={`Translation input for sentence ${index}`}
        />
      )}

      {!storedTranslation?.readonly &&
      storedTranslation?.attributes.completedAtTime ? (
        <div className="flex justify-end">
          {loadingMarkAsDone ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Saving</span>
              <Spinner />
            </span>
          ) : (
            <Button outline onClick={reopen}>
              <PencilSquareIcon />
              Reopen
            </Button>
          )}
        </div>
      ) : null}

      {!storedTranslation?.readonly &&
        !storedTranslation?.attributes.completedAtTime && (
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            {localInference ? (
              <DynamicMachineTranslateRemote
                loading={loadingMachineTranslation}
                onChange={machineTranslateProgress}
                onComplete={machineTranslateComplete}
                onStart={machineTranslate}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                text={original}
                translation={machineTranslation}
              />
            ) : (
              <MachineTranslateRemote
                loading={loadingMachineTranslation}
                onComplete={machineTranslateComplete}
                onStart={machineTranslate}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                text={original}
                translation={machineTranslation}
              />
            )}
            <Button
              color="green"
              disabled={!translation.length}
              onClick={markAsDone}
            >
              <CheckCircleIcon />
              Mark as Done
            </Button>
          </div>
        )}

      <DiffDialog
        diffType={getDiffType(targetLanguage)}
        manualTranslation={translation}
        modelTranslation={machineTranslation ?? ''}
        onClose={closeDiff}
        open={diffAlert}
        original={original}
        onConfirm={confirmDiff}
      />
    </>
  );
}

type EditorHeaderProps = {
  storedTranslation?: ReturnType<typeof useLanguageSentence>['data'];
};

function EditorHeader({ storedTranslation }: EditorHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-stone-950/10 pb-2">
      <Heading>Translation</Heading>
      <span className="flex-1" />
      {!storedTranslation?.readonly ? (
        <>
          {storedTranslation?.generatedAtTime ? (
            <span className="hidden text-xs text-zinc-500 md:block">
              Saved {dayjs(storedTranslation.generatedAtTime).fromNow()}
            </span>
          ) : null}
          {storedTranslation?.attributes.completedAtTime ? (
            <Badge color="green">
              <CheckCircleIcon width={16} />
              Done
            </Badge>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function getDiffType(language: string): 'diffChars' | 'diffWords' {
  const suffix = language.split('_').at(-1);
  return suffix === 'Latn' ? 'diffWords' : 'diffChars';
}
