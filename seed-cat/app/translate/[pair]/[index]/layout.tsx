import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { CookieKey } from '@/app/lib/defaults';
import { Panels } from '@/app/translate/[pair]/[index]/panels';

export default async function Layout(
  props: Readonly<{
    children: ReactNode;
    original: ReactNode;
    translation: ReactNode;
    params: Promise<{
      pair: string;
      index: string;
    }>;
  }>
) {
  const params = await props.params;

  const { children, original, translation } = props;

  const layout = (await cookies()).get(CookieKey.PanelLayout);

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
