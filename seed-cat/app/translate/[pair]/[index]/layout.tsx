import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { CookieKey } from '@/app/lib/defaults';
import { Panels } from '@/app/translate/[pair]/[index]/panels';

export default function Layout({
  children,
  original,
  params,
  translation,
}: Readonly<{
  children: ReactNode;
  original: ReactNode;
  translation: ReactNode;
  params: {
    pair: string;
    index: string;
  };
}>) {
  const layout = cookies().get(CookieKey.PanelLayout);

  let defaultLayout;
  if (layout) {
    try {
      defaultLayout = JSON.parse(layout.value);
    } catch (error) {
      defaultLayout = undefined;
    }
  }

  return (
    <Panels
      defaultLayout={defaultLayout}
      index={params.index}
      languagePair={params.pair}
      primary={original}
      secondary={translation}
    >
      {children}
    </Panels>
  );
}
