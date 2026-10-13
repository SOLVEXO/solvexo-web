import { useStorefront } from '@/features/storefront/StorefrontContext';
import { atelierTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { StoreFaqList } from '../../StoreFaqList';

/** `/faqs` — the questions the seller manages under Online Store → FAQs. */
export function AtelierFaqsPage() {
  const { store } = useStorefront();
  useStorefrontSeo({ title: 'Frequently asked questions', description: `Answers to common questions about shopping at ${store.name}.` });
  return (
    <main className="mx-auto" style={{ maxWidth: '820px', padding: `48px ${t.layout.containerPadX} 72px` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 600, color: t.colors.ink, margin: '0 0 28px' }}>Frequently asked questions</h1>
      <StoreFaqList storeId={store.storeId} tokens={{ fonts: t.fonts, colors: t.colors }} />
    </main>
  );
}
