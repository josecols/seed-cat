'use client';

import {
  ArrowUpTrayIcon,
  Bars3Icon,
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';
import { saveAs } from 'file-saver';
import { useParams, useRouter } from 'next/navigation';
import React, { useContext } from 'react';

import { Badge } from '@/app/components/badge';
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
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from '@/app/components/navbar';
import {
  getProvDiagram,
  useCompletedTranslationsCount,
  useLanguageSentencesCount,
} from '@/app/lib/client/api';
import { getCompletedTranslations } from '@/app/lib/client/db';
import { deserialize, serialize } from '@/app/lib/client/prov-json';
import { LanguageSelect } from '@/app/translate/[pair]/language-select';
import { MainContext } from '@/app/translate/[pair]/main';

type HeaderProps = {
  sourceLanguage: string;
  targetLanguage?: string;
  toggleSidebar?: () => void;
};

export function Header({
  sourceLanguage,
  targetLanguage,
  toggleSidebar,
}: HeaderProps) {
  const router = useRouter();
  const params = useParams<{ index?: string }>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { data: sentencesCount } = useLanguageSentencesCount(sourceLanguage);
  const { data: completedTranslationsCount } =
    useCompletedTranslationsCount(targetLanguage);
  const { sentenceRange, toggleLanguageCreate, toggleTranslationGuidelines } =
    useContext(MainContext);

  const [lower, _] = sentenceRange.split('-').map(Number);

  async function exportTranslations() {
    if (!sentencesCount || !targetLanguage) {
      return;
    }

    const output: string[] = new Array(sentencesCount.count).fill('\n');
    const translations = await getCompletedTranslations(targetLanguage);

    translations.forEach((translation) => {
      if (
        translation.attributes.index >= 1 &&
        translation.attributes.index <= sentencesCount.count
      ) {
        output[translation.attributes.index - 1] =
          `${translation.attributes.content}\n`;
      }
    });

    const blob = new Blob(output, { type: 'text/plain' });
    saveAs(blob, targetLanguage);
  }

  async function exportProvJson() {
    if (!params.index || !targetLanguage) {
      return;
    }

    const provJson = await serialize(
      sourceLanguage,
      targetLanguage,
      parseInt(params.index, 10),
      true
    );
    const blob = new Blob([JSON.stringify(provJson, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, `${targetLanguage}-${params.index}-prov.json`);
  }

  function importProvJson() {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }

  async function exportProvDiagram() {
    if (!params.index || !targetLanguage) {
      return;
    }

    const diagram = await getProvDiagram(
      sourceLanguage,
      targetLanguage,
      parseInt(params.index, 10)
    );

    if (diagram) {
      saveAs(diagram, `${targetLanguage}-${params.index}-prov.png`);
    }
  }

  function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.json')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) {
        return;
      }

      try {
        const prov = JSON.parse(e.target.result as string);
        const provIds = await deserialize(prov);
        if (!provIds) {
          return;
        }

        if (
          sourceLanguage === provIds.sourceLanguage &&
          targetLanguage === provIds.targetLanguage &&
          params.index === provIds.index.toString()
        ) {
          window.location.reload();
        } else {
          router.push(
            `/review/${provIds.sourceLanguage}-${provIds.targetLanguage}/${provIds.index}`
          );
        }
      } catch (error) {
        return;
      }
    };

    reader.readAsText(file);
  }

  return (
    <header className="flex items-center px-4">
      {toggleSidebar && (
        <div className="py-2.5">
          <NavbarItem onClick={toggleSidebar} aria-label="Toggle sentence list">
            <Bars3Icon />
          </NavbarItem>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <Navbar>
          <NavbarSection className="max-sm:hidden">
            <NavbarItem
              href={`/translate/${sourceLanguage}`}
              current={!targetLanguage}
            >
              {sourceLanguage}
            </NavbarItem>
            <ChevronRightIcon width={20} />
            <LanguageSelect nextIndex={lower} language={targetLanguage} />
          </NavbarSection>
          <NavbarSpacer />
          {completedTranslationsCount?.count ? (
            <>
              <NavbarSection>
                <NavbarItem title="Number of completed Translations">
                  <Badge color="green">
                    <DocumentCheckIcon width={18} />
                    <span>{completedTranslationsCount.count} done</span>
                  </Badge>
                </NavbarItem>
              </NavbarSection>
              <NavbarDivider />
            </>
          ) : null}
          <NavbarSection>
            <NavbarItem
              title="Translation Guidelines"
              onClick={() => toggleTranslationGuidelines(true)}
            >
              <QuestionMarkCircleIcon />
            </NavbarItem>
            <Dropdown>
              <DropdownButton as={NavbarItem} title="Settings">
                <Cog6ToothIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownSection>
                  <DropdownHeading>General</DropdownHeading>
                  <DropdownItem onClick={() => toggleLanguageCreate(true)}>
                    <PlusIcon />
                    <DropdownLabel>New target language</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem onClick={exportTranslations}>
                    <ArrowUpTrayIcon />
                    <DropdownLabel>Export all translations</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem onClick={importProvJson}>
                    <DocumentArrowDownIcon />
                    <DropdownLabel>Import PROV-JSON</DropdownLabel>
                  </DropdownItem>
                </DropdownSection>
                {params.index && (
                  <>
                    <DropdownDivider />
                    <DropdownSection>
                      <DropdownHeading>Current translation</DropdownHeading>

                      <DropdownItem onClick={exportProvJson}>
                        <DocumentTextIcon />
                        <DropdownLabel>Export PROV-JSON</DropdownLabel>
                      </DropdownItem>
                      <DropdownItem onClick={exportProvDiagram}>
                        <Square3Stack3DIcon />
                        <DropdownLabel>Export PROV diagram</DropdownLabel>
                      </DropdownItem>
                    </DropdownSection>
                  </>
                )}
                <DropdownDivider />
                <DropdownItem
                  href="mailto:jcols@uw.edu?subject=[Seed-CAT Feedback]:"
                  target="_blank"
                >
                  <ChatBubbleBottomCenterTextIcon />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <input
              accept=".json"
              className="hidden"
              onChange={handleImportChange}
              ref={fileInputRef}
              type="file"
            />
          </NavbarSection>
        </Navbar>
      </div>
    </header>
  );
}
