import { useState, useEffect, useRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { TokenStorage } from '@/api/services/auth';
import { ProductImage } from '@/components/comman/marketplace/ProductCard';
import {
  Star, ChevronRight, ShieldCheck, BadgeCheck, ChevronDown, Tag, Store, Sparkles, Apple, Play, Flame,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { type CategoryNode } from '@/api/services/categories';
import { type PublicStoreListItem } from '@/api/services/store';
import { QrGlyph } from '@/components/comman/ui/AppPromoParts';
import { StoreFeatureCard } from '@/components/comman/ui';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol } from '@/utils/currency';

// ── Compact rail card — dense Flash Sale / Top Picks strip card ────────────────
export function RailCard({ product, onClick, badge, rank, size = 'md', stockLabel }: {
  product: MarketplaceProduct;
  onClick: (id: string) => void;
  badge?: ReactNode;
  rank?: number;
  size?: 'md' | 'sm';
  stockLabel?: string;
}) {
  const dv              = (product.variants ?? []).find(v => v.isDefault) ?? product.variants?.[0];
  const nativePrice     = dv?.price ?? null;
  const nativeCompareAt = dv?.compareAtPrice ?? null;
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const priceSymbol = currencySymbol(displayCurrency);
  const price     = nativePrice != null ? convert(nativePrice, dv?.currency) : null;
  const compareAt = nativeCompareAt != null ? convert(nativeCompareAt, dv?.currency) : null;
  const isSm      = size === 'sm';
  return (
    <button
      onClick={() => onClick(product._id)}
      className={clsx(
        'relative shrink-0 text-left bg-white rounded-[14px] border border-bone overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-[3px] hover:border-brand-orange/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
        isSm ? 'w-[92px] sm:w-[104px]' : 'w-[112px] sm:w-[126px]',
      )}
    >
      {/* Hover accent — same sweep-in top line used on TopStoreCard/Feature cards,
         so this rail card finally reads as the same design system, not a
         separate/older component. */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-[1] bg-gradient-to-r from-brand-orange to-[#F0A57A] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

      <div className="relative">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className={clsx('transition-transform duration-500 ease-out group-hover:scale-[1.06]', isSm ? 'h-[74px] sm:h-[80px]' : 'h-[92px] sm:h-[100px]')}
        />
        {badge && <div className="absolute top-[5px] left-[5px]">{badge}</div>}
        {rank != null && (
          <span className="absolute bottom-[5px] left-[5px] w-[18px] h-[18px] rounded-full bg-carbon/85 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center">
            {rank}
          </span>
        )}
      </div>
      <div className={isSm ? 'px-[7px] py-[6px]' : 'px-[9px] py-[8px]'}>
        <p className={clsx('font-semibold text-carbon leading-tight line-clamp-2', isSm ? 'text-[10px] mb-[3px] min-h-[24px]' : 'text-[11px] mb-[5px] min-h-[28px]')}>{product.name}</p>
        <div className="flex items-baseline gap-[4px]">
          <span className={clsx('font-bold text-carbon', isSm ? 'text-[11px]' : 'text-[12px]')}>{price != null ? `${priceSymbol}${price.toLocaleString()}` : '—'}</span>
          {compareAt != null && compareAt > (price ?? 0) && (
            <span className="text-[9.5px] text-slate line-through">{priceSymbol}{compareAt.toLocaleString()}</span>
          )}
        </div>
        <span className="flex items-center gap-[2px] text-[9.5px] text-slate mt-[3px]">
          <Star size={8} className={product.averageRating > 0 ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'} />
          {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
        </span>
        {stockLabel && (
          <span className="block text-[9px] font-semibold text-amber-600 mt-[3px]">{stockLabel}</span>
        )}
      </div>
    </button>
  );
}

// ── Category bar icon — reuses each category's real uploaded image, falls back to a tag glyph ──
export function CategoryBarIcon({ category }: { category: CategoryNode }) {
  if (category.image) {
    return (
      <span className="w-[24px] h-[24px] rounded-lg overflow-hidden shrink-0 bg-cream border border-bone">
        <img loading="lazy" decoding="async" src={category.image} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span className="w-[24px] h-[24px] rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
      <Tag size={13} className="text-brand-orange" />
    </span>
  );
}

// A curated starter-search list, not a live trending-terms feed (no search-
// analytics endpoint exists yet to back one) — labeled "Popular Searches"
// rather than "Trending" so it doesn't imply a live signal it isn't.
const CATEGORY_BAR_POPULAR_SEARCHES = ['Wireless Earbuds', 'Digital Planner', 'Desk Organizer', 'Handmade Jewelry', 'Watercolor Prints'];

// ── Full-width mega-menu content panes ───────────────────────────────────────
// Each of the 5 nav items below renders into the SAME shared full-width panel
// (see MegaMenuBar) rather than its own floating box — matching Alibaba's
// mega menu, which always opens as one bar spanning the page under the header.
// One label component for every section header inside any of the 5 panes —
// guarantees the "one consistent design language" requirement structurally
// (a shared component can't drift the way 8 copy-pasted <p> tags eventually do).
export function MegaSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.07em] mb-3">
      {children}
    </p>
  );
}

function CategoriesMegaContent({
  categories, spotlight, onShopCategory, onProductClick, onTrendingTerm,
}: {
  categories:     CategoryNode[];
  spotlight:      MarketplaceProduct[];
  onShopCategory: (id: string) => void;
  onProductClick: (id: string) => void;
  onTrendingTerm: (term: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(categories[0]?._id ?? null);
  const active = categories.find(c => c._id === activeId) ?? categories[0] ?? null;

  if (categories.length === 0) return <p className="text-[13px] text-slate">No categories yet.</p>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Column 1 — category links */}
      <div className="w-full lg:w-[210px] shrink-0 border-b lg:border-b-0 lg:border-r border-bone pb-5 lg:pb-0 pr-0 lg:pr-6">
        <MegaSectionLabel>Categories</MegaSectionLabel>
        <div className="flex flex-col gap-[2px] max-h-[400px] overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat._id}
              onMouseEnter={() => setActiveId(cat._id)}
              onFocus={() => setActiveId(cat._id)}
              onClick={() => onShopCategory(cat._id)}
              className={clsx(
                'w-full flex items-center gap-[10px] px-[10px] py-[9px] rounded-lg text-left bg-transparent border-none cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                activeId === cat._id ? 'bg-brand-pale-orange text-brand-orange' : 'text-charcoal hover:bg-cream',
              )}
            >
              <CategoryBarIcon category={cat} />
              <span className="flex-1 text-[12.5px] font-medium truncate">{cat.name}</span>
              <ChevronRight size={13} className={clsx('shrink-0 transition-transform', activeId === cat._id ? 'text-brand-orange translate-x-[2px]' : 'text-slate/50')} />
            </button>
          ))}
        </div>
      </div>

      {/* Column 2 — subcategory icon grid + trending searches */}
      <div className="w-full lg:flex-1 lg:min-w-0 border-b lg:border-b-0 lg:border-r border-bone pb-5 lg:pb-0 pr-0 lg:pr-8">
        <MegaSectionLabel>Subcategories</MegaSectionLabel>
        {active && active.children.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4 mb-6">
            {active.children.map(sub => (
              <button
                key={sub._id}
                onClick={() => onShopCategory(sub._id)}
                className="flex flex-col items-center gap-[7px] text-center bg-transparent border-none cursor-pointer p-0 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                <span className="w-14 h-14 rounded-full overflow-hidden bg-cream border border-bone flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:-translate-y-[2px] group-hover:border-brand-orange/40">
                  {sub.image
                    ? <img loading="lazy" decoding="async" src={sub.image} alt="" className="w-full h-full object-cover" />
                    : <Tag size={18} className="text-brand-orange opacity-50" />}
                </span>
                <span className="text-[11px] font-medium text-charcoal leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors">
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-slate mb-6">No subcategories yet — browse everything in {active?.name}.</p>
        )}

        <MegaSectionLabel>Popular Searches</MegaSectionLabel>
        <div className="flex flex-wrap gap-[6px]">
          {CATEGORY_BAR_POPULAR_SEARCHES.map(term => (
            <button
              key={term}
              onClick={() => onTrendingTerm(term)}
              className="px-[10px] py-[5px] rounded-full text-[11.5px] font-medium bg-cream text-charcoal border border-bone hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Column 3 — popular products (last column; Featured promo banner removed to give this a full row) */}
      <div className="w-full lg:w-auto lg:shrink-0">
        <MegaSectionLabel>Popular Products</MegaSectionLabel>
        {spotlight.length === 0 ? (
          <p className="text-[12px] text-slate">Nothing trending yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {spotlight.slice(0, 4).map(p => <RailCard key={p._id} product={p} onClick={onProductClick} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function FlashSaleMegaContent({ flashDeals, countdown, onProductClick }: {
  flashDeals: { product: MarketplaceProduct; pct: number }[];
  countdown:  { h: string; m: string; s: string };
  onProductClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="w-full lg:flex-1 lg:min-w-0">
        <MegaSectionLabel>Today's Flash Deals</MegaSectionLabel>
        {flashDeals.length === 0 ? (
          <p className="text-[12px] text-slate">No flash deals right now.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            {flashDeals.slice(0, 6).map(({ product, pct }) => {
              const dv = (product.variants ?? []).find(v => v.isDefault) ?? product.variants?.[0];
              const isPhysical = (product.productType ?? product.type ?? 'physical') === 'physical';
              // Real stock only — no fabricated "sold" percentage, since there's
              // no original-stock figure to compute one against honestly. A
              // variant marked unlimitedStock is never "low stock" either.
              const stock = isPhysical && !dv?.unlimitedStock ? (dv?.stock ?? 0) : null;
              return (
                <RailCard
                  key={product._id}
                  product={product}
                  onClick={onProductClick}
                  badge={<span className="px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-[#E11D48] text-white">-{pct}%</span>}
                  stockLabel={stock != null && stock > 0 && stock <= 5 ? `Only ${stock} left` : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="w-full lg:w-[220px] shrink-0 rounded-2xl bg-gradient-to-br from-[#E11D48] to-brand-deep-orange p-5 flex flex-col items-center text-center text-white">
        <Flame size={26} className="mb-2" />
        <p className="text-[15px] font-bold mb-1">Flash Sale</p>
        <p className="text-[11px] text-white/85 mb-4">Deep discounts, while stock lasts.</p>
        {/* Premium timer — matches the Homepage countdown language (equal boxes,
           thin border) rather than a plain colon-separated number string */}
        <div className="flex items-center gap-[6px]">
          {[['Hrs', countdown.h], ['Min', countdown.m], ['Sec', countdown.s]].map(([label, val]) => (
            <div key={label} className="flex flex-col items-center justify-center w-[42px] py-[6px] rounded-lg border border-white/25 bg-white/10">
              <span className="text-[15px] font-bold text-white tabular-nums leading-none">{val}</span>
              <span className="text-[7px] font-medium text-white/70 uppercase tracking-[0.08em] mt-[3px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TopPicksMegaContent({ topPicks, bestRated = [], onProductClick }: {
  topPicks: MarketplaceProduct[];
  /** A distinct, purely-rating-sorted slice — real signal, separate from
   *  topPicks' purchase+rating blend, so the panel isn't one section twice
   *  under two names. Optional/defaults to empty so callers that don't
   *  compute it (Education) just don't get a second section. */
  bestRated?: MarketplaceProduct[];
  onProductClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <MegaSectionLabel>Trending With Buyers</MegaSectionLabel>
        {topPicks.length === 0 ? (
          <p className="text-[12px] text-slate">No top picks yet.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            {topPicks.slice(0, 6).map(product => (
              <RailCard
                key={product._id}
                product={product}
                onClick={onProductClick}
                badge={product.purchaseCount > 0 ? (
                  <span className="px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-carbon/80 text-white backdrop-blur-sm">
                    {product.purchaseCount} sold
                  </span>
                ) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {bestRated.length > 0 && (
        <div className="pt-5 border-t border-bone">
          <MegaSectionLabel>Best Rated</MegaSectionLabel>
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            {bestRated.slice(0, 6).map(product => (
              <RailCard
                key={product._id}
                product={product}
                onClick={onProductClick}
                badge={product.averageRating > 0 ? (
                  <span className="flex items-center gap-[2px] px-[6px] py-[2px] rounded-[5px] text-[9px] font-bold bg-carbon/80 text-white backdrop-blur-sm">
                    <Star size={8} className="fill-white" /> {product.averageRating.toFixed(1)}
                  </span>
                ) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FeaturedSellersMegaContent({ topStores, onStoreClick }: {
  topStores: PublicStoreListItem[];
  onStoreClick: (slug: string) => void;
}) {
  return (
    <div>
      <MegaSectionLabel>Featured Stores</MegaSectionLabel>
      {topStores.length === 0 ? (
        <p className="text-[12px] text-slate">No featured stores yet.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {topStores.slice(0, 4).map(s => <StoreFeatureCard key={s.storeId} store={s} onClick={onStoreClick} />)}
        </div>
      )}
    </div>
  );
}

// ── "About Solvexo.store" mega content — featured cards + quick links +
// app-download promo panel, in the spirit of Alibaba's "About Alibaba.com" tab. ──
const ABOUT_CARDS: { Icon: LucideIcon; bg: string; title: string; description: string; path: string }[] = [
  { Icon: Sparkles,    bg: '#F5F0FB', title: 'Why Solvexo',       description: 'One platform for marketplace, downloads, and POS.', path: '/' },
  { Icon: ShieldCheck, bg: '#EBF7EF', title: 'Buyer Protection',  description: 'Secure payments and easy returns, every order.',    path: '/faq' },
  { Icon: Store,       bg: '#FBECE4', title: 'Sell on Solvexo',   description: 'Launch your own branded store — no coding.',        path: '/sellers' },
];
const ABOUT_QUICK_LINKS = [
  { label: 'Marketplace',         path: '/marketplace' },
  { label: 'Education Marketplace', path: '/EducationMarketplace' },
  { label: 'AI Commerce',         path: '/sellers' },
  { label: 'POS',                 path: '/sellers' },
  { label: 'Help Center',         path: '/faq' },
  { label: 'Contact',             path: '/contact-us' },
];

function AboutMegaContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Featured cards */}
      <div className="flex-1">
        <MegaSectionLabel>Discover Solvexo</MegaSectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ABOUT_CARDS.map(({ Icon, bg, title, description, path }) => (
            <button
              key={title}
              onClick={() => onNavigate(path)}
              className="relative flex flex-col items-start text-left bg-white rounded-2xl border border-bone overflow-hidden cursor-pointer group p-4 transition-all duration-300 hover:-translate-y-[3px] hover:border-brand-orange/25 hover:shadow-[0_10px_28px_rgba(20,15,10,0.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              {/* Sweep-in top accent — same hover language as RailCard/StoreFeatureCard */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-orange to-[#F0A57A] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 ring-1 ring-black/[0.04] transition-transform duration-200 group-hover:scale-[1.06]"
                style={{ background: bg }}
              >
                <Icon size={20} className="text-brand-orange" strokeWidth={1.75} />
              </div>

              <div className="flex items-center gap-[5px] mb-1">
                <p className="text-[13px] font-bold text-carbon leading-snug group-hover:text-brand-orange transition-colors">{title}</p>
                <ChevronRight size={13} className="text-brand-orange opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
              </div>
              <p className="text-[11px] text-slate leading-[1.45]">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="w-full lg:w-[180px] shrink-0 border-t lg:border-t-0 lg:border-l border-bone pt-5 lg:pt-0 pl-0 lg:pl-8">
        <MegaSectionLabel>Quick Links</MegaSectionLabel>
        <div className="flex flex-col gap-[2px] -mx-2">
          {ABOUT_QUICK_LINKS.map(item => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.path)}
              className="group flex items-center justify-between text-left text-[12.5px] text-charcoal bg-transparent border-none cursor-pointer rounded-lg px-2 py-[7px] hover:bg-cream hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              {item.label}
              <ChevronRight size={12} className="text-slate/40 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-orange transition-all duration-200" />
            </button>
          ))}
        </div>
      </div>

      {/* App download panel — orange/white gradient, dark-on-light badges since
          this panel sits on a light surface (unlike AppDownloadBanner's dark one). */}
      <div className="w-full lg:w-[210px] shrink-0 rounded-2xl bg-gradient-to-br from-brand-pale-orange to-white border border-bone p-5 flex flex-col items-center text-center">
        <p className="text-[12.5px] font-bold text-carbon mb-1">Get the Solvexo app</p>
        <p className="text-[11px] text-charcoal/70 leading-[1.5] mb-4">Shop faster, track orders, and get instant deal alerts.</p>
        <QrGlyph size={64} />
        <p className="text-[10px] text-charcoal/60 mt-2 mb-4">Scan to download</p>
        <div className="flex flex-col gap-[6px] w-full">
          <span className="flex items-center justify-center gap-[7px] rounded-[9px] bg-carbon px-3.5 py-[9px]">
            <Apple size={14} className="text-white shrink-0" />
            <span className="text-[11.5px] font-semibold text-white leading-none">App Store</span>
          </span>
          <span className="flex items-center justify-center gap-[7px] rounded-[9px] bg-carbon px-3.5 py-[9px]">
            <Play size={12} className="text-white shrink-0 fill-white" />
            <span className="text-[11.5px] font-semibold text-white leading-none">Google Play</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Shared full-width mega-menu bar — one bar hosts all 5 nav triggers plus a
// single mega-menu panel that spans the whole content container directly under
// the header, exactly like Alibaba: hovering any trigger swaps the panel's
// content; the panel stays open while the cursor is over the trigger row OR
// the panel itself (they share one DOM subtree, so no gap-crossing flicker),
// and closes only once the mouse leaves both. ──
type MegaMenuKey = 'categories' | 'flash-sale' | 'top-picks' | 'featured-sellers' | 'about';

interface MegaMenuExtraTrigger {
  key: Exclude<MegaMenuKey, 'categories'>;
  label: string;
  icon: LucideIcon;
  chevron: boolean;
  className: string;
}

// Default trigger set — Flash Sale / Top Picks / Featured Stores / About, each
// with its own icon and a filled hover/active pill (not a plain text link) so
// this reads as a real navigation feature, not an afterthought row.
const DEFAULT_EXTRA_TRIGGERS: MegaMenuExtraTrigger[] = [
  { key: 'flash-sale',       label: 'Flash Sale',      icon: Flame,    chevron: true,  className: '' },
  { key: 'top-picks',        label: 'Top Picks',       icon: Star,     chevron: true,  className: '' },
  { key: 'featured-sellers', label: 'Featured Stores', icon: Store,    chevron: true,  className: 'hidden sm:flex' },
  { key: 'about',            label: 'About Solvexo',   icon: Sparkles, chevron: false, className: 'hidden sm:flex' },
];

export function MegaMenuBar({
  categories = [], topPicks, bestRated = [], flashDeals, topStores, countdown,
  onShopCategory = () => {}, onProductClick, onStoreClick, onTrendingTerm = () => {}, onNavigate,
  categoriesLabel = 'All Categories', categoriesContent, extraTriggers = DEFAULT_EXTRA_TRIGGERS, compact = false,
}: {
  categories?: CategoryNode[];
  topPicks:   MarketplaceProduct[];
  /** Purely-rating-sorted slice for Top Picks' second "Best Rated" section —
   *  optional, defaults to empty (no second section) for callers that don't
   *  compute one. */
  bestRated?: MarketplaceProduct[];
  flashDeals: { product: MarketplaceProduct; pct: number }[];
  topStores:  PublicStoreListItem[];
  countdown:  { h: string; m: string; s: string };
  onShopCategory?: (id: string) => void;
  onProductClick: (id: string) => void;
  onStoreClick:   (slug: string) => void;
  onTrendingTerm?: (term: string) => void;
  onNavigate:     (path: string) => void;
  /** Trigger label for the first item — defaults to "All Categories" (Marketplace).
   *  Education passes "Grade Levels" instead. */
  categoriesLabel?: string;
  /** Override the first panel's content entirely — Education has no real
   *  CategoryNode tree, so it passes its own grade-level/subject panel here
   *  instead of forcing facet data into a category shape it doesn't have. */
  categoriesContent?: ReactNode;
  /** Triggers rendered after "All Categories" — defaults to Flash Sale/Top
   *  Picks/Featured Stores/About. Pass `[]` to render just the categories
   *  trigger (Marketplace, once that content has its own page sections). */
  extraTriggers?: MegaMenuExtraTrigger[];
  /** Small, plain-text scale (no icons, no hover pills) — the row reads as
   *  a thin Alibaba-style utility bar with breathing room in the middle,
   *  instead of the default larger app-nav look. Used when this row sits
   *  above the hero (Marketplace) rather than below it. */
  compact?: boolean;
}) {
  const [active, setActive] = useState<MegaMenuKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { clearCloseTimer(); closeTimer.current = setTimeout(() => setActive(null), 150); };
  const openMenu = (key: MegaMenuKey) => { clearCloseTimer(); setActive(key); };

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);

  useEffect(() => () => clearCloseTimer(), []);

  const triggerCls = (key: MegaMenuKey, extra?: string) => clsx(
    'group relative flex items-center gap-[6px] py-2 text-[13px] font-semibold bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
    active === key ? 'text-brand-orange' : 'text-charcoal hover:text-brand-orange',
    extra,
  );
  const triggerUnderlineCls = (key: MegaMenuKey) => clsx(
    'absolute left-0 right-0 -bottom-[2px] h-[2px] rounded-full bg-brand-orange origin-left transition-transform duration-200',
    active === key ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50',
  );

  return (
    <div className="relative" onMouseLeave={scheduleClose}>
      {/* ── Merged navigation row — "All Categories" + Flash Sale/Top Picks/Featured
         Stores/About triggers (left), Verified Sellers/Verified Stores/Track
         Order/Help Center/Contact (right). Previously two separate white rows
         (a "category line" and a "welcome line") that duplicated the same
         navigational weight — merged into one to remove that redundancy. ── */}
      <div className="bg-white border-b border-bone">
        <div className={clsx(
          'flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10',
          compact ? 'py-[7px]' : 'py-[11px]',
        )}>
          <div className={clsx('flex items-center min-w-0 flex-1 overflow-x-auto scrollbar-hide', compact ? 'gap-4' : 'gap-5')}>
            <button
              aria-haspopup="true"
              aria-expanded={active === 'categories'}
              onMouseEnter={() => openMenu('categories')}
              onClick={() => setActive(a => a === 'categories' ? null : 'categories')}
              className={triggerCls('categories', clsx('shrink-0', compact && 'text-[11.5px] py-1'))}
            >
              {categoriesLabel}
              <ChevronDown size={compact ? 12 : 14} className={clsx('transition-transform duration-200', active === 'categories' && 'rotate-180')} />
              <span className={triggerUnderlineCls('categories')} />
            </button>

            {extraTriggers.length > 0 && <span className="hidden sm:block w-px h-4 bg-bone shrink-0" />}

            {/* Segmented nav. Default: each trigger carries its own icon and a
               filled hover/active pill, so Flash Sale/Top Picks/Featured
               Stores/About read as real discovery features rather than a row
               of afterthought links. Compact: plain small text (no icon, no
               pill) — a thin Alibaba-style utility link, matching the
               Verified Sellers/Track Order group on the right. */}
            {extraTriggers.map(item => (
              <button
                key={item.key}
                aria-haspopup="true"
                aria-expanded={active === item.key}
                onMouseEnter={() => openMenu(item.key)}
                onClick={() => setActive(a => a === item.key ? null : item.key)}
                className={clsx(
                  'group flex items-center whitespace-nowrap shrink-0 border-none cursor-pointer transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                  compact
                    ? clsx('gap-1 py-1 text-[11.5px] font-medium bg-transparent', active === item.key ? 'text-brand-orange' : 'text-slate hover:text-brand-orange')
                    : clsx('gap-[6px] py-[7px] px-[11px] rounded-full text-[12.5px] font-semibold', active === item.key ? 'text-brand-deep-orange bg-brand-pale-orange' : 'text-charcoal hover:bg-cream'),
                  item.className,
                )}
              >
                {!compact && (
                  <item.icon
                    size={13}
                    className={clsx('shrink-0 transition-colors duration-200', active === item.key ? 'text-brand-orange' : 'text-slate group-hover:text-brand-orange')}
                  />
                )}
                {item.label}
                {item.chevron && <ChevronDown size={compact ? 11 : 12} className={clsx('transition-transform duration-200', active === item.key && 'rotate-180')} />}
              </button>
            ))}
          </div>

          <div className={clsx(
            'hidden lg:flex items-center shrink-0 text-slate whitespace-nowrap',
            compact ? 'gap-3 text-[11.5px]' : 'gap-4 text-[12.5px]',
          )}>
            <span className="flex items-center gap-1">
              <BadgeCheck size={compact ? 11 : 13} className="text-success" /> Verified Sellers
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={compact ? 11 : 13} className="text-success" /> Verified Stores
            </span>
            <span className="w-px h-4 bg-bone" />
            <button
              onClick={() => onNavigate(TokenStorage.isLoggedIn() ? '/account/orders' : '/login')}
              className="bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              Track Order
            </button>
            <button onClick={() => onNavigate('/faq')} className="bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
              Help Center
            </button>
            <button onClick={() => onNavigate('/contact-us')} className="bg-transparent border-none cursor-pointer text-slate hover:text-brand-orange transition-colors p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* ── Shared full-width panel ── */}
      <div
        onMouseEnter={clearCloseTimer}
        className={clsx(
          'absolute left-0 right-0 top-full z-50 bg-white border-b border-bone transition-all duration-200 origin-top',
          active ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none',
        )}
      >
        <div className="px-4 sm:px-6 lg:px-10 py-6 max-h-[70vh] overflow-y-auto">
          {active === 'categories' && (
            categoriesContent ?? (
              <CategoriesMegaContent categories={categories} spotlight={topPicks} onShopCategory={onShopCategory} onProductClick={onProductClick} onTrendingTerm={onTrendingTerm} />
            )
          )}
          {active === 'flash-sale' && (
            <FlashSaleMegaContent flashDeals={flashDeals} countdown={countdown} onProductClick={onProductClick} />
          )}
          {active === 'top-picks' && (
            <TopPicksMegaContent topPicks={topPicks} bestRated={bestRated} onProductClick={onProductClick} />
          )}
          {active === 'featured-sellers' && (
            <FeaturedSellersMegaContent topStores={topStores} onStoreClick={onStoreClick} />
          )}
          {active === 'about' && (
            <AboutMegaContent onNavigate={onNavigate} />
          )}
        </div>
      </div>
    </div>
  );
}
