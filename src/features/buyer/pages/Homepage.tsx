import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
import { AppDownloadBanner, Footer, FloatingAppWidget, SkeletonBox, DealsBanner } from '@/components/comman/ui';
import {
  ArrowRight, ShoppingBag, BookOpen, Download, Store, Monitor, Sparkles,
  Star, TrendingUp, BadgeCheck, Crown, UserPlus, UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  apiGetTopStores, apiFollowStore, apiGetPlatformStats, apiGetTestimonials,
  type PublicStoreListItem, type PlatformStats, type Testimonial,
} from '@/api/services/store';

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
  const initial     = store.name.trim().charAt(0).toUpperCase() || '?';

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
      className="group shrink-0 w-[252px] sm:w-auto snap-start bg-white border border-bone rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-[3px] hover:border-brand-orange/25"
    >
      {/* Cover — 16:9 */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {store.coverImage ? (
          <img loading="lazy" decoding="async" src={store.coverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-pale-orange via-[#FBE9DB] to-[#F5DFC7] flex items-center justify-center">
            <span className="font-serif text-[34px] font-bold text-brand-orange/30">{initial}</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 p-[9px] flex flex-wrap gap-[5px]">
          {isFeatured && (
            <span className="inline-flex items-center gap-1 px-[8px] py-[4px] rounded-full bg-[#7C3AED]/90 backdrop-blur-sm text-white text-[9.5px] font-bold">
              <Crown size={9} /> Platinum
            </span>
          )}
          {isTopSeller && (
            <span className="inline-flex items-center gap-1 px-[8px] py-[4px] rounded-full bg-carbon/80 backdrop-blur-sm text-white text-[9.5px] font-bold">
              <TrendingUp size={9} /> Top Seller
            </span>
          )}
          {isTopRated && (
            <span className="inline-flex items-center gap-1 px-[8px] py-[4px] rounded-full bg-white/90 backdrop-blur-sm text-brand-deep-orange text-[9.5px] font-bold">
              <Star size={9} className="fill-brand-orange text-brand-orange" /> Top Rated
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 -mt-7 relative">
        <div className="flex items-end justify-between mb-2">
          <div className="w-[52px] h-[52px] rounded-2xl bg-white p-[3px] shadow-[0_3px_10px_rgba(0,0,0,0.14)] shrink-0 transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full rounded-[15px] bg-brand-pale-orange flex items-center justify-center overflow-hidden">
              {store.logo
                ? <img loading="lazy" decoding="async" src={store.logo} alt="" className="w-full h-full object-cover" />
                : <Store size={20} className="text-brand-orange" />}
            </div>
          </div>
          <button
            onClick={handleFollow}
            disabled={followBusy}
            className={clsx(
              'inline-flex items-center gap-[5px] px-[11px] py-[6px] rounded-full text-[11px] font-semibold border cursor-pointer transition-all duration-150 mb-[2px] shrink-0',
              following
                ? 'bg-carbon/5 border-bone text-charcoal'
                : 'bg-brand-orange border-brand-orange text-white hover:bg-brand-deep-orange',
              followBusy && 'opacity-60 cursor-wait',
            )}
          >
            {following ? <UserCheck size={11} /> : <UserPlus size={11} />}
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        <div className="flex items-center gap-[5px] min-w-0">
          <p className="text-[14px] font-bold text-carbon leading-tight truncate">{store.name}</p>
          {isVerified && <BadgeCheck size={13} className="text-[#1A72C2] fill-[#1A72C2]/15 shrink-0" />}
        </div>

        {store.description ? (
          <p className="text-[11px] text-slate leading-snug line-clamp-1 mt-[3px]">{store.description}</p>
        ) : (
          <p className="text-[11px] text-slate/70 italic leading-snug mt-[3px]">New on Solvexo</p>
        )}

        {store.sellerType && (
          <span className="inline-block px-[8px] py-[2px] rounded-full bg-cream text-[10px] font-medium text-charcoal capitalize mt-[8px]">
            {store.sellerType}
          </span>
        )}

        <div className="grid grid-cols-3 gap-1 pt-[10px] mt-[10px] border-t border-bone">
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-[3px] text-[12px] font-bold text-carbon">
              <Star size={10} className="text-brand-orange fill-brand-orange" />
              {store.averageRating > 0 ? store.averageRating.toFixed(1) : 'New'}
            </span>
            <span className="text-[9px] text-slate mt-[2px]">{compactNumber.format(store.reviewCount)} reviews</span>
          </div>
          <div className="flex flex-col items-center border-x border-bone">
            <span className="text-[12px] font-bold text-carbon">{compactNumber.format(store.followersCount)}</span>
            <span className="text-[9px] text-slate mt-[2px]">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-bold text-carbon">{store.productCount != null ? compactNumber.format(store.productCount) : '—'}</span>
            <span className="text-[9px] text-slate mt-[2px]">Products</span>
          </div>
        </div>

        <Button variant="primary" size="sm" className="w-full mt-3" onClick={e => { e.stopPropagation(); onClick(); }}>
          Visit Store <ArrowRight size={12} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

const FEATURES: { Icon: LucideIcon; title: string; bg: string; desc: string; path: string }[] = [
  { Icon: ShoppingBag, title: 'Marketplace',          bg: '#FBECE4', desc: 'Join thousands of buyers discovering your products in the Solvexo marketplace.',         path: '/marketplace' },
  { Icon: BookOpen,    title: 'Educational Resources', bg: '#EBF7EF', desc: 'Sell lesson plans, courses, worksheets and digital curricula to educators worldwide.',    path: '/education'   },
  { Icon: Download,    title: 'Digital Downloads',     bg: '#E6F1FB', desc: 'Sell ebooks, music, software, templates and files with instant delivery.',                path: '/marketplace' },
  { Icon: Store,       title: 'Your Own Store',        bg: '#FEF7E5', desc: 'Launch a branded store with a custom domain, no coding required.',                        path: '/sellers'     },
  { Icon: Monitor,     title: 'Point of Sale',         bg: '#FBECE4', desc: 'Accept payments in-person with the Solvexo POS app, fully synced to your dashboard.',     path: '/sellers'     },
  { Icon: Sparkles,    title: 'AI Commerce Tools',     bg: '#F5F0FB', desc: 'Write listings, optimize pricing, auto-generate descriptions with built-in AI.',           path: '/sellers'     },
];

export function Homepage() {
  const navigate = useNavigate();
  usePageTitle('Home');

  const [topStores, setTopStores] = useState<PublicStoreListItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetTopStores(12)
      .then(res => { if (!cancelled) setTopStores(res.data.stores); })
      .catch(() => { /* non-critical section — homepage still works without it */ })
      .finally(() => { if (!cancelled) setStoresLoading(false); });
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
      .then(res => { if (!cancelled) setTestimonials(res.data); })
      .catch(() => { /* non-critical — section just stays hidden */ })
      .finally(() => { if (!cancelled) setTestimonialsLoading(false); });
    return () => { cancelled = true; };
  }, []);

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

        {/* Decorative circles */}
        <div className="absolute w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[420px] lg:h-[420px] rounded-full bg-[#3A3633] -top-16 -right-16 pointer-events-none" />
        <div className="absolute w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-full bg-[#2E2B28] -bottom-10 right-[32%] pointer-events-none" />

        <div className="relative z-[1] px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20 flex items-center justify-between gap-10">
          <div className="max-w-[520px]">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-[14px] py-[5px] mb-5 border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.12)]">
              <Sparkles size={12} className="text-brand-orange shrink-0" />
              <span className="text-[12px] font-medium text-brand-orange">
                AI-powered commerce. One platform.
              </span>
            </div>

            <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.14] font-semibold text-white mb-4">
              The Commerce OS for Sellers, Creators &amp; Educators
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
        </div>
      </section>

      {/* ── Feature Categories ───────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-12 lg:py-14">
        <div className="px-4 sm:px-6 lg:px-12">
          <p className="text-[11px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-2">
            Built for every type of seller
          </p>
          <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-carbon text-center mb-10 max-w-sm mx-auto leading-[1.2]">
            One platform. Infinite possibilities.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <Card key={f.title} hover padding="none" onClick={() => navigate(f.path)}>
                <div className="p-5">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
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
                  >
                    Learn More <ArrowRight size={13} className="inline align-middle ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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

            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {storesLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="shrink-0 w-[252px] sm:w-auto rounded-2xl border border-bone overflow-hidden">
                      <SkeletonBox width="100%" height="auto" rounded="0" className="aspect-[16/9]" />
                      <div className="px-4 pb-4 -mt-7">
                        <div className="flex items-end justify-between mb-2">
                          <SkeletonBox width={52} height={52} rounded="15px" className="border-[3px] border-white" />
                          <SkeletonBox width={64} height={24} rounded="999px" />
                        </div>
                        <SkeletonBox width="65%" height={13} className="mb-[6px]" />
                        <SkeletonBox width="85%" height={10} className="mb-3" />
                        <SkeletonBox width="100%" height={40} rounded="8px" />
                      </div>
                    </div>
                  ))
                : topStores.map(s => (
                    <TopStoreCard key={s.storeId} store={s} onClick={() => navigate(`/store/${s.slug}`)} />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Social Proof — real reviews only; section hides itself until there's enough real content ── */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="bg-cream border-t border-bone py-10 sm:py-12 lg:py-14">
          <div className="px-4 sm:px-6 lg:px-12">
            <p className="text-[11px] font-semibold text-slate text-center uppercase tracking-[0.08em] mb-6">
              Trusted by creators worldwide
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonialsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} padding="none">
                      <div className="p-5">
                        <SkeletonBox width="100%" height={13} className="mb-2" />
                        <SkeletonBox width="80%" height={13} className="mb-4" />
                        <div className="flex items-center gap-[10px]">
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
                    <Card key={t.id} padding="none">
                      <div className="p-5">
                        <p className="text-[13px] text-charcoal leading-[1.75] mb-4 italic">
                          "{t.text}"
                        </p>
                        <div className="flex items-center gap-[10px]">
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
            Join 50,000+ sellers on Solvexo. Free to start, no credit card required.
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
