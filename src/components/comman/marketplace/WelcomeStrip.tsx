import { useState } from 'react';
import { ChevronRight, ShieldCheck, Store, GraduationCap } from 'lucide-react';
import { Modal, DealsBanner } from '@/components/comman/ui';
import { CategoryBarIcon, CategoriesMegaContent } from './MegaMenuBar';
import { BannerCarousel, type BannerCarouselItem } from './BannerCarousel';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import type { CategoryNode } from '@/api/services/categories';

// ── "Welcome to Solvexo" discovery strip — Categories for you, the real
// marketplace Hero Banner, and the real DealsBanner side by side in one row,
// in the spirit of Alibaba's homepage welcome section. Clicking a category
// opens the same categories/subcategories/popular-products mega-panel the
// navbar's own "All Categories" dropdown already uses (`CategoriesMegaContent`,
// reused as-is, not reimplemented) inside a big modal — the Alibaba pattern:
// a left category list, its subcategory icon grid, and popular products,
// switching live as you click a different category on the left. ──
export function WelcomeStrip({
  categories, topPicks, banners, onShopCategory, onProductClick, onTrendingTerm, onNavigate,
}: {
  categories: CategoryNode[];
  /** Real spotlight products for the modal's "Popular Products" column —
   *  same `topPicks` the navbar's "All Categories" dropdown already shows
   *  there, not a separate/fabricated list. */
  topPicks: MarketplaceProduct[];
  /** Real marketplace/category hero banners — same data Marketplace's hero
   *  section used before this moved here. Omitted entirely (no empty
   *  placeholder box) when there's no banner configured for this placement. */
  banners: BannerCarouselItem[];
  onShopCategory: (id: string) => void;
  onProductClick: (id: string) => void;
  onTrendingTerm: (term: string) => void;
  onNavigate: (path: string) => void;
}) {
  const hasCategories = categories.length > 0;
  const hasHero = banners.length > 0;

  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);

  if (!hasCategories && !hasHero) return null;

  return (
    <div>
      {/* Welcome bar — pulled out above the card (its own row, not sharing
         the card's border/rounded corners), with breathing room below it.
         Real quick links to distinct destinations, not a restated copy of
         the utility row already above the hero. Sized up as a real section
         header (bigger heading, chip-style icon links) rather than a thin
         utility line, with a border to give it visual weight. */}
      <div className="flex items-center justify-between gap-4 px-1 pb-4 mb-1 border-b border-bone">
        <p className="text-[19px] sm:text-[22px] font-bold text-carbon tracking-[-0.01em]">Welcome to Solvexo</p>
        <div className="hidden sm:flex items-center gap-[6px] text-[13.5px] font-semibold text-charcoal">
          <button onClick={() => onNavigate('/faq')} className="flex items-center gap-[9px] rounded-full pl-[5px] pr-[14px] py-[5px] bg-cream border border-transparent cursor-pointer transition-all duration-150 hover:bg-brand-pale-orange/70 hover:border-brand-orange/15 hover:text-brand-deep-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <span className="flex size-8 items-center justify-center rounded-full bg-white shrink-0 shadow-card"><ShieldCheck size={16} className="text-brand-orange" /></span>
            Buyer Protection
          </button>
          <button onClick={() => onNavigate('/sellers')} className="flex items-center gap-[9px] rounded-full pl-[5px] pr-[14px] py-[5px] bg-cream border border-transparent cursor-pointer transition-all duration-150 hover:bg-brand-pale-orange/70 hover:border-brand-orange/15 hover:text-brand-deep-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <span className="flex size-8 items-center justify-center rounded-full bg-white shrink-0 shadow-card"><Store size={16} className="text-brand-orange" /></span>
            Sell on Solvexo
          </button>
          <button onClick={() => onNavigate('/EducationMarketplace')} className="flex items-center gap-[9px] rounded-full pl-[5px] pr-[14px] py-[5px] bg-cream border border-transparent cursor-pointer transition-all duration-150 hover:bg-brand-pale-orange/70 hover:border-brand-orange/15 hover:text-brand-deep-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <span className="flex size-8 items-center justify-center rounded-full bg-white shrink-0 shadow-card"><GraduationCap size={16} className="text-brand-orange" /></span>
            Education Marketplace
          </button>
        </div>
      </div>

      {/* One row: Categories for you, the real Hero Banner, and the real
         DealsBanner — side by side, all visible together, not stacked. */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.4fr_1fr] lg:grid-rows-[220px] gap-4">
        {/* Categories for you — click opens the full categories/subcategories/
           popular-products mega-panel as a big modal. */}
        {hasCategories && (
          <div className="bg-cream rounded-[14px] p-3 flex flex-col lg:h-full lg:overflow-y-auto">
            <p className="text-[11.5px] font-bold text-carbon mb-2">Categories for you</p>
            <div className="flex flex-col gap-[2px]">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setModalCategoryId(cat._id)}
                  className="group flex items-center gap-2 rounded-lg px-1.5 py-[6px] bg-transparent border-none text-left cursor-pointer transition-colors duration-150 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  <CategoryBarIcon category={cat} />
                  <span className="flex-1 min-w-0 text-[11.5px] font-medium text-charcoal truncate">{cat.name}</span>
                  <ChevronRight size={12} className="shrink-0 text-slate/50 group-hover:text-brand-orange transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hero Banner — real marketplace/category banners, filling the same
           fixed-size card as DealsBanner beside it (default `fit="cover"`) —
           one consistent size every banner image fills completely, premium/
           production look, instead of letterboxing around whatever aspect
           ratio each upload happens to be. */}
        {hasHero && (
          <div className="relative min-h-[200px] lg:h-full rounded-[14px] overflow-hidden">
            <BannerCarousel entityType="banner" banners={banners} />
          </div>
        )}

        {/* DealsBanner — the real campaign banner, right beside the hero, not
           stacked below it. Just the campaign image (compact mode), filling
           the card the same way. */}
        <DealsBanner compact className="min-h-[200px] lg:h-full" />
      </div>

      {/* Categories mega-modal — the exact same panel the navbar's "All
         Categories" dropdown shows (categories list / subcategory icon grid
         / popular products), just as a big modal here instead of a hover
         panel, opened already focused on whichever category was clicked. */}
      {modalCategoryId && (
        <Modal title="Categories for you" onClose={() => setModalCategoryId(null)} width={900}>
          <CategoriesMegaContent
            categories={categories}
            spotlight={topPicks}
            showSpotlight={false}
            initialActiveId={modalCategoryId}
            fixedHeight={520}
            onShopCategory={id => { onShopCategory(id); setModalCategoryId(null); }}
            onProductClick={id => { onProductClick(id); setModalCategoryId(null); }}
            onTrendingTerm={term => { onTrendingTerm(term); setModalCategoryId(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
