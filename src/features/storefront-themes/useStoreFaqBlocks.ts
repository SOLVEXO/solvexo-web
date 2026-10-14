import { useEffect, useState } from 'react';
import type { Block } from '@/api/services/storefrontTypes';
import { apiListPublicStoreFaqs } from '@/api/services/storeFaq';
import { useStorefront } from '@/features/storefront/StorefrontContext';

/** The store's own FAQs (Online Store → FAQs) shaped as `faq_item` blocks,
 *  so an FAQ section can show the same list as the /faqs page instead of
 *  keeping a second copy. Empty until loaded, and when `enabled` is false. */
export function useStoreFaqBlocks(enabled: boolean): Block[] {
  const { store } = useStorefront();
  const [blocks, setBlocks] = useState<Block[]>([]);
  useEffect(() => {
    if (!enabled || !store?.storeId) return;
    let off = false;
    apiListPublicStoreFaqs(store.storeId)
      .then(res => {
        if (off) return;
        setBlocks((res.data ?? []).map(f => ({ _id: `store-faq-${f._id}`, type: 'faq_item', settings: { question: f.question, answer: f.answer } })));
      })
      .catch(() => { if (!off) setBlocks([]); });
    return () => { off = true; };
  }, [enabled, store?.storeId]);
  return enabled ? blocks : [];
}
