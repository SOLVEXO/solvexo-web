import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';
import { AtelierProductGrid } from '../components/AtelierProductGrid';
import { atelierTheme as t } from '../theme.config';

/** `/category/:slugOrId` — resolves against the store's own subcategory tree
 *  client-side (same precedent as the legacy `CategoryBrowsePage`), then
 *  renders Theme 01's own `AtelierProductGrid` scoped to that subcategory. */
export function AtelierCategoryPage() {
  const { slugOrId = '' } = useParams<{ slugOrId: string }>();
  const { store } = useStorefront();
  const [category, setCategory] = useState<CategoryNode | null | undefined>(undefined);

  useEffect(() => {
    setCategory(undefined);
    apiGetStoreCategoryTree(store.storeId)
      .then(res => {
        const flat = (res.data ?? []).flatMap(root => [root, ...root.children]);
        const match = flat.find(c => c.slug === slugOrId || c._id === slugOrId) ?? null;
        setCategory(match);
      })
      .catch(() => setCategory(null));
  }, [store.storeId, slugOrId]);

  usePageTitle(category ? category.name : store.name);

  if (category === undefined) {
    return <div style={{ padding: '96px 0', textAlign: 'center', fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>Loading…</div>;
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center text-center" style={{ padding: '96px 20px' }}>
        <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 600, color: t.colors.ink, marginBottom: '8px' }}>Category not found</p>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, maxWidth: '340px' }}>This category may have been removed or renamed.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      <AtelierProductGrid heading={category.name} categoryId={category._id} />
    </main>
  );
}
