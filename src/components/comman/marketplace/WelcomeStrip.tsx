import { ChevronRight, ShieldCheck, Store, GraduationCap } from 'lucide-react';
import { CategoryBarIcon } from './MegaMenuBar';
import { BannerCarousel, type BannerCarouselItem } from './BannerCarousel';
import type { CategoryNode } from '@/api/services/categories';

// ── "Welcome to Solvexo" discovery strip — Categories for you and the real
// marketplace Hero Banner, in the spirit of Alibaba's homepage welcome
// section. ──
export function WelcomeStrip({
  categories, banners, onShopCategory, onNavigate,
}: {
  categories: CategoryNode[];
  /** Real marketplace/category hero banners — same data Marketplace's hero
   *  section used before this moved here. Omitted entirely (no empty
   *  placeholder box) when there's no banner configured for this placement. */
  banners: BannerCarouselItem[];
  onShopCategory: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const hasCategories = categories.length > 0;
  const hasHero = banners.length > 0;

  if (!hasCategories && !hasHero) return null;

  return (
    <div>
      {/* Welcome bar — pulled out above the card (its own row, not sharing
         the card's border/rounded corners), with breathing room below it.
         Real quick links to distinct destinations, not a restated copy of
         the utility row already above the hero. */}
      <div className="flex items-center justify-between gap-4 px-1 pb-3">
        <p className="text-[14px] sm:text-[15px] font-bold text-carbon">Welcome to Solvexo</p>
        <div className="hidden sm:flex items-center gap-5 text-[12px] font-medium text-charcoal">
          <button onClick={() => onNavigate('/faq')} className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <ShieldCheck size={14} className="text-brand-orange" /> Buyer Protection
          </button>
          <span className="w-px h-4 bg-bone" />
          <button onClick={() => onNavigate('/sellers')} className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <Store size={14} className="text-brand-orange" /> Sell on Solvexo
          </button>
          <span className="w-px h-4 bg-bone" />
          <button onClick={() => onNavigate('/EducationMarketplace')} className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <GraduationCap size={14} className="text-brand-orange" /> Education Marketplace
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_2.6fr] lg:grid-rows-[220px] gap-4">
        {/* Categories for you */}
        {hasCategories && (
          <div className="bg-cream rounded-[14px] p-3 flex flex-col lg:h-full lg:overflow-y-auto">
            <p className="text-[11.5px] font-bold text-carbon mb-2">Categories for you</p>
            <div className="flex flex-col gap-[2px]">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat._id}
                  onClick={() => onShopCategory(cat._id)}
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

        {/* Hero Banner — real marketplace/category banners, filling the rest
           of the row's width (only rendered when one is actually configured
           for this placement — no empty placeholder box otherwise).
           `fit="contain"` shows the whole uploaded image, small or large,
           without cropping. */}
        {hasHero && (
          <div className="relative min-h-[200px] lg:h-full rounded-[14px] overflow-hidden">
            <BannerCarousel entityType="banner" banners={banners} fit="contain" />
          </div>
        )}
      </div>
    </div>
  );
}
