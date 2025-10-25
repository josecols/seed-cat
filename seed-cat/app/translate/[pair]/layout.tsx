import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { CookieKey } from '@/app/lib/defaults';
import { cloudStorageSupport } from '@/app/lib/server/config';
import { Main } from '@/app/translate/[pair]/main';

export default async function Layout(
  props: Readonly<{
    children: ReactNode;
    params: Promise<{
      pair: string;
    }>;
  }>
) {
  const params = await props.params;

  const { children } = props;

  const defaultShowSidebar =
    (await cookies()).get(CookieKey.Sidebar)?.value === '1';
  const [source, target] = params.pair.split('-');

  return (
    <Main
      defaultShowSidebar={defaultShowSidebar}
      enableCloudBackup={cloudStorageSupport()}
      sourceLanguage={source}
      targetLanguage={target}
    >
      {children}
    </Main>
  );
}
