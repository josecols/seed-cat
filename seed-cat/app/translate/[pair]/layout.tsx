import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { CookieKey } from '@/app/lib/defaults';
import { cloudStorageSupport } from '@/app/lib/server/config';
import { Main } from '@/app/translate/[pair]/main';

export default function Layout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: {
    pair: string;
  };
}>) {
  const defaultShowSidebar = cookies().get(CookieKey.Sidebar)?.value === '1';
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
