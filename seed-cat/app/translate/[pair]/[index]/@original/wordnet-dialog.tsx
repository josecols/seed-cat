import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Badge, BadgeButton } from '@/app/components/badge';
import { Button } from '@/app/components/button';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/app/components/description';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/app/components/dialog';
import { Subheading } from '@/app/components/heading';
import { Code, Text, TextLink } from '@/app/components/text';
import { useWordNet } from '@/app/lib/client/api';
import { Activity, saveObject } from '@/app/lib/client/db';
import { getWordNetPOSColor, getWordNetPOSLabel } from '@/app/lib/utils';
import { WordNetSkeleton } from '@/app/translate/[pair]/[index]/@original/wordnet-skeleton';
import { ActivityContext } from '@/app/translate/[pair]/[index]/activities';

type WordNetDialogProps = {
  term: string;
  onClose: () => void;
  open: boolean;
};

export function WordNetDialog({ term, onClose, open }: WordNetDialogProps) {
  const { startActivity, endActivity } = useContext(ActivityContext);
  const [history, setHistory] = useState<string[]>([term]);

  const currentTerm = history.at(-1) ?? term;
  const { data: records, isLoading } = useWordNet(currentTerm);

  const saveQuery = useCallback(async () => {
    if (!records || currentTerm !== term) {
      return;
    }

    const activity = await startActivity(Activity.QueryWordnet);
    if (activity) {
      for (const record of records) {
        await saveObject('wordnet_queries', {
          attributes: {
            examples: record.exp,
            gloss: record.gloss,
            lemma: record.lemma,
            pos: record.pos,
            synonyms: record.synonyms,
          },
          generatedAtTime: Date.now(),
          wasQuotedFrom: 'wn:wordnet',
          wasGeneratedBy: activity,
        });
      }
    }
  }, [currentTerm, records, startActivity, term]);

  useEffect(() => {
    (async () => {
      if (!currentTerm || !records) {
        return;
      }

      await endActivity(Activity.QueryWordnet);
      await saveQuery();
    })();
  }, [currentTerm, endActivity, records, saveQuery]);

  function handleSynonymClick(synonym: string) {
    if (history.includes(synonym)) {
      return;
    }
    setHistory([...history, synonym]);
  }

  function handleBack() {
    setHistory(history.slice(0, -1));
  }

  async function handleClose() {
    await endActivity(Activity.QueryWordnet);
    setHistory([]);
    onClose();
  }

  return (
    <Dialog size="4xl" open={open} onClose={handleClose}>
      <DialogTitle>
        {!isLoading && !records?.length
          ? `No results found for "${currentTerm}"`
          : currentTerm}
      </DialogTitle>
      {!isLoading && records?.length ? (
        <DialogDescription>
          The information provided below is retrieved from the{' '}
          <TextLink href="https://wordnet.princeton.edu/" target="_blank">
            WordNet 3.1
          </TextLink>{' '}
          database. Princeton University.
        </DialogDescription>
      ) : null}
      <DialogBody className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          <WordNetSkeleton count={4} />
        ) : (
          records?.map((result) => (
            <section
              key={result.synsetOffset}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <Subheading>{result.lemma}</Subheading>

              <DescriptionList>
                <DescriptionTerm>Part of speech</DescriptionTerm>
                <DescriptionDetails>
                  <Badge color={getWordNetPOSColor(result.pos)}>
                    {getWordNetPOSLabel(result.pos)}
                  </Badge>
                </DescriptionDetails>

                <DescriptionTerm>Description</DescriptionTerm>
                <DescriptionDetails>
                  {result.gloss.charAt(0).toUpperCase() + result.gloss.slice(1)}
                </DescriptionDetails>

                {result.exp?.length ? (
                  <>
                    <DescriptionTerm>Examples</DescriptionTerm>
                    <DescriptionDetails>
                      {result.exp.join(', ')}
                    </DescriptionDetails>
                  </>
                ) : null}

                <DescriptionTerm>Synonyms</DescriptionTerm>
                <DescriptionDetails className="flex flex-wrap gap-2">
                  {result.synonyms.map((synonym, index) => (
                    <BadgeButton
                      key={index}
                      onClick={() => handleSynonymClick(synonym)}
                    >
                      {synonym}
                    </BadgeButton>
                  ))}
                </DescriptionDetails>
              </DescriptionList>
            </section>
          ))
        )}
      </DialogBody>
      <DialogActions>
        {history.length > 1 && <Button onClick={handleBack}>Back</Button>}
        <Button plain onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
