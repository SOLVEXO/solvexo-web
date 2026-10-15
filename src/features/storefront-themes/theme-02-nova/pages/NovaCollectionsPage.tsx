import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useTranslation } from 'react-i18next';
import type { Section } from '@/api/services/storefrontTypes';
import { novaTheme as t } from '../theme.config';
import { NovaButton } from '../components/NovaButton';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { CollectionListSection, type SharedThemeTokens } from '../../sharedSections';

/** `/collections` — every collection of the store as tiles (Shopify's collections index page). */
export function NovaCollectionsPage() {
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  useStorefrontSeo({ title: tr('collections.title', "Collections"), description: tr('collections.shopBy', 'Shop {{name}} by collection.', { name: store.name }) });
  const section = { type: 'collection_list', settings: { heading: '', columns: 3, limit: 24, imageRatio: 'default', showDescription: true }, blocks: [] } as unknown as Section;
  const tokens: SharedThemeTokens = { fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx, Button: NovaButton as SharedThemeTokens['Button'] };
  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX} 0` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 700, color: t.colors.ink, margin: 0 }}>{tr('collections.title', "Collections")}</h1>
      <div style={{ margin: `0 -${t.layout.containerPadX}` }}>
        <CollectionListSection section={section} blocks={[]} colors={t.colors} theme={tokens} />
      </div>
    </main>
  );
}
