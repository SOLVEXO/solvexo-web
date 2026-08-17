import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
import { Footer, SkeletonBox, CoverImage, TrustServiceStrip, ClosingCtaBanner } from '@/components/comman/ui';
import { FlashSaleCard, FlashSaleCardSkeleton } from '@/components/comman/marketplace/FlashSaleCard';
import {
  ArrowRight, ArrowLeft, ShoppingBag, BookOpen, Download, Store, Sparkles,
  Star, TrendingUp, BadgeCheck, Crown, UserPlus, UserCheck, Quote,
  Gift, BarChart3, ShieldCheck, Globe, Rocket, Headphones, Zap, Truck,
  RotateCcw, Loader2, Tag, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  apiGetTopStores, apiFollowStore, apiGetPlatformStats, apiGetTestimonials,
  type PublicStoreListItem, type PlatformStats, type Testimonial,
} from '@/api/services/store';
import { apiGetAllProducts, type MarketplaceProduct } from '@/api/services/marketplace';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import homepageHero from '@/assets/homepage-hero.webp';

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'USD' });

// ── Premium store spotlight card — 16:9 cover, overlapping logo, badge stack,
// rating/followers/products stat row, and Follow + Visit actions. Modeled on
// marketplace "featured seller" cards (Amazon/Etsy/Alibaba style storefront tiles). ──
function TopStoreCard({ store, onClick }: { store: PublicStoreListItem; onClick: () => void }) {
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const { requireAuth } = useAuthGate();
  const toast = useToast();

  const isVerified  = store.badges?.includes('verified');
  const isFeatured  = store.badges?.includes('featured');
  const isTopSeller = store.badges?.includes('top_seller');
  const isTopRated  = store.reviewCount > 0 && store.averageRating >= 4.8;

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followBusy) return;
    requireAuth(async () => {
      setFollowBusy(true);
      try {
        const res = await apiFollowStore(store.storeId);
        setFollowing(res.data.following);
        toast.success(res.data.following ? 'Following store' : 'Unfollowed store');
      } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update follow status.'); }
      finally { setFollowBusy(false); }
    }, 'Sign in to follow this store.');
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      className="group h-full flex flex-col shrink-0 w-[210px] sm:w-auto snap-start bg-white border border-bone rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-[3px] hover:bg-brand-pale-orange/[0.12]"
    >
      {/* Top accent — sweeps in on hover, same language as the Feature Category cards */}
      <div className="h-[4px] shrink-0 bg-gradient-to-r from-brand-orange to-[#f0a57a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

      {/* Cover — logo below overlaps up into it, same visual language as StoreFeatureCard */}
      <CoverImage
        src={store.coverImage}
        imgClassName="transition-transform duration-500 group-hover:scale-105"
        className="h-[64px]"
      />

      <div className="relative flex-1 flex flex-col px-4 pb-4 -mt-6">
        {/* Logo + name/rating — inline header instead of a stacked layout */}
        <div className="flex items-center gap-[10px] mb-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-bone p-[3px] shrink-0 transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full rounded-[9px] bg-brand-pale-orange flex items-center justify-center overflow-hidden">
              {store.logo
                ? <img loading="lazy" decoding="async" src={store.logo} alt="" className="w-full h-full object-cover" />
                : <Store size={18} className="text-brand-orange" />}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[4px] min-w-0">
              <p className="text-[13px] font-bold text-carbon leading-tight truncate">{store.name}</p>
              {isVerified && <BadgeCheck size={12} className="text-info fill-info/15 shrink-0" />}
            </div>
            <div className="flex items-center gap-[4px] text-[10px] text-slate mt-[2px]">
              <Star size={9} className="text-brand-orange fill-brand-orange shrink-0" />
              <span className="font-semibold text-carbon">{store.averageRating > 0 ? store.averageRating.toFixed(1) : 'New'}</span>
              <span className="text-bone">•</span>
              <span className="truncate">{compactNumber.format(store.followersCount)} followers</span>
            </div>
          </div>
        </div>

        {(isFeatured || isTopSeller || isTopRated || store.sellerType) && (
          <div className="flex flex-wrap gap-[4px] mb-2">
            {isFeatured && (
              <span className="inline-flex items-center gap-1 px-[7px] py-[3px] rounded-full bg-accent-violet text-white text-[9px] font-bold">
                <Crown size={9} /> Platinum
              </span>
            )}
            {isTopSeller && (
              <span className="inline-flex items-center gap-1 px-[7px] py-[3px] rounded-full bg-carbon text-white text-[9px] font-bold">
                <TrendingUp size={9} /> Top Seller
              </span>
            )}
            {isTopRated && (
              <span className="inline-flex items-center gap-1 px-[7px] py-[3px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[9px] font-bold">
                <Star size={9} className="fill-brand-orange text-brand-orange" /> Top Rated
              </span>
            )}
            {store.sellerType && (
              <span className="inline-block px-[7px] py-[3px] rounded-full bg-cream text-[9px] font-medium text-charcoal capitalize">
                {store.sellerType}
              </span>
            )}
          </div>
        )}

        <p className="text-[10.5px] text-slate leading-snug line-clamp-2 min-h-[27px] mb-3">
          {store.description || 'New on Solvexo'}
        </p>

        <p className="text-[9.5px] text-slate mb-3">
          {store.productCount != null ? compactNumber.format(store.productCount) : '—'} products · {compactNumber.format(store.reviewCount)} reviews
        </p>

        {/* Footer — Follow + Visit side by side instead of a floating corner pill.
            mt-auto pins it to the card's bottom edge regardless of how much
            content (badges, description length) sits above it on each card. */}
        <div className="flex items-center gap-[6px] mt-auto">
          <button
            onClick={handleFollow}
            disabled={followBusy}
            className={clsx(
              'flex-1 inline-flex items-center justify-center gap-[4px] px-[9px] py-[7px] rounded-lg text-[11px] font-semibold border cursor-pointer transition-all duration-150',
              following
                ? 'bg-carbon/5 border-bone text-charcoal'
                : 'bg-white border-bone text-charcoal hover:border-brand-orange/40 hover:text-brand-orange',
              followBusy && 'opacity-60 cursor-wait',
            )}
          >
            {following ? <UserCheck size={11} /> : <UserPlus size={11} />}
            {following ? 'Following' : 'Follow'}
          </button>
          <Button variant="primary" size="sm" className="flex-1" onClick={e => { e.stopPropagation(); onClick(); }}>
            Visit <ArrowRight size={12} className="inline align-middle ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Compact platform-capability strip directly under the hero — bg values
