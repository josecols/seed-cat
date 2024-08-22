import React from 'react';

import { Button } from '@/app/components/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from '@/app/components/dialog';
import { Fieldset } from '@/app/components/fieldset';
import { Text } from '@/app/components/text';

type ModelAlertProps = {
  onCancel: () => void;
  onClose: () => void;
  open: boolean;
  progressItems: Record<string, number>;
};

export function ModelDialog({
  onCancel,
  onClose,
  open,
  progressItems,
}: ModelAlertProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Loading translation model</DialogTitle>
      <DialogBody>
        {Object.keys(progressItems) ? (
          <Fieldset className="flex flex-col gap-4">
            {Object.entries(progressItems).map(([name, progress]) => (
              <div key={name}>
                <Text>{name}</Text>
                <div className="overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </Fieldset>
        ) : null}
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
