import { redirect } from 'next/navigation';

import { SOURCE_LANGUAGE } from '@/app/lib/defaults';

export const runtime = 'edge';

export default function Page() {
  redirect(`/translate/${SOURCE_LANGUAGE}`);
}
