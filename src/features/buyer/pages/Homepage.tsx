import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
import { AppDownloadBanner, Footer, FloatingAppWidget, SkeletonBox, DealsBanner, CoverImage } from '@/components/comman/ui';
import { FlashSaleCard, FlashSaleCardSkeleton } from '@/components/comman/marketplace/FlashSaleCard';
import {
  ArrowRight, ShoppingBag, BookOpen, Download, Store, Monitor, Sparkles,
  Star, TrendingUp, BadgeCheck, Crown, UserPlus, UserCheck, Quote,
  Gift, Megaphone, BarChart3, MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  apiGetTopStores, apiFollowStore, apiGetPlatformStats, apiGetTestimonials,
  type PublicStoreListItem, type PlatformStats, type Testimonial,
} from '@/api/services/store';
import { apiGetAllProducts, type MarketplaceProduct } from '@/api/services/marketplace';

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'USD' });

// ── Premium store spotlight card — 16:9 cover, overlapping logo, badge stack,
// rating/followers/products stat row, and Follow + Visit actions. Modeled on
// marketplace "featured seller" cards (Amazon/Etsy/Alibaba style storefront tiles). ──
function TopStoreCard({ store, onClick }: { store: PublicStoreListItem; onClick: () => void }) {
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const isVerified  = store.badges?.includes('verified');
  const isFeatured  = store.badges?.includes('featured');
  const isTopSeller = store.badges?.includes('top_seller');
  const isTopRated  = store.reviewCount > 0 && store.averageRating >= 4.8;

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await apiFollowStore(store.storeId);
      setFollowing(res.data.following);
    } catch { /* non-critical — button just stays in prior state */ }
    finally { setFollowBusy(false); }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      className="group h-full flex flex-col shrink-0 w-[210px] sm:w-auto snap-start bg-white border border-bone rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-[3px] hover:border-brand-orange/25"
    >
      {/* Top accent — sweeps in on hover, same language as the Feature Category cards */}
      <div className="h-[4px] shrink-0 bg-gradient-to-r from-brand-orange to-[#F0A57A] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

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
              {isVerified && <BadgeCheck size={12} className="text-[#1A72C2] fill-[#1A72C2]/15 shrink-0" />}
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
              <span className="inline-flex items-center gap-1 px-[7px] py-[3px] rounded-full bg-[#7C3AED] text-white text-[9px] font-bold">
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

const FEATURES: { Icon: LucideIcon; title: string; bg: string; desc: string; path: string }[] = [
  { Icon: ShoppingBag,   title: 'Marketplace',           bg: '#FBECE4', desc: 'Join thousands of buyers discovering your products in the Solvexo marketplace.',         path: '/marketplace' },
  { Icon: BookOpen,      title: 'Educational Resources', bg: '#EBF7EF', desc: 'Sell lesson plans, courses, worksheets and digital curricula to educators worldwide.',    path: '/EducationMarketplace'   },
  { Icon: Download,      title: 'Digital Downloads',     bg: '#E6F1FB', desc: 'Sell ebooks, music, software, templates and files with instant delivery.',                path: '/marketplace' },
  { Icon: Store,         title: 'Your Own Store',        bg: '#FEF7E5', desc: 'Launch a branded store with a custom domain, no coding required.',                        path: '/sellers'     },
  { Icon: Monitor,       title: 'Point of Sale',         bg: '#FBECE4', desc: 'Accept payments in-person with the Solvexo POS app, fully synced to your dashboard.',     path: '/sellers'     },
  { Icon: Sparkles,      title: 'AI Commerce Tools',     bg: '#F5F0FB', desc: 'Write listings, optimize pricing, auto-generate descriptions with built-in AI.',           path: '/sellers'     },
  { Icon: Gift,          title: 'Loyalty & Rewards',     bg: '#FEF7E5', desc: 'Turn one-time buyers into repeat customers with points, tiers and perks.',                 path: '/sellers'     },
  { Icon: Megaphone,     title: 'Marketing & Campaigns', bg: '#FBECE4', desc: 'Run coupons, sales campaigns and seasonal promotions across your storefront.',            path: '/sellers'     },
  { Icon: BarChart3,     title: 'Analytics & Insights',  bg: '#E6F1FB', desc: 'Track revenue, orders and customers with real-time dashboards and reports.',              path: '/sellers'     },
  { Icon: MessageCircle, title: 'Buyer Messaging',       bg: '#EBF7EF', desc: 'Chat directly with buyers to answer questions and close more sales.',                    path: '/sellers'     },
];

