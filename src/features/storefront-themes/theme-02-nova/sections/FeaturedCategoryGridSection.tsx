import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import { novaTheme as t } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

/** Theme 02's port of Atelier's `FeaturedCategoryGridSection` — same real
 *  `apiGetCategoryTree` data source and `section.settings.categoryIds`
 *  shape, Nova's own rounded/bold tile styling instead of Atelier's sharp
 *  square crops. Closes another of the real section-type gaps between the
 *  two themes (see `theme-02-nova/sections/index.ts`'s doc comment).
 *
 *  `section.settings.demoCategories` — see `FeaturedProductsSection.tsx`'s
 *  identical escape hatch: the Theme Library's static demo preview has no
 *  real store/category tree to fetch, so it supplies a fixed fictional
 *  list here instead of every theme's preview disclosing away every
 *  section that needs real data. A real store's sections never set this. */
function FeaturedCategoryGridSection({ section }: { section: Section }) {
  const { store } = useStorefront();
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
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: t.colors.ink, marginBottom: '36px', textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        {all === null ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse" style={{ aspectRatio: '1/1', background: t.colors.bgAlt, borderRadius: t.radius.md }} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {selected.map(c => {
              const tile = (
                <>
                  <div className="relative flex items-center justify-center" style={{ aspectRatio: '1/1', background: t.colors.bgAlt, overflow: 'hidden', borderRadius: t.radius.md }}>
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <ImageOff size={24} style={{ color: t.colors.inkMuted }} />
                    )}
                  </div>
                  <p className="text-center" style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 700, color: t.colors.ink }}>{c.name}</p>
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

registerNovaSection('featured_category_grid', (section: Section) => <FeaturedCategoryGridSection section={section} />);