// reference existing theme tokens via CSS var (rendered through an inline
// style, see PLATFORM_HIGHLIGHTS.map below) instead of repeating hex values
// as untracked magic numbers.
const PLATFORM_HIGHLIGHTS: { Icon: LucideIcon; title: string; sub: string; bg: string }[] = [
  { Icon: ShoppingBag,  title: 'Marketplace',      sub: 'Grow your business',   bg: 'var(--color-brand-pale-orange)' },
  { Icon: BookOpen,     title: 'Educational',      sub: 'Sell courses & more',  bg: 'var(--color-info-bg)' },
  { Icon: Download,     title: 'Digital Products', sub: 'Instant downloads',    bg: 'var(--color-success-bg)' },
  { Icon: Sparkles,     title: 'AI Commerce',      sub: 'Smart tools to grow',  bg: 'var(--color-accent-violet-bg)' },
  { Icon: ShieldCheck,  title: 'Secure & Safe',    sub: 'Buyer protection',     bg: 'var(--color-warning-bg)' },
  { Icon: Gift,         title: 'Loyalty Rewards',  sub: 'Earn points & perks',  bg: 'var(--color-brand-pale-orange)' },
];

const HERO_TRUST_ROW: { Icon: LucideIcon; label: string }[] = [
  { Icon: Rocket,      label: 'Easy to Start' },
  { Icon: ShieldCheck, label: 'Secure Payments' },
  { Icon: Globe,       label: 'Global Reach' },
  { Icon: Headphones,  label: '24/7 Support' },
];

