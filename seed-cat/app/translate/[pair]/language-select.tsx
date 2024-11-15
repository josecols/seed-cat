import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '@/app/components/dropdown';
import { NavbarItem } from '@/app/components/navbar';
import { useLanguageList } from '@/app/lib/client/api';
import { getAllKeys } from '@/app/lib/client/db';

type LanguageSelectProps = {
  language?: string;
  defaultIndex: number;
  source?: boolean;
  remoteOnly?: boolean;
};

export function LanguageSelect({
  language,
  defaultIndex,
  source = false,
  remoteOnly = false,
}: LanguageSelectProps) {
  const { data } = useLanguageList();
  const params = useParams<{ pair: string; index?: string }>();
  const [localLanguages, setLocalLanguages] = useState<string[]>([]);
  const [sourceLanguage, targetLanguage] = params.pair.split('-');

  useEffect(() => {
    (async () => {
      const languages = await getAllKeys('target_languages');
      setLocalLanguages(languages);
    })();
  }, []);

  const getOptionHref = (item: { code: string; script: string }) => {
    const selectedLanguage = `${item.code}_${item.script}`;
    const index = params.index ?? defaultIndex;

    if (source) {
      return `/translate/${selectedLanguage}-${targetLanguage}/${index}`;
    }

    return `/translate/${sourceLanguage}-${selectedLanguage}/${index}`;
  };

  return (
    <Dropdown>
      <DropdownButton
        as={NavbarItem}
        aria-label={language ?? 'Target languages'}
      >
        {language ?? 'Target languages'}
        <ChevronUpDownIcon />
      </DropdownButton>
      <DropdownMenu>
        {!remoteOnly && localLanguages.length > 0 && (
          <>
            <DropdownSection>
              <DropdownHeading>Local Datasets</DropdownHeading>
              {localLanguages.map((target) => (
                <DropdownItem
                  key={target}
                  href={`/translate/${sourceLanguage}-${target}/${params.index ?? defaultIndex}`}
                >
                  <DropdownLabel>{target}</DropdownLabel>
                </DropdownItem>
              ))}
            </DropdownSection>
            <DropdownDivider />
          </>
        )}
        <DropdownSection>
          <DropdownHeading>Remote Datasets</DropdownHeading>
          {data?.map((item) => (
            <DropdownItem key={item.name} href={getOptionHref(item)}>
              <DropdownLabel>{item.name}</DropdownLabel>
            </DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
