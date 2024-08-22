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
  nextIndex: number;
};

export function LanguageSelect({ language, nextIndex }: LanguageSelectProps) {
  const { data } = useLanguageList();
  const params = useParams<{ pair: string; index?: string }>();
  const [localLanguages, setLocalLanguages] = useState<string[]>([]);
  const sourceLanguage = params.pair.split('-')[0];

  useEffect(() => {
    (async () => {
      const languages = await getAllKeys('target_languages');
      setLocalLanguages(languages);
    })();
  }, []);

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
        {localLanguages.length > 0 && (
          <>
            <DropdownSection>
              <DropdownHeading>Local Files</DropdownHeading>
              {localLanguages.map((target) => (
                <DropdownItem
                  key={target}
                  href={`/translate/${sourceLanguage}-${target}/${params.index ?? nextIndex}`}
                >
                  <DropdownLabel>{target}</DropdownLabel>
                </DropdownItem>
              ))}
            </DropdownSection>
            <DropdownDivider />
          </>
        )}
        <DropdownSection>
          <DropdownHeading>Remote Files</DropdownHeading>
          {data?.map((item) => (
            <DropdownItem
              key={item.name}
              href={`/translate/${sourceLanguage}-${item.name}/${params.index ?? nextIndex}`}
            >
              <DropdownLabel>{item.name}</DropdownLabel>
            </DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
