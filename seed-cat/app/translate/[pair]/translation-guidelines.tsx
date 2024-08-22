import React from 'react';

import { Button } from '@/app/components/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/app/components/dialog';
import { Divider } from '@/app/components/divider';
import { Subheading } from '@/app/components/heading';
import { Strong, Text, TextLink } from '@/app/components/text';

type TranslationGuidelinesProps = {
  onClose: () => void;
  onConfirm?: () => void;
  open: boolean;
};

export function TranslationGuidelines({
  onClose,
  onConfirm,
  open,
}: TranslationGuidelinesProps) {
  function scrollToSection(section: string) {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <Dialog size="2xl" open={open} onClose={onClose}>
      <DialogTitle>Translation Guidelines</DialogTitle>
      <DialogDescription>
        Please acknowledge the following guidelines before starting a
        translation. These guidelines have been modified from the original
        version posted by the{' '}
        <TextLink
          href="https://oldi.org/guidelines#translation-guidelines"
          target="_blank"
        >
          Open Language Data Initiative (OLDI)
        </TextLink>{' '}
        to include a note about machine translation.
      </DialogDescription>
      <DialogBody>
        <Divider className="my-4" />
        <div className="my-4">
          <Subheading>Important note</Subheading>
          <ul className="list-inside list-disc text-sm/6 text-zinc-600">
            <li>
              The use of post-edited machine translated content is allowed,
              provided all data is manually verified and edited where necessary.
            </li>
            <li>
              <Strong>Note</Strong> that some machine translation services –
              including DeepL, Google Translate, and ChatGPT – prohibit the use
              of their output for training other translation or AI models, so
              their use is not permitted. Please use the{' '}
              <Strong>Machine Translate</Strong> button provided in the editor
              for this purpose.
            </li>
          </ul>
        </div>
        <div className="my-4">
          <Subheading>General guidelines</Subheading>
          <ol className="list-inside list-decimal text-sm/6 text-zinc-600">
            <li>
              You will be translating sentences coming from different sources.
              Please refer to the source document if available.
            </li>
            <li>
              Do not convert any units of measurement. Translate them exactly as
              noted in the source content.
            </li>
            <li>
              When translating, please maintain the same tone used in the source
              document. For example, encyclopedic content coming from sources
              like Wikipedia should be translated using a formal tone.
            </li>
            <li>
              Provide fluent translations without deviating too much from the
              source structure. Only allow necessary changes.
            </li>
            <li>
              Do not expand or replace information compared to what is present
              in the source documents. Do not add any explanatory or
              parenthetical information, definitions, etc.
            </li>
            <li>
              Do not ignore any meaningful text that was present in the source.
            </li>
            <li>
              In case of multiple possible translations, please pick the one
              that makes the most sense (e.g., for gender concordance, cultural
              fit in the target language, level of formality, etc.).
            </li>
            <li>
              Translations must be faithful to the source in terms of pragmatics
              such as (if applicable) level of hedging/modality, sentiment and
              its intensity, negation, speech effects (disfluencies), etc.
            </li>
            <li>
              For proper nouns and common abbreviations, please see the
              guidelines on{' '}
              <Strong
                className="cursor-pointer underline"
                onClick={() => scrollToSection('named-entities')}
              >
                Named Entities
              </Strong>{' '}
              below.
            </li>
            <li>
              Idiomatic expressions should not be translated word for word. Use
              an equivalent idiom, if one exists. If no equivalent idiom exists,
              use an idiom of similar meaning. If no similar expressions exist
              in the target language, paraphrase the idiom such that the meaning
              is retained in the target language.
            </li>
            <li>
              When a pronoun to be translated is ambiguous (for instance, when
              it could be interpreted as either <em>him/her</em> or{' '}
              <em>he/she</em>), opt for gender neutral pronouns (such as{' '}
              <em>them/they</em>) if those exist in the target language.
              However, when a pronoun to be translated is clearly marked for
              gender, you should follow the source material and continue to mark
              for gender.
            </li>
            <li>
              Foreign words and phrases used in the text should be kept in their
              original language when this is necessary to preserve the meaning
              of the sentence (e.g. if given as an example of a foreign word).
            </li>
          </ol>
        </div>
        <div id="named-entities" className="my-4">
          <Subheading>Named Entities</Subheading>
          <Text className="mb-4 text-sm/6 text-zinc-600">
            Named entities are people, places, organisations, etc., that are
            commonly referred to using a proper noun. This section provides
            guidance on how to handle named entities. Please review the
            following guidelines carefully:
          </Text>
          <ol className="list-inside list-decimal text-sm/6 text-zinc-600">
            <li>
              If there is a commonly used term in the target language for the
              Named Entity:
              <ol className="list-[lower-alpha] pl-8">
                <li>
                  If the most commonly used term is the same as in the source
                  language, then keep it as it is.
                </li>
                <li>
                  If the most commonly used term is a translation or a
                  transliteration, then use that.
                </li>
              </ol>
            </li>
            <li>
              If there is no commonly used term:
              <ol className="list-[lower-alpha] pl-8">
                <li>
                  If possible, a transliteration of the original term should be
                  used.
                </li>
                <li>
                  If a transliteration would not be commonly understood in the
                  context, and the source term would be more acceptable, you may
                  retain the original term.
                </li>
              </ol>
            </li>
          </ol>
        </div>
      </DialogBody>
      <DialogActions>
        {!onConfirm && (
          <Button plain onClick={onClose}>
            Close
          </Button>
        )}
        {onConfirm && (
          <Button color="blue" onClick={onConfirm}>
            I acknowledge the guidelines
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
