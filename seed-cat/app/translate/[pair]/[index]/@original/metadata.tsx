'use client';

import React from 'react';

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/app/components/description';
import { Subheading } from '@/app/components/heading';
import { TextLink } from '@/app/components/text';

type MetadataProps = {
  length: number;
  onOpen?: () => void;
  source: string;
  tags?: [string, string][];
};

export function Metadata({ source, length, tags, onOpen }: MetadataProps) {
  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 md:mt-8">
      <Subheading>Metadata</Subheading>
      <DescriptionList className="mt-2">
        <DescriptionTerm>Characters</DescriptionTerm>
        <DescriptionDetails>{length}</DescriptionDetails>

        {tags?.length ? (
          <>
            <DescriptionTerm>Words</DescriptionTerm>
            <DescriptionDetails>
              {tags.filter(([k, v]) => k !== v).length}
            </DescriptionDetails>
          </>
        ) : null}

        <DescriptionTerm>Source Document</DescriptionTerm>
        <DescriptionDetails>
          <TextLink href={source} target="_blank" onClick={onOpen}>
            {source}
          </TextLink>
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}
