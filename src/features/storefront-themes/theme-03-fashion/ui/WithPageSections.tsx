import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { splitAround, useTemplateSections } from '../../core/pageHooks';
import { FashionSectionRenderer } from '../sections';

/** Customer pages (sign in, account, orders, checkout ...): the page's own form/list stays exactly as coded; the sections
 *  the seller placed in Customize render above and below it. With nothing placed the page is unchanged. A template saved
 *  before the locked `page_content` marker existed has no marker, so all its sections stay below the page, as they did. */
export function WithPageSections({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  const { store } = useStorefront();
  const { before, after } = splitAround(useTemplateSections(store.storeId, 'page', pageKey), 'page_content');
  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      {children}
      {after.length > 0 && <FashionSectionRenderer sections={after} />}
    </>
  );
}
