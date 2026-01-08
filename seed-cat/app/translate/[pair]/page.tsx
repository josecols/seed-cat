import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CookieKey, SENTENCE_RANGE } from '@/app/lib/defaults';
import { EmptyTarget } from '@/app/translate/[pair]/empty-target';

export const runtime = 'edge';

export default async function Page(props: {
  params: Promise<{ pair: string }>;
}) {
  const params = await props.params;
  const [source, target] = params.pair.split('-');
  const range =
    (await cookies()).get(CookieKey.SentenceRange)?.value ?? SENTENCE_RANGE;
  const [lower, _] = range.split('-').map(Number);

  if (source && target) {
    redirect(`/${source}-${target}/${lower}`);
  }

  return <EmptyTarget />;
}
