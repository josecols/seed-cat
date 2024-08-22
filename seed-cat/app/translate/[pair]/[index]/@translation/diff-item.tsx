import type { Change } from 'diff';
import React from 'react';

import { Badge } from '@/app/components/badge';

const changeProps = {
  added: { color: 'green' },
  removed: { color: 'red', className: 'line-through' },
  default: {},
} as const;

type DiffItemProps = {
  change: Change;
};

export function DiffItem({ change }: DiffItemProps) {
  const props =
    changeProps[
      change.added ? 'added' : change.removed ? 'removed' : 'default'
    ];

  return (
    <Badge inline {...props}>
      {change.value}
    </Badge>
  );
}
