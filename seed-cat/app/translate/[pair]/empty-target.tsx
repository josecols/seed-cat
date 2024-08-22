'use client';

import { LanguageIcon } from '@heroicons/react/24/outline';
import { DocumentPlusIcon } from '@heroicons/react/24/solid';
import { useContext } from 'react';

import { Button } from '@/app/components/button';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { MainContext } from '@/app/translate/[pair]/main';

export function EmptyTarget() {
  const { toggleLanguageCreate } = useContext(MainContext);

  return (
    <div className="flex grow flex-col items-center justify-center p-4 pb-2 lg:rounded-lg lg:bg-white lg:p-6 lg:pb-2 lg:shadow-sm lg:ring-1 lg:ring-stone-950/5">
      <div className="flex max-w-lg flex-col items-center text-center">
        <LanguageIcon className="text-zinc-400" width={48} />
        <Heading level={2}>Select a target language</Heading>
        <Text>
          Get started by creating a new target language or selecting an existing
          one.
        </Text>
        <div className="mt-6">
          <Button color="blue" onClick={() => toggleLanguageCreate(true)}>
            <DocumentPlusIcon /> New target language
          </Button>
        </div>
      </div>
    </div>
  );
}
