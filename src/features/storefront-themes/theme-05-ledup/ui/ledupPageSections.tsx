import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { splitAround, useTemplateSections } from '../../core/pageHooks';
import { LedupSectionRenderer } from '../sections/index';

/** Customer pages (checkout, sign in, account ...): the page's own form stays as coded; the sections the seller placed in Customize render above and below it. */
export function WithPageSections({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  const { store } = useStorefront();
  const { before, after } = splitAround(useTemplateSections(store.storeId, 'page', pageKey), 'page_content');
  return (
    <>
      {before.length > 0 && <LedupSectionRenderer sections={before} />}
      {children}
      {after.length > 0 && <LedupSectionRenderer sections={after} />}
    </>
  );
}
