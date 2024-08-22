import { type Change, diffChars, diffWords } from 'diff';
import React, { useEffect, useState } from 'react';

import { Badge } from '@/app/components/badge';
import { Button } from '@/app/components/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/app/components/dialog';
import { Divider } from '@/app/components/divider';
import { Fieldset, Legend } from '@/app/components/fieldset';

import { DiffItem } from './diff-item';

const diffFunctions = {
  diffChars,
  diffWords,
};

type DiffDialogProps = {
  diffType: 'diffChars' | 'diffWords';
  manualTranslation: string;
  modelTranslation: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  original: string;
};

export function DiffDialog({
  diffType,
  manualTranslation,
  modelTranslation,
  onClose,
  onConfirm,
  open,
  original,
}: DiffDialogProps) {
  const [diff, setDiff] = useState<Change[]>([]);

  useEffect(() => {
    if (open) {
      setDiff(diffFunctions[diffType](manualTranslation, modelTranslation));
    }
  }, [diffType, manualTranslation, modelTranslation, open]);

  return (
    <Dialog size="3xl" open={open} onClose={onClose}>
      <DialogTitle>Translation diff</DialogTitle>
      <DialogDescription>{original}</DialogDescription>
      <DialogBody>
        <Fieldset>
          <Legend>Diff</Legend>
          {diff.map((change, index) => (
            <DiffItem change={change} key={index} />
          ))}
        </Fieldset>
        <Divider className="my-4" />
        <div className="flex gap-4">
          <Fieldset className="flex-1">
            <Legend>Manual Translation</Legend>
            <Badge>{manualTranslation}</Badge>
          </Fieldset>
          <Fieldset className="flex-1">
            <Legend>Model Translation</Legend>
            <Badge color="blue">{modelTranslation}</Badge>
          </Fieldset>
        </div>
      </DialogBody>
      <DialogActions>
        <Button color="zinc" onClick={onClose}>
          Keep manual translation
        </Button>
        <Button color="blue" onClick={onConfirm}>
          Use model translation
        </Button>
      </DialogActions>
    </Dialog>
  );
}
