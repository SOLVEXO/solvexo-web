import { useStorefront } from '@/features/storefront/StorefrontContext';
import type { Section } from '@/api/services/storefrontTypes';
import { atelierTheme as t } from '../theme.config';
import { AtelierButton } from '../components/AtelierButton';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { CollectionListSection, type SharedThemeTokens } from '../../sharedSections';

/** `/collections` — every collection of the store as tiles (Shopify's collections index page). */
export function AtelierCollectionsPage() {
  const { store } = useStorefront();
  useStorefrontSeo({ title: 'Collections', description: `Shop ${store.name} by collection.` });
  const section = { type: 'collection_list', settings: { heading: '', columns: 3, limit: 24, imageRatio: 'default', showDescription: true }, blocks: [] } as unknown as Section;
  const tokens: SharedThemeTokens = { fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx, Button: AtelierButton as SharedThemeTokens['Button'] };
  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX} 0` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 600, color: t.colors.ink, margin: 0 }}>Collections</h1>
      <div style={{ margin: `0 -${t.layout.containerPadX}` }}>
        <CollectionListSection section={section} blocks={[]} colors={t.colors} theme={tokens} />
      </div>
    </main>
  );
}
