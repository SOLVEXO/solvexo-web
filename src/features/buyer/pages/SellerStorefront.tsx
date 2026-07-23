import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { FilterDropdown, SkeletonBox, BuyerNavbar, Breadcrumb, AppDownloadBanner, Footer, FloatingAppWidget } from '@/components/comman/ui';
import {
  ShoppingCart, Star, Heart, ArrowLeft, Users,
  Store, Package, Loader2, MessageCircle, BadgeCheck, Award, Gift, RefreshCw, Check,
} from 'lucide-react';
import {
  apiGetPublicStore, apiGetPublicStoreProducts,
  apiGetPublicStoreFilters,
  apiFollowStore, apiGetFollowStatus,
  type PublicStoreData, type PublicStoreProduct, type PublicStoreProductsParams,
} from '@/api/services/store';
import { apiStartConversation } from '@/api/services/messaging';
import { apiGetMyBalance, apiGetRewards, apiRedeemReward, type LoyaltyBalance, type Reward } from '@/api/services/loyalty';
import { apiBrowseStorePlans, apiSubscribeToPlan, type BuyerPlan, type BillingInterval, type PlanBenefit } from '@/api/services/subscriptions';
import { Modal } from '@/components/comman/ui/Modal';
import { TokenStorage } from '@/api/services/auth';

// ── Builder config default (mirrors StoreBuilder DEFAULT) ─────────────────────
const CFG_DEFAULT = {
  primaryColor: '#D97757',
  bgColor:      '#FAF9F5',
  textColor:    '#2C2A28',
  accentColor:  '#B95A3A',
  font:         'Poppins',
  layoutStyle:  'Grid' as 'Grid' | 'Magazine' | 'Minimal',
  columns:      3 as 2 | 3 | 4,
  showRatings:  true,
  showPrice:    true,
  showAddToCart:true,
};

function getCfg(raw: Record<string, unknown> | null) {
  if (!raw) return CFG_DEFAULT;
  return {
    primaryColor:  (raw.primaryColor  as string) || CFG_DEFAULT.primaryColor,
    bgColor:       (raw.bgColor       as string) || CFG_DEFAULT.bgColor,
    textColor:     (raw.textColor     as string) || CFG_DEFAULT.textColor,
    accentColor:   (raw.accentColor   as string) || CFG_DEFAULT.accentColor,
    font:          (raw.font          as string) || CFG_DEFAULT.font,
    layoutStyle:   (raw.layoutStyle   as 'Grid' | 'Magazine' | 'Minimal') || CFG_DEFAULT.layoutStyle,
    columns:       (raw.columns       as 2 | 3 | 4) || CFG_DEFAULT.columns,
    showRatings:   raw.showRatings  !== false,
    showPrice:     raw.showPrice    !== false,
    showAddToCart: raw.showAddToCart !== false,
  };
}

// ── Badge config ──────────────────────────────────────────────────────────────
const SELLER_TYPE_LABEL: Record<string, string> = {
  educator:       'Education Specialist',
  creator:        'Content Creator',
  retailer:       'Retail Seller',
  brand_business: 'Brand / Business',
  freelancer:     'Freelancer',
};