const HOME_TRUST_BAR: { Icon: LucideIcon; label: string; sub: string }[] = [
  { Icon: Tag,         label: 'Best Prices',     sub: 'Unbeatable deals' },
  { Icon: Truck,       label: 'Free Shipping',   sub: 'On orders over Rs. 3,000' },
  { Icon: RotateCcw,   label: 'Easy Returns',    sub: '30-day money back' },
  { Icon: ShieldCheck, label: 'Secure Payments', sub: '100% protected' },
];

export function Homepage() {
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  usePageTitle('Home');

  const [topStores, setTopStores] = useState<PublicStoreListItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  const [productPool, setProductPool] = useState<MarketplaceProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const categoriesTrackRef = useRef<HTMLDivElement>(null);
  const [categoriesActiveIndex, setCategoriesActiveIndex] = useState(0);
  const [categoriesAutoplayPaused, setCategoriesAutoplayPaused] = useState(false);

  const { addToCart, adding } = useCartContext();
  const { isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();
  const countdown = useCountdownToMidnight();

  const storesTrackRef = useRef<HTMLDivElement>(null);
  const [storesActiveIndex, setStoresActiveIndex] = useState(0);

  const flashTrackRef = useRef<HTMLDivElement>(null);
  const scrollFlashDeals = (dir: 1 | -1) => {
    const track = flashTrackRef.current;
    if (!track) return;
    const card = track.children[0] as HTMLElement | undefined;
    const step = (card?.offsetWidth ?? 200) + 24; // card width + gap-6
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;
    apiGetTopStores(10)
      .then(res => { if (!cancelled) setTopStores(res.data?.stores ?? []); })
      .catch(() => { /* non-critical section — homepage still works without it */ })
      .finally(() => { if (!cancelled) setStoresLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Auto-slide the Top Stores row — advances ONE card at a time (not a full
  // page), loops back to the start once it reaches the last card, pauses
  // while the user's cursor is over it so it never fights a manual scroll/swipe.
  const [storesAutoplayPaused, setStoresAutoplayPaused] = useState(false);
  useEffect(() => {
    if (storesAutoplayPaused || topStores.length === 0) return;
    const id = setInterval(() => {
      const track = storesTrackRef.current;
      if (!track) return;
      const cards = Array.from(track.children) as HTMLElement[];
      if (cards.length === 0) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const nextIndex = atEnd ? 0 : storesActiveIndex + 1;
      track.scrollTo({ left: cards[nextIndex]?.offsetLeft ?? 0, behavior: 'smooth' });
      setStoresActiveIndex(nextIndex);
    }, 3000);
    return () => clearInterval(id);
  }, [storesAutoplayPaused, topStores.length, storesActiveIndex]);

  const goToStoreCard = (index: number) => {
    const track = storesTrackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    setStoresActiveIndex(index);
  };

  // Auto-slide Shop by Category — same one-card-at-a-time, loop-back-at-the-
  // end, pause-on-hover/touch pattern as the Top Stores row above, so this
  // one row keeps moving on its own on every screen size instead of needing
  // a responsive multi-column grid.
  useEffect(() => {
    if (categoriesAutoplayPaused || categories.length === 0) return;
    const id = setInterval(() => {
      const track = categoriesTrackRef.current;
      if (!track) return;
      const cards = Array.from(track.children) as HTMLElement[];
      if (cards.length === 0) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const nextIndex = atEnd ? 0 : categoriesActiveIndex + 1;
      track.scrollTo({ left: cards[nextIndex]?.offsetLeft ?? 0, behavior: 'smooth' });
      setCategoriesActiveIndex(nextIndex);
    }, 2600);
    return () => clearInterval(id);
  }, [categoriesAutoplayPaused, categories.length, categoriesActiveIndex]);

  // Pool used to surface real, currently-active discounts (Flash Sale) — same
  // approach as Marketplace's own flash-deal computation, so the "-X% OFF"
  // badges always reflect a genuine compareAtPrice set by the seller. Also
  // doubles as the source for the hero's device-mockup product thumbnails,
  // so nothing in the hero is a fabricated/stock image.
  useEffect(() => {
    let cancelled = false;
    apiGetAllProducts(1, 24)
      .then(res => { if (!cancelled) setProductPool(res.data?.products ?? []); })
      .catch(() => { /* non-critical — flash sale section just stays hidden */ })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGetCategoryTree()
      .then(res => { if (!cancelled) setCategories(res.data ?? []); })
      .catch(() => { /* non-critical — section just stays hidden */ })
      .finally(() => { if (!cancelled) setCategoriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGetPlatformStats()
      .then(res => { if (!cancelled) setStats(res.data); })
      .catch(() => { /* non-critical — stat strip just stays hidden */ })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGetTestimonials(5)
      .then(res => { if (!cancelled) setTestimonials(res.data ?? []); })
      .catch(() => { /* non-critical — section just stays hidden */ })
      .finally(() => { if (!cancelled) setTestimonialsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const flashDeals = productPool
    .map(p => {
      const dv = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
      const price = dv?.price ?? 0;
      const compareAt = dv?.compareAtPrice ?? null;
      const pct = compareAt != null && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
      return { product: p, pct };
    })
    .filter(x => x.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  const handleCardClick = useCallback((slug: string) => navigate(`/product/${slug}`), [navigate]);
  const handleAddToCart = useCallback((e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => {
    e.stopPropagation();
    if (variantId) addToCart(id, variantId, type);
  }, [addToCart]);
  const handleToggleWishlist = useCallback((e: React.MouseEvent, id: string, variantId: string) => {
    e.stopPropagation();
    if (variantId) toggleWishlist(id, variantId);
  }, [toggleWishlist]);

  // Shared by the hero stat row and the closing "Trusted by" band — real
  // platform numbers only, each entry omitted entirely until its backing
  // field has actually loaded (no fake placeholders).
  const statItems = stats ? [
    { value: `${compactNumber.format(stats.sellersCount)}+`,  label: 'Active Sellers' },
    { value: `${compactCurrency.format(stats.gmv)}+`,         label: 'GMV Processed' },
    { value: `${compactNumber.format(stats.buyersCount)}+`,   label: 'Happy Buyers' },
    ...(stats.ratingCount > 0 ? [{ value: `${stats.avgRating.toFixed(1)}★`, label: 'Store Rating' }] : []),
  ] : [];

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────────────── */}
      <section className="mesh-brand grain-overlay relative overflow-hidden">

        {/* Ambient glow orbs on top of the mesh — kept for extra drift/life,
           the mesh itself supplies the base layered depth. */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="auth-float absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full -top-24 -right-20 bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] opacity-[0.18] blur-3xl" />
          <div className="auth-float-slow absolute w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] rounded-full -bottom-16 right-[30%] bg-[radial-gradient(circle,var(--color-accent-violet)_0%,transparent_70%)] opacity-[0.12] blur-3xl" />
        </div>

        <div className="relative z-[1] px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-14 sm:pb-18 lg:pb-24 flex items-center justify-between gap-10">
          <div className="max-w-[560px]">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-[14px] py-[5px] mb-5 border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.12)]">
              <Sparkles size={12} className="text-brand-orange shrink-0" />
              <span className="text-[12px] font-medium text-brand-orange">
                AI-Powered Commerce Platform
              </span>
            </div>

            <h1 className="font-serif text-[30px] sm:text-[40px] lg:text-[50px] leading-[1.1] tracking-[-0.01em] font-semibold text-white mb-4">
              The Commerce OS for{' '}
              <span className="bg-gradient-to-r from-brand-orange to-[#f0a57a] bg-clip-text text-transparent">
                Sellers, Creators &amp; Educators
              </span>
            </h1>

            <p className="text-[13px] sm:text-sm text-[#b0aea8] leading-[1.75] mb-6 max-w-[440px]">
              Sell physical products, digital downloads and educational resources — all in one powerful platform.
            </p>

            {/* Trust row — quick-scan reasons to stay, ahead of the CTAs */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
              {HERO_TRUST_ROW.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-[6px]">
                  <Icon size={14} className="text-brand-orange shrink-0" />
                  <span className="text-[12px] text-[#c7c5bf] whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Button size="md" onClick={() => navigate('/marketplace')} className="w-full sm:w-auto">
                Explore Marketplace <ArrowRight size={13} className="inline align-middle ml-1" />
              </Button>
              <button
                onClick={sellEntry.go}
                disabled={sellEntry.loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer disabled:opacity-60"
              >
                {sellEntry.loading ? <Loader2 size={13} className="animate-spin" /> : null}
                Start Selling
              </button>
            </div>

            {/* Stats — real platform numbers, hidden until they load (no fake
               placeholders), plain columns with thin dividers. */}
            {(statsLoading || statItems.length > 0) && (
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {statsLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <SkeletonBox width={52} height={22} className="mb-1" />
                        <SkeletonBox width={72} height={11} />
                      </div>
                    ))
                  : statItems.map(({ value, label }, i) => (
                      <div key={label} className={clsx(i > 0 && 'pl-6 border-l border-white/10')}>
                        <p className="text-[20px] sm:text-[22px] font-bold text-white leading-none">{value}</p>
                        <p className="text-[10px] sm:text-[11px] text-white/50 mt-1 whitespace-nowrap">{label}</p>
                      </div>
                    ))}
              </div>
            )}
          </div>

          {/* Hero visual — single pre-composed graphic (devices + real
             product cutouts), desktop only, fills the hero's right-side
             negative space. */}
          <div className="hidden lg:block relative w-[700px] shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] opacity-[0.22] blur-2xl" />
            </div>
            <img
              src={homepageHero}
              alt="Solvexo marketplace preview"
              width={2440}
              height={1636}
              className="relative z-[1] w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* ── Platform highlights strip — directly under the hero, no gap ──────────── */}
      <section className="bg-white border-b border-bone">
        <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-7">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-4">
            {PLATFORM_HIGHLIGHTS.map((f, i) => (
              <div key={f.title} className={clsx('flex items-center gap-3', i > 0 && 'lg:border-l lg:border-bone lg:pl-4')}>
                <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: f.bg }}>
                  <f.Icon size={18} className="text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <p className="text-[12.5px] font-bold text-carbon leading-tight">{f.title}</p>
                  <p className="text-[10.5px] text-slate leading-tight mt-[1px]">{f.sub}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flash Sale — real, live discounts only ───────────────────────────────── */}
      {(productsLoading || flashDeals.length > 0) && (
        <section className="py-12 sm:py-14 lg:py-16 border-b border-bone bg-white">
          <div className="px-4 sm:px-6 lg:px-12">
            {/* Header — title + live urgency indicator on the left, compact
               countdown + View All on the right, all on one aligned baseline */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
              <div>
                <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-[6px]">
                  Limited Time Offers
                </p>
                <h2 className="font-serif text-[26px] sm:text-[32px] font-bold text-carbon leading-[1.2] mb-1 flex items-center gap-2">
                  Flash Sale <Zap size={22} className="text-brand-orange fill-brand-orange" />
                </h2>
                <p className="flex items-center gap-[6px] text-[12.5px] sm:text-[13px] text-slate max-w-md">
                  <span className="relative flex h-[6px] w-[6px] shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e11d48] opacity-75" />
                    <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#e11d48]" />
                  </span>
                  Ends tonight — grab these deals before they're gone.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Timer — one compact, understated pill instead of three heavy
                   solid blocks, so it reads as a detail, not the headline */}
                <div className="flex items-center gap-[7px] rounded-full border border-bone bg-cream px-[14px] py-[7px]">
                  <span className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em]">Ends in</span>
                  <span className="flex items-center gap-[3px] text-[13px] font-bold text-carbon tabular-nums">
                    <span>{countdown.h}h</span>
                    <span className="text-slate/50">:</span>
                    <span>{countdown.m}m</span>
                    <span className="text-slate/50">:</span>
                    <span className="countdown-tick">{countdown.s}s</span>
                  </span>
                </div>
                <Button variant="link" size="sm" onClick={() => navigate('/marketplace')} className="shrink-0 whitespace-nowrap">
                  View All Deals <ArrowRight size={13} className="inline align-middle ml-1" />
                </Button>
              </div>
            </div>

            {/* Carousel — horizontal scroll, generous gaps and edge padding so
               cards never feel compressed, plus explicit prev/next arrows
               (in addition to native swipe/scroll) for a mouse-driven desktop
               user who won't think to drag the row. */}
            <div className="relative">
              {!productsLoading && flashDeals.length > 5 && (
                <button
                  onClick={() => scrollFlashDeals(-1)}
                  aria-label="Previous deals"
                  className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-[1] w-9 h-9 rounded-full bg-white border border-bone shadow-raised items-center justify-center cursor-pointer hover:border-brand-orange/40 hover:text-brand-orange transition-colors"
                >
                  <ArrowLeft size={15} />
                </button>
              )}
              <div ref={flashTrackRef} className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0">
                {productsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="shrink-0 w-[164px] sm:w-[calc((100%-32px)/3)] lg:w-[calc((100%-64px)/5)]">
                        <FlashSaleCardSkeleton />
                      </div>
                    ))
                  : flashDeals.map(({ product }) => {
                      const variants = product.variants ?? [];
                      const defVariant = variants.find(v => v.isDefault) ?? variants[0];
                      const vId = defVariant?._id ?? '';
                      return (
                        <div key={product._id} className="shrink-0 snap-start w-[164px] sm:w-[calc((100%-32px)/3)] lg:w-[calc((100%-64px)/5)]">
                          <FlashSaleCard
                            product={product}
                            onClick={handleCardClick}
                            isAdding={adding === vId}
                            onAddToCart={handleAddToCart}
                            isWishlisted={isWishlisted(product._id, vId)}
                            isWishlisting={wishlisting === vId}
                            onToggleWishlist={handleToggleWishlist}
                          />
                        </div>
                      );
                    })}
              </div>
              {!productsLoading && flashDeals.length > 4 && (
                <button
                  onClick={() => scrollFlashDeals(1)}
                  aria-label="Next deals"
                  className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[1] w-9 h-9 rounded-full bg-white border border-bone shadow-raised items-center justify-center cursor-pointer hover:border-brand-orange/40 hover:text-brand-orange transition-colors"
                >
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust bar — policy statements, not measured metrics ──────────────────── */}
      <TrustServiceStrip variant="dark" items={HOME_TRUST_BAR} />

      {/* ── 3-up promo row — Sell / AI tools / Loyalty, each a real platform feature ── */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-orange to-brand-deep-orange p-5 flex items-center gap-4 min-h-[150px]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute right-3 -top-9 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white mb-1">Become a Seller</p>
              <p className="text-[12px] text-white/85 leading-snug mb-4">Start your business in minutes.</p>
              <Button variant="dark" size="sm" onClick={sellEntry.go} loading={sellEntry.loading} className="w-fit">
                Start Selling <ArrowRight size={12} className="inline align-middle ml-1" />
              </Button>
            </div>
            <div className="relative z-[1] shrink-0 w-[72px] h-[72px] rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
              <Store size={32} className="text-white" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-carbon p-5 flex items-center gap-4 min-h-[150px]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-accent-violet/15" />
            <div className="absolute right-3 -top-9 w-20 h-20 rounded-full bg-accent-violet/10" />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white mb-1">AI Commerce Tools</p>
              <p className="text-[12px] text-white/60 leading-snug mb-4">Smart features to boost your sales.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/sellers')} className="w-fit">
                Explore Tools <ArrowRight size={12} className="inline align-middle ml-1" />
              </Button>
            </div>
            <div className="relative z-[1] shrink-0 w-[72px] h-[72px] rounded-full bg-accent-violet/20 border border-accent-violet/30 flex items-center justify-center">
              <BarChart3 size={32} className="text-accent-violet" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-brand-pale-orange p-5 flex items-center gap-4 min-h-[150px]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/40" />
            <div className="absolute right-3 -top-9 w-20 h-20 rounded-full bg-white/30" />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="text-[15px] font-bold text-carbon mb-1">Earn Rewards</p>
              <p className="text-[12px] text-charcoal/70 leading-snug mb-4">Give buyers points, tiers &amp; perks.</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/sellers')} className="w-fit">
                Explore Tools <ArrowRight size={12} className="inline align-middle ml-1" />
              </Button>
            </div>
            <div className="relative z-[1] shrink-0 w-[72px] h-[72px] rounded-full bg-white border border-white flex items-center justify-center shadow-md">
              <Gift size={32} className="text-brand-orange" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop by Category — real category-tree data ───────────────────────────── */}
      {(categoriesLoading || categories.length > 0) && (
        <section className="py-10 sm:py-12 lg:py-14 border-t border-bone">
          <div className="px-4 sm:px-6 lg:px-12">
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-[6px]">
                  Browse Top Categories
                </p>
                <h2 className="font-serif text-[22px] sm:text-[26px] font-bold text-carbon leading-[1.2]">
                  Shop by Category
                </h2>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate('/marketplace')} className="shrink-0 whitespace-nowrap">
                View All <ArrowRight size={13} className="inline align-middle ml-1" />
              </Button>
            </div>

            <div
              ref={categoriesTrackRef}
              onMouseEnter={() => setCategoriesAutoplayPaused(true)}
              onMouseLeave={() => setCategoriesAutoplayPaused(false)}
              onTouchStart={() => setCategoriesAutoplayPaused(true)}
              onTouchEnd={() => setTimeout(() => setCategoriesAutoplayPaused(false), 1500)}
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory scroll-smooth"
            >
              {categoriesLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="w-[130px] sm:w-[150px] shrink-0 rounded-2xl border border-bone bg-white overflow-hidden">
                      <div className="aspect-square animate-pulse bg-bone" />
                      <div className="p-3">
                        <SkeletonBox width="70%" height={12} className="mb-2" />
                        <SkeletonBox width="50%" height={10} />
                      </div>
                    </div>
                  ))
                : categories.slice(0, 12).map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => navigate(`/marketplace/${cat.slug}`)}
                      className="group w-[130px] sm:w-[150px] shrink-0 snap-start flex flex-col text-left rounded-2xl border border-bone bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:border-brand-orange/30 hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                    >
                      <span className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-brand-pale-orange to-[#fdf6f0]">
                        {cat.image
                          ? <img loading="lazy" decoding="async" src={cat.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          : <span className="absolute inset-0 flex items-center justify-center"><Tag size={26} className="text-brand-orange/50" /></span>}
                      </span>
                      <span className="flex flex-col px-3 py-3">
                        <span className="text-[12.5px] font-semibold text-charcoal leading-tight line-clamp-1 mb-[6px] group-hover:text-brand-orange transition-colors">
                          {cat.name}
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] text-slate whitespace-nowrap">
                            {typeof cat.productCount === 'number' && cat.productCount > 0 ? `${compactNumber.format(cat.productCount)}+ Items` : 'Browse'}
                          </span>
                          <span className="shrink-0 w-6 h-6 rounded-full bg-brand-pale-orange text-brand-orange flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors">
                            <ChevronRight size={13} />
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Stores ───────────────────────────────────────────────────────────── */}
      {(storesLoading || topStores.length > 0) && (
        <section className="py-10 sm:py-12 lg:py-14 border-t border-bone">
          <div className="px-4 sm:px-6 lg:px-12">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-[6px]">
                  Marketplace Spotlight
                </p>
                <h2 className="font-serif text-[22px] sm:text-[26px] font-bold text-carbon leading-[1.2] mb-1">
                  Top Stores This Week
                </h2>
                <p className="text-[12.5px] sm:text-[13px] text-slate max-w-md">
                  Discover trusted, verified stores with the highest ratings and fastest growth.
                </p>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate('/marketplace')} className="shrink-0 whitespace-nowrap">
                View All Stores <ArrowRight size={13} className="inline align-middle ml-1" />
              </Button>
            </div>

            <div
              ref={storesTrackRef}
              onMouseEnter={() => setStoresAutoplayPaused(true)}
              onMouseLeave={() => setStoresAutoplayPaused(false)}
              onScroll={e => {
                const track = e.currentTarget;
                const cards = Array.from(track.children) as HTMLElement[];
                let nearest = 0;
                let nearestDist = Infinity;
                cards.forEach((card, i) => {
                  const dist = Math.abs(card.offsetLeft - track.scrollLeft);
                  if (dist < nearestDist) { nearestDist = dist; nearest = i; }
                });
                setStoresActiveIndex(nearest);
              }}
              className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0"
            >
              {storesLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="shrink-0 snap-start w-[210px] sm:w-[calc((100%-24px)/3)] md:w-[calc((100%-36px)/4)] lg:w-[calc((100%-48px)/5)] rounded-2xl border border-bone overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-[10px] mb-3">
                          <SkeletonBox width={44} height={44} rounded="12px" />
                          <div className="flex-1">
                            <SkeletonBox width="70%" height={13} className="mb-[6px]" />
                            <SkeletonBox width="50%" height={10} />
                          </div>
                        </div>
                        <SkeletonBox width="90%" height={10} className="mb-2" />
                        <SkeletonBox width="60%" height={10} className="mb-3" />
                        <div className="flex gap-[6px]">
                          <SkeletonBox width="100%" height={30} rounded="8px" />
                          <SkeletonBox width="100%" height={30} rounded="8px" />
                        </div>
                      </div>
                    </div>
                  ))
                : topStores.map(s => (
                    <div key={s.storeId} className="shrink-0 snap-start w-[210px] sm:w-[calc((100%-24px)/3)] md:w-[calc((100%-36px)/4)] lg:w-[calc((100%-48px)/5)]">
                      <TopStoreCard store={s} onClick={() => window.location.href = getStorefrontUrl(s.slug)} />
                    </div>
                  ))}
            </div>

            {!storesLoading && topStores.length > 1 && (
              <div className="flex items-center justify-center gap-[8px] mt-5">
                {topStores.map((s, i) => (
                  <button
                    key={s.storeId}
                    onClick={() => goToStoreCard(i)}
                    aria-label={`Go to store ${i + 1}`}
                    aria-current={i === storesActiveIndex}
                    className="p-2 -m-2 flex items-center cursor-pointer border-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange rounded-full"
                  >
                    <span className={clsx(
                      'block rounded-full transition-all duration-200',
                      i === storesActiveIndex ? 'w-7 h-[9px] bg-brand-orange' : 'w-[9px] h-[9px] bg-bone hover:bg-slate/40',
                    )} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <ClosingCtaBanner />

      {/* ── Social Proof — real reviews only; section hides itself until there's enough real content ── */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="bg-cream border-t border-bone py-10 sm:py-12 lg:py-14">
          <div className="px-4 sm:px-6 lg:px-12">
            <p className="text-[11px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-2">
              Trusted by creators worldwide
            </p>
            <h2 className="font-serif text-[24px] sm:text-[28px] font-bold text-carbon text-center mb-10 max-w-md mx-auto leading-[1.2]">
              Real stories from real sellers
            </h2>
            {/* flex-wrap + centered, not a fixed 3-column grid — real
               testimonial count varies, and a rigid grid left fewer-than-3
               cards stranded on the left with a lopsided empty gap instead of
               sitting centered as a deliberate row. */}
            <div className="flex flex-wrap justify-center gap-4">
              {testimonialsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} padding="none" className="w-full sm:w-[340px]">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <SkeletonBox width={70} height={12} />
                          <SkeletonBox width={22} height={22} rounded="6px" />
                        </div>
                        <SkeletonBox width="100%" height={13} className="mb-2" />
                        <SkeletonBox width="80%" height={13} className="mb-4" />
                        <div className="flex items-center gap-[10px] pt-3 border-t border-bone">
                          <SkeletonBox width={30} height={30} rounded="999px" />
                          <div>
                            <SkeletonBox width={90} height={13} className="mb-1" />
                            <SkeletonBox width={70} height={11} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                : testimonials.map(t => (
                    <Card key={t.id} padding="none" hover className="group relative overflow-hidden w-full sm:w-[340px]">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-orange to-[#f0a57a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-[2px]">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={12} className={i <= Math.round(t.rating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'} />
                            ))}
                          </div>
                          <Quote size={20} className="text-brand-orange/20 fill-brand-orange/20 shrink-0" />
                        </div>
                        <p className="text-[13px] text-charcoal leading-[1.75] mb-4 italic">
                          "{t.text}"
                        </p>
                        <div className="flex items-center gap-[10px] pt-3 border-t border-bone">
                          <Avatar name={t.name} size={30} />
                          <div>
                            <div className="flex items-center gap-[6px]">
                              <p className="text-[13px] font-semibold text-carbon">{t.name}</p>
                              {t.isVerifiedPurchase && <BadgeCheck size={13} className="text-info fill-info/15 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate">{t.storeName ? `Bought from ${t.storeName}` : 'Verified buyer'}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
