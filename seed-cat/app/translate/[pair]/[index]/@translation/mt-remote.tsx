import React from 'react';

import { machineTranslateSentence } from '@/app/lib/client/api';
import { MachineTranslateButton } from '@/app/translate/[pair]/[index]/@translation/mt-button';

type MachineTranslateRemoteProps = {
  loading: boolean;
  onComplete: (text: string) => void;
  onStart: () => Promise<boolean>;
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
  translation?: string;
};

export default function MachineTranslateRemote({
  translation,
  loading,
  onComplete,
  onStart,
  sourceLanguage,
  targetLanguage,
  text,
}: MachineTranslateRemoteProps) {
  async function machineTranslate() {
    if (!(await onStart())) {
      return;
    }

    const { translation } = await machineTranslateSentence(
      sourceLanguage,
      targetLanguage,
      text
    );
    onComplete(translation);
  }

  return (
    <MachineTranslateButton
      loading={loading}
      onClick={machineTranslate}
      translation={translation}
    />
  );
}