function StoreBadges({ badges, sellerType }: { badges: string[]; sellerType: string | null }) {
  const items: { label: string; icon: React.ReactNode; cls: string }[] = [];

  if (badges.includes('top_seller'))
    items.push({ label: 'Top Seller', icon: <Award size={10} />, cls: 'bg-amber-100 text-amber-700 border-amber-200' });
  if (badges.includes('verified'))
    items.push({ label: 'Verified', icon: <BadgeCheck size={10} />, cls: 'bg-blue-50 text-blue-600 border-blue-200' });
  if (badges.includes('featured'))
    items.push({ label: 'Featured', icon: <Star size={10} />, cls: 'bg-purple-50 text-purple-600 border-purple-200' });

  const specialistLabel = sellerType ? SELLER_TYPE_LABEL[sellerType] : null;
  if (specialistLabel)
    items.push({ label: specialistLabel, icon: <BadgeCheck size={10} />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' });

  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-[5px] mt-[8px]">
      {items.map(b => (
        <span key={b.label} className={clsx('inline-flex items-center gap-[3px] px-[7px] py-[3px] rounded-full text-[10px] font-semibold border', b.cls)}>
          {b.icon}{b.label}
        </span>
      ))}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'          },
  { value: 'price_asc',  label: 'Price: Low–High' },
  { value: 'price_desc', label: 'Price: High–Low' },
  { value: 'best_rated', label: 'Best Rated'      },
];

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10} style={i <= Math.round(rating) ? { color, fill: color } : { color: '#C8C6BE', fill: '#C8C6BE' }} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SellerStorefront() {
  const navigate     = useNavigate();
  const { slug }     = useParams<{ slug: string }>();
  usePageTitle('Store');

  const [store,          setStore]         = useState<PublicStoreData | null>(null);
  const [products,       setProducts]      = useState<PublicStoreProduct[]>([]);
  const [total,          setTotal]         = useState(0);
  const [page,           setPage]          = useState(1);
  const [totalPages,     setTotalPages]    = useState(1);
  const [sortBy,         setSortBy]        = useState<NonNullable<PublicStoreProductsParams['sort']>>('newest');
  const [loadingStore,   setLoadingStore]  = useState(true);
  const [loadingProds,   setLoadingProds]  = useState(false);
  const [storeError,     setStoreError]    = useState('');
  const [following,          setFollowing]         = useState(false);
  const [followLoading,      setFollowLoading]     = useState(false);
  const [followStatusLoaded, setFollowStatusLoaded] = useState(false);
  const [msgLoading,         setMsgLoading]        = useState(false);
  const [msgError,           setMsgError]          = useState('');
  const [wishlisted,     setWishlisted]    = useState<Set<string>>(new Set());
  const [tags,           setTags]          = useState<string[]>([]);
  const [activeTag,      setActiveTag]     = useState<string>('all');
  const [loyalty,        setLoyalty]       = useState<LoyaltyBalance | null>(null);
  const [showRewards,    setShowRewards]   = useState(false);
  const [rewards,        setRewards]       = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [redeemingId,    setRedeemingId]   = useState<string | null>(null);
  const [plans,          setPlans]         = useState<BuyerPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [subscribingId,  setSubscribingId] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribedMsg,  setSubscribedMsg]  = useState('');

  const isLoggedIn = TokenStorage.isLoggedIn();

  // Resolve config (real or default)
  const cfg = useMemo(() => getCfg(store?.builderConfig ?? null), [store?.builderConfig]);

  // CSS custom properties derived from builderConfig
  const themeStyle = useMemo<React.CSSProperties>(() => ({
    '--store-primary':  cfg.primaryColor,
    '--store-accent':   cfg.accentColor,
    '--store-bg':       cfg.bgColor,
    '--store-text':     cfg.textColor,
    '--store-font':     cfg.font,
    fontFamily:         `${cfg.font}, sans-serif`,
  } as React.CSSProperties), [cfg]);

  // Product grid columns class
  const colClass = useMemo(() => {
    if (cfg.layoutStyle === 'Minimal') return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    const map: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' };
    return map[cfg.columns] ?? 'grid-cols-2 md:grid-cols-3';
  }, [cfg]);

  // ── Load store ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setLoadingStore(true);
    apiGetPublicStore(slug)
      .then(res => {
        setStore(res.data);
        // Load filters after store is fetched
        apiGetPublicStoreFilters(res.data.storeId)
          .then(r => setTags(r.data.tags))
          .catch(() => {});
      })
      .catch(() => setStoreError('Store not found'))
      .finally(() => setLoadingStore(false));
  }, [slug]);

  // ── Follow status ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!store) { setFollowStatusLoaded(true); return; }
    if (!isLoggedIn) { setFollowStatusLoaded(true); return; }
    apiGetFollowStatus(store.storeId)
      .then(res => setFollowing(res.data.following))
      .catch(() => {})
      .finally(() => setFollowStatusLoaded(true));
  }, [store, isLoggedIn]);

  // ── Loyalty balance ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!store || !isLoggedIn) return;
    apiGetMyBalance(store.storeId).then(res => setLoyalty(res.data)).catch(() => {});
  }, [store, isLoggedIn]);

  useEffect(() => {
    if (!store) return;
    apiBrowseStorePlans(store.storeId).then(res => setPlans(res.data)).catch(() => {});
  }, [store]);

  const handleSubscribe = async (plan: BuyerPlan, interval: BillingInterval) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setSubscribingId(plan._id);
    setSubscribeError('');
    setSubscribedMsg('');
    try {
      await apiSubscribeToPlan(plan._id, interval);
      setSubscribedMsg(`You're in! Welcome to ${plan.name} — member pricing is already live across the store.`);
      if (store) apiGetPublicStoreProducts(store.storeId, { page, limit: 12, sort: sortBy, tag: activeTag !== 'all' ? activeTag : undefined })
        .then(res => setProducts(res.data.products)).catch(() => {});
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : 'Failed to subscribe.');
    } finally {
      setSubscribingId(null);
    }
  };

  // Human-readable bullets derived from structured benefits — not free text.
  const benefitLabel = (b: PlanBenefit): string | null => {
    switch (b.type) {
      case 'discount': {
        const scope = b.scope === 'store' ? 'storewide' : b.scope === 'category' ? 'on select categories' : 'on select products';
        return `${b.discountPercent}% off ${scope}`;
      }
      case 'shipping':
        return b.shippingType === 'free' ? 'Free shipping' : `${b.shippingDiscountPercent}% off shipping`;
      case 'early_access':
        return `Early access to new arrivals (${b.earlyAccessHours}h head start)`;
      case 'loyalty_multiplier':
        return `${b.multiplier}x loyalty points`;
      case 'credits':
        return `${b.creditsPerCycle} ${b.creditType === 'service' ? 'service' : 'download'} credits every cycle`;
      case 'priority_support':
        return 'Priority customer support';
      case 'priority_booking':
        return 'Priority booking slots';
      default:
        return b.label ?? null;
    }
  };

  const openRewards = () => {
    if (!store) return;
    setShowRewards(true);
    if (rewards.length === 0) {
      setRewardsLoading(true);
      apiGetRewards(store.storeId).then(res => setRewards(res.data)).finally(() => setRewardsLoading(false));
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!store) return;
    setRedeemingId(reward._id);
    try {
      const res = await apiRedeemReward(store.storeId, reward._id);
      setLoyalty(prev => prev ? { ...prev, pointsBalance: res.data.remainingBalance } : prev);
    } catch {
      // insufficient points / out of stock — surfaced by the axios error interceptor
    } finally {
      setRedeemingId(null);
    }
  };

  // ── Products ────────────────────────────────────────────────────────────────
  const loadProducts = useCallback(() => {
    if (!store) return;
    setLoadingProds(true);
    apiGetPublicStoreProducts(store.storeId, {
      page, limit: 12, sort: sortBy,
      tag: activeTag !== 'all' ? activeTag : undefined,
    })
      .then(res => {
        setProducts(res.data.products);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoadingProds(false));
  }, [store, page, sortBy, activeTag]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ── Follow toggle ───────────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!store || !isLoggedIn) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      const res = await apiFollowStore(store.storeId);
      setFollowing(res.data.following);
      setStore(prev => prev ? {
        ...prev,
        followersCount: res.data.following
          ? prev.followersCount + 1
          : Math.max(0, prev.followersCount - 1),
      } : prev);
    } catch {}
    finally { setFollowLoading(false); }
  };

  // ── Message seller ──────────────────────────────────────────────────────────
  const handleMessage = async () => {
    if (!store) return;
    if (!isLoggedIn) { navigate('/login'); return; }
    setMsgLoading(true);
    setMsgError('');
    try {
      const conv = await apiStartConversation({ storeId: store.storeId });
      navigate(`/account/messages?conversation=${conv._id}`);
    } catch (err) {
      // Stay on the page and say why instead of silently dropping the buyer
      // onto an empty inbox (e.g. blocked, or messaging their own store).
      setMsgError(err instanceof Error ? err.message : 'Could not start a conversation.');
    } finally {
      setMsgLoading(false);
    }
  };

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWishlisted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loadingStore) {
    return (
      <div className="min-h-screen" style={{ background: CFG_DEFAULT.bgColor }}>
        {/* Nav skeleton */}
        <div className="h-[60px] flex items-center gap-3 px-4 sm:px-6 lg:px-10 bg-white border-b border-bone">
          <SkeletonBox width={100} height={20} rounded="4px" />
          <div className="flex-1" />
          <SkeletonBox width={36} height={36} rounded="9999px" />
        </div>
        {/* Banner skeleton */}
        <div className="px-4 sm:px-6 lg:px-10 py-7 sm:py-9">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <SkeletonBox width={84} height={84} rounded="18px" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonBox width="220px" height={26} rounded="6px" />
              <SkeletonBox width="140px" height={14} rounded="4px" />
            </div>
          </div>
        </div>
        {/* Product grid skeleton */}
        <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6 grid grid-cols-2 md:grid-cols-3 gap-[10px] sm:gap-3 lg:gap-[14px]">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonBox key={i} height={170} rounded="10px" />
          ))}
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <Store size={48} className="text-bone" />
        <p className="text-[15px] text-slate">Store not found</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft size={13} className="mr-1" /> Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ ...themeStyle, background: cfg.bgColor, color: cfg.textColor }}>

      <BuyerNavbar
        contextLabel={store.name}
        accentColor={cfg.primaryColor}
        backTo={{ label: 'Marketplace', path: '/marketplace' }}
      />

      <div className="px-4 sm:px-6 lg:px-10 pt-3 bg-white border-b border-bone">
        <Breadcrumb items={[
          { label: 'Home', path: '/' },
          { label: 'Marketplace', path: '/marketplace' },
          { label: store.name },
        ]} />
      </div>

      {/* ── Store Banner ─────────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={store.coverImage
          ? { backgroundImage: `url(${store.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#1A3A4A' }
          : { background: `linear-gradient(135deg, ${cfg.primaryColor}CC, ${cfg.accentColor}CC)` }
        }
      >
        {store.coverImage && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative px-4 sm:px-6 lg:px-10 py-7 sm:py-9">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">

            {/* Store logo */}
            <div className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-[18px] bg-white flex items-center justify-center shrink-0 outline outline-2 outline-white/40">
              {store.logo
                ? <img loading="lazy" decoding="async" src={store.logo} alt={store.name} className="w-full h-full rounded-[18px] object-cover" />
                : <Store size={36} style={{ color: cfg.primaryColor }} />
              }
            </div>

            {/* Store info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] sm:text-[26px] font-bold text-white mb-[4px] leading-tight">
                {store.name}
              </h1>
              <StoreBadges badges={store.badges} sellerType={store.sellerType} />
              {store.description && (
                <p className="text-[12px] sm:text-[13px] text-[rgba(255,255,255,0.75)] mt-[8px] mb-[10px] line-clamp-2">
                  {store.description}
                </p>
              )}
              <div className="flex items-center gap-[5px] text-[12px] text-[rgba(255,255,255,0.7)] mt-[6px]">
                <Users size={13} />
                <span>{store.followersCount.toLocaleString()} followers</span>
                <span className="mx-1">·</span>
                <Package size={13} />
                <span>{total} products</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap sm:flex-col gap-2 items-center justify-center sm:items-end shrink-0">
              {plans.length > 0 && (
                <button
                  onClick={() => document.getElementById('store-membership')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-white text-charcoal border border-white hover:bg-[rgba(255,255,255,0.9)] whitespace-nowrap"
                >
                  <RefreshCw size={13} style={{ color: cfg.primaryColor }} />
                  Membership
                </button>
              )}
              {isLoggedIn && loyalty && (
                <button
                  onClick={openRewards}
                  className="flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-white text-charcoal border border-white hover:bg-[rgba(255,255,255,0.9)] whitespace-nowrap"
                >
                  <Gift size={13} style={{ color: cfg.primaryColor }} />
                  {loyalty.pointsBalance.toLocaleString()} points
                </button>
              )}
              <button
                onClick={handleFollow}
                disabled={followLoading || !followStatusLoaded}
                className={clsx(
                  'px-[14px] py-[7px] rounded-lg text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap border',
                  following
                    ? 'bg-white text-charcoal border-white'
                    : 'bg-transparent text-white border-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.1)]',
                )}
              >
                {(followLoading || !followStatusLoaded)
                  ? <Loader2 size={13} className="animate-spin inline" />
                  : following ? 'Following ✓' : 'Follow Store'
                }
              </button>

              <button
                onClick={handleMessage}
                disabled={msgLoading}
                className="flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-white text-charcoal border border-white hover:bg-[rgba(255,255,255,0.9)] whitespace-nowrap"
              >
                {msgLoading
                  ? <Loader2 size={13} className="animate-spin" />
                  : <MessageCircle size={13} />
                }
                Message
              </button>
              {msgError && (
                <p className="text-[11px] text-white bg-black/30 rounded-md px-2 py-1 max-w-[220px] text-center sm:text-right">
                  {msgError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Category filter tabs ─────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="border-b border-bone bg-white">
          <div className="px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
              {['all', ...tags].map(tag => {
                const label = tag === 'all' ? 'All Products' : tag;
                const active = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => { setActiveTag(tag); setPage(1); }}
                    className="shrink-0 px-4 py-[13px] text-[13px] font-medium cursor-pointer bg-transparent border-none relative whitespace-nowrap transition-colors"
                    style={{
                      color: active ? cfg.primaryColor : '#8C8A82',
                      borderBottom: active ? `2px solid ${cfg.primaryColor}` : '2px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Products ─────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px]" style={{ color: cfg.textColor + '99' }}>{total} Products</span>
          <FilterDropdown
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={v => { setSortBy(v as NonNullable<PublicStoreProductsParams['sort']>); setPage(1); }}
          />
        </div>

        {loadingProds ? (
          <div className={clsx('grid gap-[10px] sm:gap-3 lg:gap-[14px]', colClass)}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <SkeletonBox key={i} height={170} rounded="10px" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Package size={40} className="text-bone" />
            <p className="text-[14px] text-slate">No products yet</p>
          </div>
        ) : (
          <>
            <div className={clsx('grid gap-[10px] sm:gap-3 lg:gap-[14px]', colClass)}>
              {products.map((p: PublicStoreProduct) => {
                const pType = p.productType ?? p.type ?? 'physical';
                const isPhysical = pType === 'physical';
                const typeLabel = isPhysical ? 'Physical' : pType === 'educational' ? 'Educational' : 'Digital';
                return (
                <Card key={p._id} padding="none" hover onClick={() => navigate(`/marketplace/${p._id}`)} className="overflow-hidden bg-white">
                  {/* Image */}
                  <div className="relative w-full h-[110px] sm:h-[150px] lg:h-[170px] bg-[#EAF4EE] flex items-center justify-center">
                    {p.images?.[0]
                      ? <img loading="lazy" decoding="async" src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <Package size={28} className="text-[#5A8A6A]" />
                    }
                    <button
                      onClick={e => toggleWishlist(e, p._id)}
                      className="absolute top-[6px] right-[6px] w-6 h-6 rounded-full bg-[rgba(255,255,255,0.92)] flex items-center justify-center cursor-pointer border-none"
                    >
                      <Heart size={11} className={clsx(wishlisted.has(p._id) ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate fill-none')} />
                    </button>
                    <span className={clsx(
                      'absolute top-[6px] left-[6px] px-[5px] py-[2px] rounded-[4px] text-[9px] font-semibold border leading-none',
                      isPhysical
                        ? 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]'
                        : 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
                    )}>
                      {typeLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-2 pt-2 pb-2 sm:px-3 sm:pt-[10px] sm:pb-3">
                    <p className="font-bold text-[11px] sm:text-[13px] mb-[3px] leading-[1.4] line-clamp-2" style={{ color: cfg.textColor }}>
                      {p.name}
                    </p>
                    {cfg.showRatings && (p.averageRating ?? 0) > 0 && <StarRating rating={p.averageRating!} color={cfg.primaryColor} />}
                    {cfg.showPrice && p.subscriberPrice != null && (
                      <p className="text-[9px] sm:text-[10px] font-semibold mt-1" style={{ color: cfg.primaryColor }}>
                        Members save {p.discountPercent}%
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-1 mt-[6px] sm:mt-[10px]">
                      {cfg.showPrice && (
                        <span className="flex items-baseline gap-[6px] shrink-0">
                          <span className="font-bold text-[12px] sm:text-[15px]" style={{ color: p.subscriberPrice != null ? cfg.primaryColor : cfg.textColor }}>
                            ${(p.subscriberPrice ?? p.defaultVariantPrice ?? '—').toLocaleString()}
                          </span>
                          {p.subscriberPrice != null && (
                            <span className="text-[10px] sm:text-[11px] line-through opacity-60" style={{ color: cfg.textColor }}>
                              ${p.defaultVariantPrice?.toLocaleString()}
                            </span>
                          )}
                        </span>
                      )}
                      {cfg.showAddToCart && (
                        <Button
                          variant="secondary" size="sm" className="inline-flex"
                          onClick={e => { e.stopPropagation(); navigate(`/marketplace/${p._id}`); }}
                        >
                          <ShoppingCart size={11} />
                          <span className="hidden lg:inline">Add to Cart</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="text-[13px] text-slate self-center">
                  Page {page} of {totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Store Membership — real on-page pricing section, not a modal ──────── */}
      {plans.length > 0 && (
        <div id="store-membership" className="border-t border-bone py-10 px-4 sm:px-6 lg:px-10" style={{ background: cfg.bgColor }}>
          <div className="max-w-[900px] mx-auto text-center mb-8">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.12em] rounded-full px-3 py-1 mb-3" style={{ color: cfg.primaryColor, background: `${cfg.primaryColor}18` }}>
              Store Membership
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-bold mb-2" style={{ color: cfg.textColor }}>
              Shop {store.name} for less, every time
            </h2>
            <p className="text-[13px] text-slate max-w-[520px] mx-auto">
              Join once and member pricing applies automatically on every visit — no codes to remember. Cancel anytime.
            </p>

            {plans.some(p => p.yearlyPriceUSD != null) && (
              <div className="inline-flex items-center gap-1 mt-5 bg-white rounded-full p-1 border border-bone">
                {(['monthly', 'yearly'] as const).map(iv => (
                  <button key={iv} onClick={() => setBillingInterval(iv)}
                    className="px-4 py-[7px] rounded-full text-[12px] font-semibold cursor-pointer border-none capitalize transition-colors"
                    style={{ background: billingInterval === iv ? cfg.primaryColor : 'transparent', color: billingInterval === iv ? '#fff' : cfg.textColor }}>
                    {iv}{iv === 'yearly' && ' · save more'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {subscribedMsg && (
            <div className="max-w-[520px] mx-auto mb-6 px-4 py-3 rounded-lg bg-[#E3F4EA] text-[#1E7A3C] text-[13px] font-medium text-center">{subscribedMsg}</div>
          )}
          {subscribeError && (
            <div className="max-w-[520px] mx-auto mb-6 px-4 py-3 rounded-lg bg-[#FDECEA] text-[#C13030] text-[13px] font-medium text-center">{subscribeError}</div>
          )}

          <div className={clsx('grid gap-5 max-w-[960px] mx-auto', plans.length === 1 ? 'grid-cols-1 max-w-[380px]' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
            {plans.map((plan, idx) => {
              const price = billingInterval === 'yearly' && plan.displayYearlyPrice != null ? plan.displayYearlyPrice : plan.displayMonthlyPrice;
              const bullets = plan.benefits.map(benefitLabel).filter(Boolean) as string[];
              const isPopular = idx === Math.min(1, plans.length - 1) && plans.length > 1;
              return (
                <div key={plan._id} className="relative bg-white rounded-2xl p-6 flex flex-col"
                  style={{ border: isPopular ? `2px solid ${cfg.primaryColor}` : '1px solid #E8E6DC' }}>
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: cfg.primaryColor }}>
                      Most Popular
                    </span>
                  )}
                  <p className="text-[16px] font-bold text-carbon mb-1">{plan.name}</p>
                  {plan.description && <p className="text-[12px] text-slate mb-4">{plan.description}</p>}
                  <div className="mb-4">
                    <span className="text-[32px] font-bold" style={{ color: cfg.textColor }}>{price}</span>
                    <span className="text-[12px] text-slate">/{billingInterval === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                  <ul className="flex flex-col gap-2 mb-6 p-0 list-none flex-1">
                    {bullets.length > 0 ? bullets.map(b => (
                      <li key={b} className="flex items-start gap-2 text-[12.5px] text-graphite">
                        <Check size={13} className="mt-[2px] shrink-0" style={{ color: cfg.primaryColor }} />{b}
                      </li>
                    )) : plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[12.5px] text-graphite">
                        <Check size={13} className="mt-[2px] shrink-0" style={{ color: cfg.primaryColor }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan, billingInterval === 'yearly' && plan.yearlyPriceUSD != null ? 'yearly' : 'monthly')}
                    disabled={subscribingId === plan._id}
                    className="w-full py-[11px] rounded-xl text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-50 transition-opacity"
                    style={{ background: cfg.primaryColor }}
                  >
                    {subscribingId === plan._id ? 'Subscribing…' : 'Become a Member'}
                  </button>
                  <p className="text-[10.5px] text-slate text-center mt-2">Cancel anytime — no long-term commitment</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-10 pb-8 pt-2">
        <AppDownloadBanner />
      </div>
      <Footer />
      <FloatingAppWidget />

      {showRewards && (
        <Modal title="Rewards Catalog" onClose={() => setShowRewards(false)}>
          <p className="text-[13px] text-slate mb-4">
            You have <strong style={{ color: cfg.primaryColor }}>{loyalty?.pointsBalance.toLocaleString() ?? 0} points</strong> at {store.name}.
            {loyalty?.nextTier && ` ${loyalty.nextTier.pointsNeeded} more points to reach ${loyalty.nextTier.name}.`}
          </p>

          {rewardsLoading ? (
            <p className="text-xs text-slate">Loading…</p>
          ) : rewards.length === 0 ? (
            <p className="text-xs text-slate italic">No rewards available yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {rewards.map(r => {
                const canAfford = (loyalty?.pointsBalance ?? 0) >= r.pointsCost;
                const outOfStock = r.stockLimit != null && r.redeemedCount >= r.stockLimit;
                return (
                  <div key={r._id} className="flex items-center justify-between gap-3 bg-cream rounded-lg px-3.5 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-carbon">{r.name}</p>
                      <p className="text-[11px] text-slate">
                        {r.pointsCost.toLocaleString()} points — {r.type === 'fixed_discount' ? `$${r.discountValue} off` : 'Free product'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRedeem(r)}
                      disabled={!canAfford || outOfStock || redeemingId === r._id}
                      className="px-3.5 py-[7px] rounded-lg text-xs font-semibold text-white border-none cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: cfg.primaryColor }}
                    >
                      {redeemingId === r._id ? 'Redeeming…' : outOfStock ? 'Out of stock' : canAfford ? 'Redeem' : 'Not enough points'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
