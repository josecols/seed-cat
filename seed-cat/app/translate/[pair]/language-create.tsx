import {
  CircleStackIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';

import { Button } from '@/app/components/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/app/components/dialog';
import { Field } from '@/app/components/fieldset';
import { Input, InputGroup } from '@/app/components/input';
import { Code, Strong } from '@/app/components/text';
import {
  Activity,
  getObject,
  getTranslatorAgentId,
  saveObject,
} from '@/app/lib/client/db';

type LanguageCreateDialog = {
  defaultName?: string;
  onClose: () => void;
  open: boolean;
  sentenceRange: string;
  sourceLanguage: string;
};

export function LanguageCreate({
  defaultName,
  onClose,
  open,
  sentenceRange,
  sourceLanguage,
}: LanguageCreateDialog) {
  const router = useRouter();
  const startedAtTimeRef = useRef(Date.now());
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultName ?? '');

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  async function createTargetLanguage() {
    if (name) {
      setLoading(true);
      const now = Date.now();

      const language = await getObject('target_languages', name);
      if (!language) {
        const activity = await saveObject('activities', {
          attributes: { targetLanguage: name, index: 0 },
          endedAtTime: now,
          startedAtTime: startedAtTimeRef.current,
          type: Activity.CreateTargetLanguage,
          wasAssociatedWith: getTranslatorAgentId(),
        });
        await saveObject('target_languages', {
          attributes: { name },
          generatedAtTime: now,
          wasGeneratedBy: activity,
        });
      }

      onClose();

      const [lower, _] = sentenceRange.split('-').map(Number);
      router.push(`/translate/${sourceLanguage}-${name}/${lower}`);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create a target language</DialogTitle>
      <DialogDescription>
        The target language is a local database that will contain the
        translations. This database is stored on your browser and can be
        exported at any time using the <Code>Export all translations</Code>{' '}
        button located in the{' '}
        <Code>
          Settings <Cog6ToothIcon className="inline" width={16} />
        </Code>{' '}
        menu.
      </DialogDescription>
      <DialogBody>
        <Field>
          <div className="my-2 flex items-center gap-1 text-sm/6">
            <Strong>Target language identifier</Strong>
            <Link
              href="https://oldi.org/guidelines#language-codes"
              target="_blank"
              className="cursor-pointer transition-colors hover:text-blue-500"
            >
              <InformationCircleIcon width={18} />
            </Link>
          </div>
          <InputGroup>
            <CircleStackIcon />
            <Input
              autoFocus
              name="filename"
              value={name}
              onChange={handleChange}
            />
          </InputGroup>
        </Field>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose}>
          Cancel
        </Button>
        <Button color="blue" loading={loading} onClick={createTargetLanguage}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
