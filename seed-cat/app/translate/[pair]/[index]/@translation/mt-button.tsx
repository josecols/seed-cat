import { CheckIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { Button } from '@/app/components/button';

type MachineTranslateButtonProps = {
  loading: boolean;
  onClick: () => void;
  translation?: string;
};

export function MachineTranslateButton({
  loading,
  onClick,
  translation,
}: MachineTranslateButtonProps) {
  return (
    <Button
      color="blue"
      className="flex-shrink-0"
      loading={loading}
      onClick={onClick}
    >
      {!loading && translation ? <CheckIcon /> : <ComputerDesktopIcon />}
      Machine Translate
    </Button>
  );
}
