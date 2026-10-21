import { useEffect, useMemo, useState } from 'react';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { localizeFields } from '@/utils/storeText';
import type { Block } from '@/api/services/storefrontTypes';
import { apiListPublicStoreFaqs } from '@/api/services/storeFaq';
import { useStorefront } from '@/features/storefront/StorefrontContext';

/** The store's own FAQs (Online Store → FAQs) shaped as `faq_item` blocks,
 *  so an FAQ section can show the same list as the /faqs page instead of
 *  keeping a second copy. Empty until loaded, and when `enabled` is false. */
export function useStoreFaqBlocks(enabled: boolean): Block[] {
  const { store } = useStorefront();
  const [source, setSource] = useState<{ _id: string; question: string; answer: string }[]>([]);
  const textIndex = useStoreTextIndex();
  useEffect(() => {
    if (!enabled || !store?.storeId) return;
    let off = false;
    apiListPublicStoreFaqs(store.storeId)
      .then(res => {
        if (off) return;
        setSource(res.data ?? []);
      })
      .catch(() => { if (!off) setSource([]); });
    return () => { off = true; };
  }, [enabled, store?.storeId]);
  const blocks = useMemo<Block[]>(() => source.map(raw => {
    const f = localizeFields(raw, `faq:${raw._id}`, textIndex);
    return { _id: `store-faq-${f._id}`, type: 'faq_item', settings: { question: f.question, answer: f.answer } };
  }), [source, textIndex]);
  return enabled ? blocks : [];
}
