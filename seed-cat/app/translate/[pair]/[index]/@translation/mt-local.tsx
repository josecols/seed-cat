import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ModelDialog } from '@/app/translate/[pair]/[index]/@translation/model-dialog';
import { MachineTranslateButton } from '@/app/translate/[pair]/[index]/@translation/mt-button';

type MachineTranslateLocalProps = {
  loading: boolean;
  onChange: (text: string) => void;
  onComplete: (text?: string) => Promise<void>;
  onStart: () => Promise<boolean>;
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
  translation?: string;
};

export default function MachineTranslateLocal({
  loading,
  onChange,
  onComplete,
  onStart,
  sourceLanguage,
  targetLanguage,
  text,
  translation,
}: MachineTranslateLocalProps) {
  const worker = useRef<Worker>();
  const [modelAlert, setModelAlert] = useState(false);
  const [progressItems, setProgressItems] = useState<Record<string, number>>(
    {}
  );

  const onWorkerMessage = useCallback(
    async (e: MessageEvent) => {
      switch (e.data.status) {
        case 'initiate':
          setModelAlert(true);
          break;

        case 'progress':
          if ('file' in e.data) {
            setProgressItems((prev) => ({
              ...prev,
              [e.data.file]: e.data.progress,
            }));
          }
          break;

        case 'ready':
          setModelAlert(false);
          break;

        case 'update':
          setModelAlert(false);
          onChange(e.data.output);
          break;

        case 'complete':
          if (Array.isArray(e.data.output)) {
            await onComplete(e.data.output[0]?.translation_text);
          }
          break;
      }
    },
    [onChange, onComplete]
  );

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL('@/app/lib/client/worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );
    }

    worker.current.onmessage = onWorkerMessage;

    return () => {
      if (worker.current) {
        worker.current.onmessage = null;
      }
    };
  }, [onWorkerMessage]);

  async function machineTranslate() {
    if (!(await onStart())) {
      return;
    }

    worker.current?.postMessage({
      text: text,
      src_lang: sourceLanguage,
      tgt_lang: targetLanguage,
    });
  }

  async function cancelMachineTranslate() {
    worker.current?.terminate();
    setModelAlert(false);
    await onComplete();
  }

  return (
    <>
      <MachineTranslateButton
        loading={loading}
        onClick={machineTranslate}
        translation={translation}
      />
      <ModelDialog
        onCancel={cancelMachineTranslate}
        onClose={() => setModelAlert(false)}
        open={modelAlert}
        progressItems={progressItems}
      />
    </>
  );
}
