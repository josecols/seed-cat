'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import { Button } from '@/app/components/button';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';

export function RangeWarning() {
  const router = useRouter();

  return (
    <div className="flex grow flex-col items-center justify-center p-4 pb-2 lg:rounded-lg lg:bg-white lg:p-6 lg:pb-2 lg:shadow-sm lg:ring-1 lg:ring-stone-950/5">
      <div className="flex max-w-lg flex-col items-center text-center">
        <ExclamationTriangleIcon className="text-zinc-400" width={48} />
        <Heading level={2}>Sentence outside assigned range</Heading>
        <Text>
          You have navigated to a sentence that is outside your selected range.
        </Text>
        <div className="mt-6">
          <Button color="blue" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