export function Homepage() {
  const navigate = useNavigate();
  usePageTitle('Home');

  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const [topStores, setTopStores] = useState<PublicStoreListItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  const [productPool, setProductPool] = useState<MarketplaceProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const { addToCart, adding } = useCartContext();
  const { isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();
  const countdown = useCountdownToMidnight();
  const storesTrackRef = useRef<HTMLDivElement>(null);
  const [storesActiveIndex, setStoresActiveIndex] = useState(0);

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

  // Pool used to surface real, currently-active discounts (Flash Sale) — same
  // approach as Marketplace's own flash-deal computation, so the "-X% OFF"
  // badges always reflect a genuine compareAtPrice set by the seller.
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
    apiGetPlatformStats()
      .then(res => { if (!cancelled) setStats(res.data); })
      .catch(() => { /* non-critical — stat strip just stays hidden */ })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGetTestimonials(3)
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

  const handleCardClick = useCallback((id: string) => navigate(`/marketplace/${id}`), [navigate]);
  const handleAddToCart = useCallback((e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => {
    e.stopPropagation();
    if (variantId) addToCart(id, variantId, type);
  }, [addToCart]);
  const handleToggleWishlist = useCallback((e: React.MouseEvent, id: string, variantId: string) => {
    e.stopPropagation();
    if (variantId) toggleWishlist(id, variantId);
  }, [toggleWishlist]);

  const statItems = stats ? [
    { value: `${compactNumber.format(stats.sellersCount)}+`, label: 'Active Sellers' },
    { value: `${compactCurrency.format(stats.gmv)}+`,        label: 'GMV Processed'  },
    { value: stats.ratingCount > 0 ? `${stats.avgRating.toFixed(1)}★` : '—', label: 'Seller Rating' },
  ] : [];

  return (
    <div className="bg-white min-h-full">

      <DealsBanner />

      {/* ── Hero ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-carbon to-charcoal">

        {/* Ambient glow orbs + subtle dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="auth-float absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full -top-24 -right-20 bg-[radial-gradient(circle,var(--color-brand-orange)_0%,transparent_70%)] opacity-[0.22] blur-3xl" />
          <div className="auth-float-slow absolute w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] rounded-full -bottom-16 right-[30%] bg-[radial-gradient(circle,#7C3AED_0%,transparent_70%)] opacity-[0.14] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
        </div>

        <div className="relative z-[1] px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20 flex items-center justify-between gap-10">
          <div className="max-w-[520px]">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-[14px] py-[5px] mb-5 border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.12)]">
              <Sparkles size={12} className="text-brand-orange shrink-0" />
              <span className="text-[12px] font-medium text-brand-orange">
                AI-powered commerce. One platform.
              </span>
            </div>

            <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.14] font-semibold text-white mb-4">
              The Commerce OS for{' '}
              <span className="bg-gradient-to-r from-brand-orange to-[#F0A57A] bg-clip-text text-transparent">
                Sellers, Creators &amp; Educators
              </span>
            </h1>

            <p className="text-[13px] sm:text-sm text-[#B0AEA8] leading-[1.75] mb-7 max-w-[440px]">
              Sell physical products, digital downloads, and educational resources — with
              AI-powered tools, a built-in marketplace, and point-of-sale. Everything
              commerce, in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Button size="md" onClick={() => navigate('/onboard')} className="w-full sm:w-auto">
                Start for Free <ArrowRight size={13} className="inline align-middle ml-1" />
              </Button>
              <button
                onClick={() => navigate('/marketplace')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                Browse Marketplace
              </button>
            </div>

            {/* Stats — real platform numbers, hidden until they load (no fake placeholders) */}
            {(statsLoading || statItems.length > 0) && (
              <div className="flex gap-6 sm:gap-8">
                {statsLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i}>
                        <SkeletonBox width={48} height={22} className="mb-1" />
                        <SkeletonBox width={64} height={11} />
                      </div>
                    ))
                  : statItems.map(({ value, label }) => (
                      <div key={label}>
                        <p className="text-[20px] sm:text-[22px] font-bold text-brand-orange leading-none">{value}</p>
                        <p className="text-[10px] sm:text-[11px] text-slate mt-1">{label}</p>
                      </div>
                    ))}
              </div>
            )}
          </div>

          {/* Floating commerce-mode cards — desktop only, fills the hero's right-side negative space.
             Each card is a rotation wrapper (static tilt, scattered "mockup stack" composition) around
             an inner auth-float element (vertical drift) — combined in one transform they'd fight each
             other, so the rotate and the animation live on separate nested elements. */}
          <div className="hidden lg:grid grid-cols-2 gap-3 w-[400px] shrink-0">
            {[
              { ...FEATURES[0], delay: '0s',  accent: '#D97757', tag: 'CORE',     rotate: '-2deg', shift: '-2px', featured: true },
              { ...FEATURES[5], delay: '-1s', accent: '#B95A3A', tag: 'AI',       rotate: '3deg',  shift: '3px',  featured: false },
              { ...FEATURES[1], delay: '-2s', accent: '#1A72C2', tag: 'LEARN',    rotate: '-3deg', shift: '-3px', featured: false },
              { ...FEATURES[6], delay: '-3s', accent: '#C08B1E', tag: 'LOYALTY',  rotate: '2.5deg', shift: '2px', featured: false },
              { ...FEATURES[4], delay: '-4s', accent: '#2D8A4E', tag: 'POS',      rotate: '-3.5deg', shift: '-2px', featured: false },
              { ...FEATURES[8], delay: '-5s', accent: '#7C3AED', tag: 'INSIGHTS', rotate: '4deg',  shift: '3px',  featured: false },
            ].map(f => (
              // Rotation lives on this outer, static wrapper — the auth-float keyframes below
              // fully replace `transform` on whatever element they're applied to, so a rotate
              // sitting on the *same* element as the animation would get overwritten every frame.
              <div key={f.title} style={{ transform: `rotate(${f.rotate}) translateY(${f.shift})` }}>
                <div
                  className="auth-float group relative rounded-2xl rounded-tl-md border overflow-hidden cursor-default transition-[border-color,background-color] duration-200 active:scale-[0.98]"
                  style={{
                    animationDelay: f.delay,
                    borderColor: f.featured ? `${f.accent}40` : 'rgba(255,255,255,0.09)',
                    background: f.featured ? `${f.accent}0D` : 'rgba(255,255,255,0.035)',
                    padding: '12px 12px 12px 16px',
                  }}
                >
                  {/* Hover tint — a separate overlay so it can react to :hover independently of the
                     inline-styled base colors (inline styles always win over a Tailwind hover: class
                     on the same property, so the hover effect has to live on its own layer) */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-200 pointer-events-none" />

                  {/* Accent bar — this card's identity color, thin and flat (no glow) */}
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full transition-opacity duration-200 opacity-70 group-hover:opacity-100" style={{ background: f.accent }} />

                  {/* Category tag — replaces the numbered badge; the featured card also gets a "Flagship" marker */}
                  <span
                    className="absolute top-3 right-3 px-[6px] py-[2px] rounded-[4px] text-[8px] font-bold uppercase tracking-[0.09em]"
                    style={{ color: f.accent, border: `1px solid ${f.accent}3D`, background: `${f.accent}14` }}
                  >
                    {f.featured ? 'Flagship · ' : ''}{f.tag}
                  </span>

                  <div className="flex items-center gap-[10px] mb-[9px]">
                    <div
                      className="w-9 h-9 rounded-[10px] rounded-tl-[3px] border flex items-center justify-center shrink-0"
                      style={{ borderColor: `${f.accent}40`, background: `${f.accent}12` }}
                    >
                      <f.Icon size={16} style={{ color: f.accent }} />
                    </div>
                    <p className="text-[13px] font-bold text-white leading-[1.2] tracking-[-0.01em] pr-5">{f.title}</p>
                  </div>
                  <p className="text-[10px] text-white/45 leading-[1.5] line-clamp-2">{f.desc}</p>
                </div>
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
                <h2 className="font-serif text-[22px] sm:text-[26px] font-bold text-carbon leading-[1.2] mb-1">
                  Flash Sale
                </h2>
                <p className="flex items-center gap-[6px] text-[12.5px] sm:text-[13px] text-slate max-w-md">
                  <span className="relative flex h-[6px] w-[6px] shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
                    <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#E11D48]" />
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

            {/* Carousel — horizontal scroll instead of a wrapping grid, generous
               gaps and edge padding so cards never feel compressed */}
            <div className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0">
              {productsLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="shrink-0 w-[150px] sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-100px)/6)]">
                      <FlashSaleCardSkeleton />
                    </div>
                  ))
                : flashDeals.map(({ product }) => {
                    const variants = product.variants ?? [];
                    const defVariant = variants.find(v => v.isDefault) ?? variants[0];
                    const vId = defVariant?._id ?? '';
                    return (
                      <div key={product._id} className="shrink-0 snap-start w-[150px] sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-100px)/6)]">
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
          </div>
        </section>
      )}

      {/* ── Feature Categories ───────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-12 lg:py-14">
        <div className="px-4 sm:px-6 lg:px-12">
          <p className="text-[11px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-2">
            Built for every type of seller
          </p>
          <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-carbon text-center mb-3 max-w-sm mx-auto leading-[1.2]">
            One platform. Infinite possibilities.
          </h2>
          <div className="w-10 h-[3px] rounded-full bg-gradient-to-r from-brand-orange to-[#F0A57A] mx-auto mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllFeatures ? FEATURES : FEATURES.slice(0, 6)).map(f => (
              <Card key={f.title} hover padding="none" onClick={() => navigate(f.path)} className="group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-orange to-[#F0A57A] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                <div className="p-5">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                    style={{ background: f.bg }}
                  >
                    <f.Icon size={18} className="text-brand-orange" />
                  </div>
                  <p className="text-[15px] font-bold text-carbon mb-1">{f.title}</p>
                  <p className="text-[12px] text-slate leading-[1.6] mb-3">{f.desc}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate(f.path); }}
                    className="group/btn"
                  >
                    Learn More <ArrowRight size={13} className="inline align-middle ml-1 transition-transform duration-200 group-hover/btn:translate-x-[3px]" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {FEATURES.length > 6 && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" size="sm" pill onClick={() => setShowAllFeatures(s => !s)}>
                {showAllFeatures ? 'View Less' : 'View More'}
                <ArrowRight size={13} className={clsx('inline align-middle ml-1 transition-transform duration-200', showAllFeatures && '-rotate-90')} />
              </Button>
            </div>
          )}
        </div>
      </section>

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
                      <TopStoreCard store={s} onClick={() => navigate(`/store/${s.slug}`)} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonialsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} padding="none">
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
                    <Card key={t.id} padding="none" hover className="group relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-orange to-[#F0A57A] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
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
                              {t.isVerifiedPurchase && <BadgeCheck size={13} className="text-[#1A72C2] fill-[#1A72C2]/15 shrink-0" />}
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

      {/* ── CTA ──────────────────────────────────────────────────────────────────── */}
      <section className="bg-brand-orange py-10 sm:py-12 lg:py-14 px-4 sm:px-6 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-white mb-3 leading-[1.2]">
            Ready to start selling?
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[rgba(255,255,255,0.85)] mb-6 leading-[1.7]">
            {stats && stats.sellersCount > 0
              ? `Join ${compactNumber.format(stats.sellersCount)}+ sellers on Solvexo. Free to start, no credit card required.`
              : 'Free to start, no credit card required.'}
          </p>
          <Button variant="dark" size="md" onClick={() => navigate('/onboard')}>
            Create Your Account <ArrowRight size={13} className="inline align-middle ml-1" />
          </Button>
        </div>
      </section>

      {/* ── App Download ─────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 sm:py-14">
        <AppDownloadBanner />
      </section>

      <Footer />
      <FloatingAppWidget />
    </div>
  );
}
