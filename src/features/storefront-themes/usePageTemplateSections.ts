import { useEffect, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';

/** Sections a seller placed on a fixed page's template in Customize
 *  (404, Account, Password). Empty until loaded or when none are set. */
export function usePageTemplateSections(storeId: string | undefined, templateKey: 'not-found' | 'account' | 'password'): Section[] {
  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    if (!storeId) return;
    let off = false;
    apiGetPublicCollectionTemplate(storeId, 'page', templateKey)
      .then(res => { if (!off) setSections(res.data?.sections ?? []); })
      .catch(() => { if (!off) setSections([]); });
    return () => { off = true; };
  }, [storeId, templateKey]);
  return sections;
}
