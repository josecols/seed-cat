'use client';

import * as Headless from '@headlessui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { BadgeButton } from '@/app/components/badge';
import { Divider } from '@/app/components/divider';
import { Label } from '@/app/components/fieldset';
import { Switch } from '@/app/components/switch';
import { Text } from '@/app/components/text';
import { useIsReview } from '@/app/lib/client/api';
import { Activity, getObject, saveObject } from '@/app/lib/client/db';
import { getPOSTagColor } from '@/app/lib/utils';
import { Metadata } from '@/app/translate/[pair]/[index]/@original/metadata';
import { WordNetDialog } from '@/app/translate/[pair]/[index]/@original/wordnet-dialog';
import { ActivityContext } from '@/app/translate/[pair]/[index]/activities';

type SentenceProps = {
  index: number;
  language: string;
  renderTimestamp: number;
  sentence: {
    tags: [string, string][];
    text: string;
    source: string;
  };
};

export function Sentence({
  index,
  language,
  renderTimestamp,
  sentence,
}: SentenceProps) {
  const [wordNetTerm, setWordNetTerm] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [showWordNet, setShowWordNet] = useState(false);
  const { startActivity, endActivity } = useContext(ActivityContext);
  const isReview = useIsReview();

  const quoteSentenceActivity = useDebouncedCallback(async () => {
    if (isReview || !sentence.text || !sentence.tags.length) {
      return;
    }

    const activity = await startActivity(Activity.ViewSentence, {
      startedAtTime: renderTimestamp,
    });

    if (!activity) {
      return;
    }

    const sourceSentence = await getObject('sentences', [language, index]);
    if (!sourceSentence) {
      await saveObject('sentences', {
        attributes: {
          content: sentence.text,
          index,
          sourceLanguage: language,
          source: sentence.source,
        },
        generatedAtTime: renderTimestamp,
        wasGeneratedBy: activity,
        wasQuotedFrom: `oldi:seed/${language}`,
      });
    }
    await endActivity(Activity.ViewSentence);
  }, 100);

  const generatePosActivity = useDebouncedCallback(async (show: boolean) => {
    if (!sentence.tags.length) {
      return;
    }

    const tokenizeActivity = await startActivity(Activity.TokenizeSentence, {
      startedAtTime: renderTimestamp,
      endedAtTime: Date.now(),
    });
    if (tokenizeActivity) {
      await saveObject('tokens', {
        attributes: {
          content: sentence.tags.map(([token]) => token),
          index,
          language: language,
        },
        generatedAtTime: renderTimestamp,
        wasGeneratedBy: tokenizeActivity!,
      });
      await endActivity(Activity.TokenizeSentence);
    }

    const posActivity = await startActivity(Activity.GeneratePosTags, {
      startedAtTime: renderTimestamp,
      endedAtTime: Date.now(),
    });
    if (posActivity) {
      await saveObject('pos_tags', {
        attributes: {
          content: sentence.tags,
          index,
          language: language,
        },
        generatedAtTime: renderTimestamp,
        wasGeneratedBy: posActivity,
      });
      await endActivity(Activity.GeneratePosTags);
    }

    if (show) {
      await startActivity(Activity.DisplayPosTags);
    } else {
      await endActivity(Activity.DisplayPosTags);
    }
  }, 100);

  useEffect(() => {
    (async () => {
      await quoteSentenceActivity();
    })();
  }, [quoteSentenceActivity]);

  async function toggleShowTags(value: boolean) {
    setShowTags(value);
    await generatePosActivity(value);
  }

  async function handleWordNetChange(value: string) {
    setWordNetTerm(value);
    setShowWordNet(true);
  }

  async function handleOpenSourceUrl() {
    await startActivity(Activity.OpenSourceUrl);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {showTags ? (
          <div className="flex flex-wrap gap-1">
            {sentence.tags.map(([word, tag], index) =>
              word === tag ? (
                word
              ) : (
                <BadgeButton
                  key={index}
                  color={getPOSTagColor(tag)}
                  onClick={() => handleWordNetChange(word)}
                >
                  {word}
                </BadgeButton>
              )
            )}
          </div>
        ) : (
          <Text>{sentence.text}</Text>
        )}
        <Divider />

        {sentence.tags?.length ? (
          <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
            <Headless.Field className="flex flex-shrink-0 items-center gap-2">
              <Switch
                checked={showTags}
                onChange={toggleShowTags}
                color="blue"
              />
              <Label className="cursor-pointer font-medium">Show tags</Label>
            </Headless.Field>
            {showTags ? (
              <span className="text-xs/6 text-zinc-600">
                You can click on each word to see more information.
              </span>
            ) : null}
          </div>
        ) : null}
        {wordNetTerm ? (
          <WordNetDialog
            onClose={() => setShowWordNet(false)}
            open={showWordNet}
            term={wordNetTerm}
          />
        ) : null}
      </div>
      {sentence ? (
        <Metadata
          length={sentence.text.length}
          onOpen={handleOpenSourceUrl}
          source={sentence.source}
          tags={sentence.tags}
        />
      ) : null}
    </>
  );
}
