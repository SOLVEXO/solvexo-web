import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

function FeaturedCategoryGridSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
  const { store } = useStorefront();
  // Same static demo-data escape hatch as `FeaturedProductsSection.tsx` —
  // the Theme Library preview sets `section.settings.demoCategories` since
  // it has no real store/category tree to fetch. A real store's sections
  // never set this, so the live fetch below is untouched for every seller.
  const demoCategories = section.settings.demoCategories as CategoryNode[] | undefined;
  const [all, setAll] = useState<CategoryNode[] | null>(demoCategories ?? null);

  useEffect(() => {
    if (demoCategories) return;
    if (!store.categoryId) { setAll([]); return; }
    apiGetCategoryTree(store.categoryId).then(res => setAll(res.data.children ?? [])).catch(() => setAll([]));
  }, [store.categoryId, demoCategories]);

  const ids: string[] = section.settings.categoryIds ?? [];
  const selected = demoCategories ?? (ids.length > 0 ? (all ?? []).filter(c => ids.includes(c._id)) : (all ?? []));
  if (all !== null && selected.length === 0) return null;

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, marginBottom: '36px', textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        {all === null ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse" style={{ aspectRatio: '1/1', background: colors.bgAlt }} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {selected.map(c => {
              const tile = (
                <>
                  <div className="relative flex items-center justify-center" style={{ aspectRatio: '1/1', background: colors.bgAlt, overflow: 'hidden' }}>
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <ImageOff size={24} style={{ color: colors.inkMuted }} />
                    )}
                  </div>
                  <p className="text-center" style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 500, color: colors.ink }}>{c.name}</p>
                </>
              );
              return demoCategories ? (
                <div key={c._id} className="group flex flex-col gap-3">{tile}</div>
              ) : (
                <Link key={c._id} to={`/category/${c.slug || c._id}`} className="no-underline group flex flex-col gap-3">{tile}</Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

registerAtelierSection('featured_category_grid', (section: Section, _blocks, colors: AtelierSectionColors) => <FeaturedCategoryGridSection section={section} colors={colors} />);
