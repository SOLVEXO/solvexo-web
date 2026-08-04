import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import type { MarketplaceSortBy } from '@/api/services/marketplace';
import { useEducationFacets } from '@/hooks/marketplace/useEducationFacets';
import { useBanners } from '@/hooks/useBanners';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { apiGenerateWorksheetTrial } from '@/api/services/marketplace';
import { EDUCATION_LEVELS } from '@/api/services/product';
import { apiGetTopStores, type PublicStoreListItem } from '@/api/services/store';
import { Button } from '@/components/comman/ui/Button';
import { ProductCard, ProductCardSkeleton } from '@/components/comman/marketplace/ProductCard';
import { FilterAccordionSection, FilterChipPill, FilterRadioRow, FilterCheckboxRow, FilterStarRow, ActiveFilterChip, PriceRangeSlider, PRICE_MIN, PRICE_MAX } from '@/components/comman/marketplace/FilterAccordionSection';
import { BannerCarousel, type BannerCarouselItem } from '@/components/comman/marketplace/BannerCarousel';
import { FlashSaleCard } from '@/components/comman/marketplace/FlashSaleCard';
import { MegaMenuBar, RailCard, MegaSectionLabel } from '@/components/comman/marketplace/MegaMenuBar';
import { BuyerNavbar, SearchBox, AppDownloadBanner, Footer, FilterDropdown, Modal, DealsBanner, TrustServiceStrip, Pagination, EmptyState, FloatingAppWidget } from '@/components/comman/ui';
import { ArrowRight, Sparkles, SlidersHorizontal, Loader2, RefreshCcw, GraduationCap, ShieldCheck, ChevronRight, Store, X, Zap, LayoutGrid, LayoutList } from 'lucide-react';

const SUBJECTS = ['Math', 'ELA', 'Science', 'Social Studies', 'Art', 'SEL'];
const RATING_ITEMS: { label: string; stars: number }[] = [
  { label: '4★ & up', stars: 4 },
  { label: '3★ & up', stars: 3 },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'          },
  { value: 'price-asc',  label: 'Price: Low–High' },
  { value: 'price-desc', label: 'Price: High–Low' },
  { value: 'best-rated', label: 'Best Rated'      },
];

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(EDUCATION_LEVELS.map(l => [l.value, l.label]));

// ── AI Worksheet Builder — free trial modal ──────────────────────────────────
function WorksheetTrialModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject]             = useState('');
  const [gradeLevel, setGradeLevel]       = useState('');
  const [topicsInput, setTopicsInput]     = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [result, setResult]               = useState<{ title: string; sections: { instructions: string; questions: { prompt: string; type: string; choices?: string[]; answer?: string }[] }[] } | null>(null);

  const handleGenerate = async () => {
    const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!subject || !gradeLevel || topics.length === 0) {
      setError('Subject, grade level, and at least one topic are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiGenerateWorksheetTrial({
        subject, gradeLevel, topics, questionCount, includeAnswerKey,
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a worksheet right now — please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#b5b3ac] outline-none';

  return (
    <Modal title="AI Worksheet Builder — Free Trial" onClose={onClose} width={560}>
      {!result ? (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-slate">Try it free — up to 6 questions. Create a full worksheet from your seller dashboard's AI Studio.</p>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (e.g. Fractions)" className={inp} />
          <input value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} placeholder="Grade level (e.g. Grade 4)" className={inp} />
          <input value={topicsInput} onChange={e => setTopicsInput(e.target.value)} placeholder="Topics, comma separated" className={inp} />
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-charcoal flex items-center gap-2">
              Questions:
              <input type="number" min={1} max={6} value={questionCount}
                onChange={e => setQuestionCount(Math.min(6, Math.max(1, Number(e.target.value))))}
                className={`${inp} w-16`} />
            </label>
            <label className="text-[12px] text-charcoal flex items-center gap-2">
              <input type="checkbox" checked={includeAnswerKey} onChange={e => setIncludeAnswerKey(e.target.checked)} />
              Include answer key
            </label>
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <Button variant="primary" size="md" onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? <><Loader2 size={14} className="animate-spin inline mr-1" />Generating…</> : 'Generate Worksheet'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          <p className="text-[15px] font-bold text-charcoal">{result.title}</p>
          {result.sections.map((s, i) => (
            <div key={i} className="border border-bone rounded-lg p-3">
              <p className="text-[12px] text-slate mb-2">{s.instructions}</p>
              <ol className="flex flex-col gap-2 list-decimal list-inside">
                {s.questions.map((q, qi) => (
                  <li key={qi} className="text-[13px] text-charcoal">
                    {q.prompt}
                    {q.choices && q.choices.length > 0 && (
                      <ul className="mt-1 ml-4 text-[12px] text-slate list-disc list-inside">
                        {q.choices.map((c, ci) => <li key={ci}>{c}</li>)}
                      </ul>
                    )}
                    {q.answer && <p className="text-[11px] text-success mt-1">Answer: {q.answer}</p>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="text-[11px] text-slate text-center">Like what you see? Sellers get the full builder (up to 40 questions, PDF export) in the seller AI Studio.</p>
        </div>
      )}
    </Modal>
  );
}

// ── Filter sidebar — same accordion/pill components as the general Marketplace ──
function EducationFilterPanel({
  levels, otherLevels, facetsLoading,
  activeLevel, onLevelChange, activeOtherSlug, onOtherSlugChange,
  activeSubjects, onToggleSubject,
  priceRange, onPriceRangeChange, activeRatings, onToggleRating,
}: {
  levels: { level: string; count: number }[];
  otherLevels: { slug: string; displayName: string; count: number }[];
  facetsLoading: boolean;
  activeLevel: string;
  onLevelChange: (level: string) => void;
  activeOtherSlug: string;
  onOtherSlugChange: (slug: string) => void;
  activeSubjects: string[];
  onToggleSubject: (s: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (v: [number, number]) => void;
  activeRatings: string[];
  onToggleRating: (r: string) => void;
}) {
  return (
    <div>
      <FilterAccordionSection title="Education Level">
        <div className="flex flex-col">
          <FilterRadioRow label="All Levels" active={activeLevel === ''} onClick={() => onLevelChange('')} count={levels.reduce((sum, l) => sum + (l.count ?? 0), 0)} />
          {!facetsLoading && levels.map(l => (
            <FilterRadioRow
              key={l.level}
              label={LEVEL_LABEL[l.level] ?? l.level}
              count={l.count}
              active={activeLevel === l.level}
              onClick={() => onLevelChange(l.level)}
            />
          ))}
        </div>
      </FilterAccordionSection>

      {activeLevel === 'other' && otherLevels.length > 0 && (
        <FilterAccordionSection title="Other">
          <div className="flex flex-col">
            <FilterRadioRow label="All" active={activeOtherSlug === ''} onClick={() => onOtherSlugChange('')} />
            {otherLevels.map(o => (
              <FilterRadioRow
                key={o.slug}
                label={o.displayName}
                count={o.count}
                active={activeOtherSlug === o.slug}
                onClick={() => onOtherSlugChange(o.slug)}
              />
            ))}
          </div>
        </FilterAccordionSection>
      )}

      <FilterAccordionSection title="Subject">
        <div className="flex flex-col">
          {SUBJECTS.map(s => (
            <FilterCheckboxRow key={s} label={s} active={activeSubjects.includes(s)} onClick={() => onToggleSubject(s)} />
          ))}
        </div>
      </FilterAccordionSection>

      <FilterAccordionSection title="Price Range">
        <PriceRangeSlider value={priceRange} onChange={onPriceRangeChange} />
      </FilterAccordionSection>

      <FilterAccordionSection title="Rating">
        <div className="flex flex-col">
          {RATING_ITEMS.map(({ label, stars }) => (
            <FilterStarRow key={label} stars={stars} active={activeRatings.includes(label)} onClick={() => onToggleRating(label)} />
          ))}
        </div>
      </FilterAccordionSection>
    </div>
  );
}

// ── Mega-menu "Grade Levels" panel — Education has no real CategoryNode tree
// (that's a general-marketplace concept), so this reuses the same real facet
// data as the sidebar (levels/subjects) instead of forcing it into a category
// shape it doesn't have. Passed to MegaMenuBar's categoriesContent override. ──
function EducationCategoriesMegaContent({
  levels, otherLevels, activeLevel, onLevelChange, activeOtherSlug, onOtherSlugChange,
  activeSubjects, onToggleSubject, topPicks, onProductClick, showSpotlight = true,
}: {
  levels: { level: string; count: number }[];
  otherLevels: { slug: string; displayName: string; count: number }[];
  activeLevel: string;
  onLevelChange: (level: string) => void;
  activeOtherSlug: string;
  onOtherSlugChange: (slug: string) => void;
  activeSubjects: string[];
  onToggleSubject: (s: string) => void;
  topPicks: import('@/api/services/marketplace').MarketplaceProduct[];
  onProductClick: (id: string) => void;
  /** Hides the "Popular Resources" column — for callers that just want the
   *  grade-levels/subjects browse experience (e.g. the "Grade Levels for
   *  you" modal) without a third products column. */
  showSpotlight?: boolean;
}) {
  return (
    <div className="flex gap-8">
      <div className="w-[210px] shrink-0 border-r border-bone pr-6">
        <MegaSectionLabel>Grade Levels</MegaSectionLabel>
        <div className="flex flex-col gap-[2px]">
          <button
            onClick={() => onLevelChange('')}
            className={`w-full text-left px-[10px] py-[9px] rounded-lg text-[12.5px] font-medium bg-transparent border-none cursor-pointer transition-colors ${activeLevel === '' ? 'bg-brand-pale-orange text-brand-orange' : 'text-charcoal hover:bg-cream'}`}
          >
            All Levels
          </button>
          {levels.map(l => (
            <button
              key={l.level}
              onClick={() => onLevelChange(l.level)}
              className={`w-full text-left px-[10px] py-[9px] rounded-lg text-[12.5px] font-medium bg-transparent border-none cursor-pointer transition-colors ${activeLevel === l.level ? 'bg-brand-pale-orange text-brand-orange' : 'text-charcoal hover:bg-cream'}`}
            >
              {LEVEL_LABEL[l.level] ?? l.level} ({l.count})
            </button>
          ))}
          {activeLevel === 'other' && otherLevels.map(o => (
            <button
              key={o.slug}
              onClick={() => onOtherSlugChange(o.slug)}
              className={`w-full text-left pl-[22px] pr-[10px] py-[7px] rounded-lg text-[12px] font-medium bg-transparent border-none cursor-pointer transition-colors ${activeOtherSlug === o.slug ? 'text-brand-orange' : 'text-slate hover:text-charcoal'}`}
            >
              {o.displayName} ({o.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 border-r border-bone pr-8">
        <MegaSectionLabel>Subjects</MegaSectionLabel>
        <div className="flex flex-wrap gap-[7px]">
          {SUBJECTS.map(s => (
            <FilterChipPill key={s} label={s} active={activeSubjects.includes(s)} onClick={() => onToggleSubject(s)} />
          ))}
        </div>
      </div>

      {showSpotlight && (
        <div className="shrink-0">
          <MegaSectionLabel>Popular Resources</MegaSectionLabel>
          {topPicks.length === 0 ? (
            <p className="text-[12px] text-slate">Nothing trending yet.</p>
          ) : (
            <div className="flex gap-3">
              {topPicks.slice(0, 4).map(p => <RailCard key={p._id} product={p} onClick={onProductClick} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── "Welcome to Solvexo" discovery strip — Education's mirror of Marketplace's
// WelcomeStrip: "Grade Levels for you" (real facet data, no CategoryNode tree
// to reuse here), the real Hero Banner, and the real DealsBanner side by
// side in one row. Clicking a grade level opens the same grade-levels/
// subjects mega-panel the navbar's own "All Category" dropdown already uses
// (EducationCategoriesMegaContent, reused as-is), as a big modal instead of
// a hover panel. ──
function EducationWelcomeStrip({
  levels, otherLevels, activeLevel, onLevelChange, activeOtherSlug, onOtherSlugChange,
  activeSubjects, onToggleSubject, topPicks, banners, onProductClick, onNavigate,
}: {
  levels: { level: string; count: number }[];
  otherLevels: { slug: string; displayName: string; count: number }[];
  activeLevel: string;
  onLevelChange: (level: string) => void;
  activeOtherSlug: string;
  onOtherSlugChange: (slug: string) => void;
  activeSubjects: string[];
  onToggleSubject: (s: string) => void;
  topPicks: import('@/api/services/marketplace').MarketplaceProduct[];
  banners: BannerCarouselItem[];
  onProductClick: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const hasLevels = levels.length > 0;
  const hasHero = banners.length > 0;
  const [modalOpen, setModalOpen] = useState(false);
  const sellEntry = useSellEntry();

  if (!hasLevels && !hasHero) return null;

  return (
    <div>
      {/* Welcome bar — real quick links to distinct destinations. */}
      <div className="flex items-center justify-between gap-4 px-1 pb-3">
        <p className="text-[14px] sm:text-[15px] font-bold text-carbon">Welcome to Solvexo</p>
        <div className="hidden sm:flex items-center gap-5 text-[12px] font-medium text-charcoal">
          <button onClick={() => onNavigate('/faq')} className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <ShieldCheck size={14} className="text-brand-orange" /> Buyer Protection
          </button>
          <span className="w-px h-4 bg-bone" />
          <button onClick={() => sellEntry.go()} className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <Store size={14} className="text-brand-orange" /> Sell Your Resources
          </button>
          <span className="w-px h-4 bg-bone" />
          <button onClick={() => onNavigate('/marketplace')} className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:text-brand-orange transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
            <GraduationCap size={14} className="text-brand-orange" /> Marketplace
          </button>
        </div>
      </div>

      {/* One row: Grade Levels for you, the real Hero Banner, and the real
         DealsBanner — side by side, all visible together, not stacked. */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.4fr_1fr] lg:grid-rows-[220px] gap-4">
        {hasLevels && (
          <div className="bg-cream rounded-[14px] p-3 flex flex-col lg:h-full lg:overflow-y-auto">
            <p className="text-[11.5px] font-bold text-carbon mb-2">Grade Levels for you</p>
            <div className="flex flex-col gap-[2px]">
              {levels.slice(0, 6).map(l => (
                <button
                  key={l.level}
                  onClick={() => setModalOpen(true)}
                  className="group flex items-center gap-2 rounded-lg px-1.5 py-[6px] bg-transparent border-none text-left cursor-pointer transition-colors duration-150 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  <span className="w-[24px] h-[24px] rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                    <GraduationCap size={13} className="text-brand-orange" />
                  </span>
                  <span className="flex-1 min-w-0 text-[11.5px] font-medium text-charcoal truncate">{LEVEL_LABEL[l.level] ?? l.level}</span>
                  <ChevronRight size={12} className="shrink-0 text-slate/50 group-hover:text-brand-orange transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hero Banner — real education-hero banners, in the same fixed-size
           card as DealsBanner beside it. */}
        {hasHero && (
          <div className="relative min-h-[200px] lg:h-full rounded-[14px] overflow-hidden">
            <BannerCarousel entityType="banner" banners={banners} />
          </div>
        )}

        {/* DealsBanner — the real campaign banner (scoped to educational
           resources), right beside the hero, not stacked below it. */}
        <DealsBanner compact storeType="educational_resources" className="min-h-[200px] lg:h-full" />
      </div>

      {/* Grade-levels mega-modal — the exact same panel the navbar's "All
         Category" dropdown shows, just as a big modal here. */}
      {modalOpen && (
        <Modal title="Grade Levels for you" onClose={() => setModalOpen(false)} width={720}>
          <EducationCategoriesMegaContent
            levels={levels} otherLevels={otherLevels}
            activeLevel={activeLevel} onLevelChange={onLevelChange}
            activeOtherSlug={activeOtherSlug} onOtherSlugChange={onOtherSlugChange}
            activeSubjects={activeSubjects} onToggleSubject={onToggleSubject}
            topPicks={topPicks}
            onProductClick={id => { onProductClick(id); setModalOpen(false); }}
            showSpotlight={false}
          />
        </Modal>
      )}
    </div>
  );
}

export function EducationMarketplace() {
  const navigate = useNavigate();
  usePageTitle('Education');
  const { addToCart, adding } = useCartContext();
  const { isWishlisted, wishlisting, toggleWishlist } = useWishlistContext();

  const [activeLevel,     setActiveLevel]     = useState('');   // '' = All Levels
  const [activeOtherSlug, setActiveOtherSlug] = useState('');
  const [activeSubjects,  setActiveSubjects]  = useState<string[]>([]);
  const [priceRange,      setPriceRange]      = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [activeRatings,   setActiveRatings]   = useState<string[]>([]);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [sortBy,          setSortBy]          = useState('newest');
  const [viewMode,        setViewMode]        = useState<'grid' | 'list'>('grid');
  const [showAiTrial,     setShowAiTrial]     = useState(false);
  const [mobileFilters,   setMobileFilters]   = useState(false);
  const [page,            setPage]            = useState(1);
  // Flash Sale rail auto-advances one card at a time — paused on hover/touch,
  // same behavior as Marketplace's own rail.
  const flashSaleTrackRef = useRef<HTMLDivElement>(null);
  const [flashSalePaused, setFlashSalePaused] = useState(false);

  const { levels, otherLevels, loading: facetsLoading } = useEducationFacets();
  const { banners } = useBanners('educationHero');
  const countdown = useCountdownToMidnight();
  const [topStores, setTopStores] = useState<PublicStoreListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiGetTopStores(10)
      .then(res => { if (!cancelled) setTopStores(res.data?.stores ?? []); })
      .catch(() => { /* non-critical — Featured Sellers panel just stays empty */ });
    return () => { cancelled = true; };
  }, []);

  const LIMIT = 24;
  // Price/rating/sort are real server-side facets (see ProductsController) —
  // previously only fetched page 1 of 24 with no pagination at all, making
  // any catalog beyond the first 24 items permanently unreachable, and
  // price/rating/sort only ever re-sorted/re-filtered that one fixed page.
  const serverSortBy: MarketplaceSortBy | undefined =
    sortBy === 'price-asc' ? 'price_asc' :
    sortBy === 'price-desc' ? 'price_desc' :
    sortBy === 'best-rated' ? 'rating' : undefined;
  const isPriceRangeActive = priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX;
  const serverMinPrice = isPriceRangeActive ? priceRange[0] : undefined;
  const serverMaxPrice = isPriceRangeActive && priceRange[1] < PRICE_MAX ? priceRange[1] : undefined;
  const serverMinRating = activeRatings.includes('4★ & up') ? 4 : activeRatings.includes('3★ & up') ? 3 : undefined;

  const { products, total, loading, error } = useProductsByCategory(
    page, LIMIT, undefined, 'educational',
    activeLevel || undefined,
    activeLevel === 'other' ? (activeOtherSlug || undefined) : undefined,
    undefined, serverMinPrice, serverMaxPrice, serverMinRating, serverSortBy,
  );

  // Subject (tag-based) and free-text search have no server-side facet on
  // this endpoint — they still narrow only the current fetched page, same
  // limitation as before. Changing any real server facet resets to page 1,
  // same as Marketplace, so a filter change never fetches a stale page.
  const isFirstFacetRun = useRef(true);
  useEffect(() => {
    if (isFirstFacetRun.current) { isFirstFacetRun.current = false; return; }
    setPage(1);
  }, [activeLevel, activeOtherSlug, sortBy, priceRange[0], priceRange[1], activeRatings.join(',')]);

  // Unfiltered educational pool (independent of the sidebar's current level
  // filter) — same approach Marketplace uses for its own Flash Sale/Top Picks
  // mega-menu content, so those panels always reflect the whole catalog.
  const { products: featuredPool } = useProductsByCategory(1, 24, undefined, 'educational');

  const flashDeals = featuredPool
    .map(p => {
      const dv = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
      const price = dv?.price ?? 0;
      const compareAt = dv?.compareAtPrice ?? null;
      const pct = compareAt != null && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
      return { product: p, pct };
    })
    .filter(x => x.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  // Auto-scroll the Flash Sale rail one card at a time, looping back to the
  // start at the end — pauses on hover/touch (see the handlers on the rail
  // below) so it never fights a shopper's own scroll/tap. Same as Marketplace.
  useEffect(() => {
    const track = flashSaleTrackRef.current;
    if (!track || flashSalePaused || flashDeals.length === 0) return;
    const id = setInterval(() => {
      const card = track.firstElementChild as HTMLElement | null;
      const step = (card?.offsetWidth ?? 140) + 12; // card width + the rail's gap-3
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
    }, 2200);
    return () => clearInterval(id);
  }, [flashSalePaused, flashDeals.length]);

  const topPicks = [...featuredPool]
    .sort((a, b) => (b.purchaseCount + b.averageRating * 10) - (a.purchaseCount + a.averageRating * 10))
    .slice(0, 10);

  const toggleSubject = useCallback((s: string) => {
    setActiveSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);
  const toggleRating = useCallback((r: string) => {
    setActiveRatings(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }, []);

  // Price/rating/sort are already applied server-side (see serverMinPrice/
  // serverMinRating/serverSortBy above) — only search/subject (no server
  // facet for either) still narrow the already-fetched page here.
  const filtered = products.filter(p => {
    const matchesSearch = !searchQuery
      || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (p.sellerName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = activeSubjects.length === 0
      || activeSubjects.some(s => (p.tags ?? []).some(t => t.toLowerCase() === s.toLowerCase()));
    return matchesSearch && matchesSubject;
  });

  const handleCardClick = useCallback((id: string) => navigate(`/marketplace/${id}`), [navigate]);
  const handleAddToCart = useCallback((e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => {
    e.stopPropagation();
    if (variantId) addToCart(id, variantId, type);
  }, [addToCart]);
  const handleToggleWishlist = useCallback((e: React.MouseEvent, id: string, variantId: string) => {
    e.stopPropagation();
    if (variantId) toggleWishlist(id, variantId);
  }, [toggleWishlist]);

  // Hides the discovery rail (Flash Sale) while a shopper is actively
  // narrowing results — same rule Marketplace uses, a discovery feed doesn't
  // belong above a shopper's own filtered results.
  const isBrowsing = !!searchQuery || !!activeLevel || activeSubjects.length > 0;

  const activeFilterCount = (activeLevel ? 1 : 0) + (activeOtherSlug ? 1 : 0) + activeSubjects.length
    + (isPriceRangeActive ? 1 : 0) + activeRatings.length;
  const clearFilters = () => {
    setActiveLevel(''); setActiveOtherSlug(''); setActiveSubjects([]);
    setPriceRange([PRICE_MIN, PRICE_MAX]); setActiveRatings([]);
  };

  // Active filter chip strip — mirrors the general Marketplace's sidebar.
  const activeFilterChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(activeLevel
      ? [{ key: 'level', label: LEVEL_LABEL[activeLevel] ?? activeLevel, onRemove: () => { setActiveLevel(''); setActiveOtherSlug(''); } }]
      : []),
    ...(activeOtherSlug
      ? [{ key: 'other', label: otherLevels.find(o => o.slug === activeOtherSlug)?.displayName ?? 'Other', onRemove: () => setActiveOtherSlug('') }]
      : []),
    ...(isPriceRangeActive
      ? [{
          key: 'price',
          label: priceRange[1] >= PRICE_MAX ? `$${priceRange[0]}+` : `$${priceRange[0]}–$${priceRange[1]}`,
          onRemove: () => setPriceRange([PRICE_MIN, PRICE_MAX]),
        }]
      : []),
    ...activeSubjects.map(s => ({ key: `subject-${s}`, label: s, onRemove: () => toggleSubject(s) })),
    ...activeRatings.map(r => ({ key: `rating-${r}`, label: r, onRemove: () => toggleRating(r) })),
  ];

  return (
    <div className="theme-education min-h-screen bg-cream">

      <BuyerNavbar
        hideSearch
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search resources...', popularStores: topStores }}
      />

      {/* ── Education navigation — Grade Levels / Flash Sale / Top Picks /
         Featured Stores / About, compact, above the hero — same merged row
         as Marketplace's own nav, positioned the same way. ── */}
      <MegaMenuBar
        compact
        categoriesLabel="All Category"
        categoriesContent={
          <EducationCategoriesMegaContent
            levels={levels} otherLevels={otherLevels}
            activeLevel={activeLevel} onLevelChange={l => { setActiveLevel(l); setActiveOtherSlug(''); }}
            activeOtherSlug={activeOtherSlug} onOtherSlugChange={setActiveOtherSlug}
            activeSubjects={activeSubjects} onToggleSubject={toggleSubject}
            topPicks={topPicks} onProductClick={handleCardClick}
          />
        }
        topPicks={topPicks}
        flashDeals={flashDeals}
        topStores={topStores}
        countdown={countdown}
        onProductClick={handleCardClick}
        onStoreClick={slug => navigate(`/${slug}`)}
        onNavigate={navigate}
      />

      {/* ── Big search bar — the real navbar SearchBox, rendered at its `lg`
         scale as a standalone hero search, same as Marketplace. The
         navbar's own compact copy is hidden on this page (hideSearch above). ── */}
      <div className="bg-gradient-to-b from-brand-pale-orange/60 via-brand-pale-orange/25 to-transparent px-4 sm:px-6 lg:px-10 py-7 sm:py-9 flex justify-center">
        <SearchBox
          size="lg"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search for resources, subjects, and stores..."
          popularStores={topStores}
          onSubmit={term => setSearchQuery(term ?? searchQuery)}
        />
      </div>

      {/* ── "Welcome to Solvexo" discovery strip — Grade Levels for you, plus
         the real Hero Banner and DealsBanner side by side, same as
         Marketplace's WelcomeStrip. ── */}
      <div className="px-4 sm:px-6 lg:px-10 pb-5">
        <EducationWelcomeStrip
          levels={levels} otherLevels={otherLevels}
          activeLevel={activeLevel} onLevelChange={l => { setActiveLevel(l); setActiveOtherSlug(''); }}
          activeOtherSlug={activeOtherSlug} onOtherSlugChange={setActiveOtherSlug}
          activeSubjects={activeSubjects} onToggleSubject={toggleSubject}
          topPicks={topPicks}
          banners={banners.map(b => ({ _id: b._id, order: b.order, imageUrl: b.bannerImage, linkUrl: b.urlOnTap }))}
          onProductClick={handleCardClick}
          onNavigate={navigate}
        />
      </div>

      {/* ── Trust & Service strip ────────────────────────────────────────────── */}
      <TrustServiceStrip />

      {/* ── Flash Sale — a compact, always-visible rail (real discount signal
         from the same `flashDeals` pool the mega-menu dropdown already uses),
         same as Marketplace's own rail. Hidden while actively browsing. ── */}
      {!isBrowsing && flashDeals.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-error-bg text-error">
                <Zap size={14} className="fill-error" />
              </span>
              <h2 className="font-serif text-[16px] sm:text-[19px] font-bold text-carbon tracking-[-0.01em]">Flash Sale</h2>
            </div>
            <div className="flex items-center gap-[6px] text-[11px] sm:text-[12px] font-semibold text-slate">
              <span className="hidden sm:inline">Ends in</span>
              <span className="tabular-nums text-error font-bold">{countdown.h}:{countdown.m}:{countdown.s}</span>
            </div>
          </div>
          <div
            ref={flashSaleTrackRef}
            onMouseEnter={() => setFlashSalePaused(true)}
            onMouseLeave={() => setFlashSalePaused(false)}
            onTouchStart={() => setFlashSalePaused(true)}
            onTouchEnd={() => setTimeout(() => setFlashSalePaused(false), 1500)}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory scroll-smooth"
          >
            {flashDeals.map(({ product: p }) => {
              const dv = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
              const vId = dv?._id ?? '';
              return (
                <div key={p._id} className="w-[118px] sm:w-[132px] lg:w-[144px] shrink-0 snap-start">
                  <FlashSaleCard
                    compact
                    product={p}
                    onClick={handleCardClick}
                    isAdding={adding === vId}
                    onAddToCart={handleAddToCart}
                    isWishlisted={isWishlisted(p._id, vId)}
                    isWishlisting={wishlisting === vId}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        {/* Sort/view toolbar — Filters lives on its own tab stuck to the left
           edge of the viewport (see below), same as Marketplace, not a
           sidebar or an inline row here. */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <span className="text-[13px] font-medium text-slate">
            {!loading && (error ? 'Error loading' : <>Showing <span className="text-carbon font-semibold">{filtered.length} of {total}</span> resources</>)}
          </span>
          <div className="flex items-center gap-3">
            <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            <div className="hidden sm:flex items-center gap-[2px] rounded-lg border border-bone bg-white p-[3px]">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                  viewMode === 'grid' ? 'bg-brand-pale-orange text-brand-orange' : 'bg-transparent text-slate hover:text-charcoal',
                )}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                  viewMode === 'list' ? 'bg-brand-pale-orange text-brand-orange' : 'bg-transparent text-slate hover:text-charcoal',
                )}
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilterChips.map(chip => (
              <ActiveFilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="p-6 flex flex-col items-center gap-3 text-center bg-error-bg rounded-[12px] border border-error-border text-error text-[13px]">
            <span>Couldn't load resources right now — please try again shortly.</span>
          </div>
        )}

        {/* No sidebar to share width with anymore, so the grid gets a wider
            ceiling: 2 @ 320-767 → 3 @ md → 4 @ lg → 5 @ xl, same as
            Marketplace. List view collapses to a single column of rows. */}
        <div
          id="education-grid"
          className={clsx(
            'scroll-mt-[76px]',
            viewMode === 'list'
              ? 'flex flex-col gap-3'
              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[10px] sm:gap-3 lg:gap-[14px]',
          )}
        >
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} layout={viewMode} />)
            : filtered.map(p => {
                const defVariant = (p.variants ?? []).find(v => v.isDefault) ?? p.variants?.[0];
                const vId = defVariant?._id ?? '';
                return (
                  <ProductCard
                    key={p._id}
                    layout={viewMode}
                    product={p}
                    onClick={handleCardClick}
                    isAdding={adding === vId}
                    onAddToCart={handleAddToCart}
                    isWishlisted={isWishlisted(p._id, vId)}
                    isWishlisting={wishlisting === vId}
                    onToggleWishlist={handleToggleWishlist}
                  />
                );
              })
          }
        </div>

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<GraduationCap size={30} className="text-brand-orange" />}
            title="No resources match"
            description="No educational resources match your filters yet."
            action={
              activeFilterCount > 0 || searchQuery
                ? { label: 'Clear filters', onClick: () => { clearFilters(); setSearchQuery(''); } }
                : undefined
            }
          />
        )}

        {!loading && !error && total > LIMIT && (
          <div className="flex justify-center mt-8 pb-2">
            <Pagination page={page} total={total} perPage={LIMIT} onChange={p => setPage(p)} />
          </div>
        )}

        {/* ── AI Builder CTA ─────────────────────────────────────────────── */}
        <div
          className="mt-6 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
          style={{ background: 'linear-gradient(120deg, #FBECE4, #FFF)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-[rgba(217,119,87,0.12)] flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-brand-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] sm:text-[16px] font-bold text-carbon mb-1">
              AI Worksheet Builder — Try Free
            </p>
            <p className="text-[12px] sm:text-[13px] text-slate leading-[1.6]">
              Generate custom worksheets, quizzes, and lesson activities in seconds with AI. Save hours of prep time.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowAiTrial(true)} className="shrink-0 w-full sm:w-auto">
            Try AI Builder <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
      </div>

      {/* ── App download ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 pb-8 pt-2">
        <AppDownloadBanner />
      </div>

      {showAiTrial && <WorksheetTrialModal onClose={() => setShowAiTrial(false)} />}

      <Footer />
      <FloatingAppWidget />

      {/* ── Filters — a real sidebar, not an inline panel or a bottom sheet,
         same as Marketplace. A small tab stays stuck to the left edge of the
         viewport at every breakpoint; clicking it slides a full-height
         drawer in from the left, over the page. ── */}
      <button
        onClick={() => setMobileFilters(o => !o)}
        aria-expanded={mobileFilters}
        aria-label="Toggle filters"
        className={clsx(
          'fixed left-0 bottom-24 z-[58] flex items-center gap-[6px] rounded-r-[10px] border border-l-0 py-2 pl-2 pr-[10px] text-[12px] font-semibold shadow-[0_2px_8px_rgba(20,15,10,0.1)] cursor-pointer transition-colors',
          mobileFilters || activeFilterCount > 0
            ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange'
            : 'bg-white border-bone text-charcoal hover:bg-cream',
        )}
      >
        <SlidersHorizontal size={13} strokeWidth={2} />
        Filters
        {activeFilterCount > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div
        className={clsx(
          'fixed inset-0 bg-black/40 z-[59] transition-opacity duration-300',
          mobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileFilters(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileFilters}
        className={clsx(
          'fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-[60] bg-white shadow-2xl outline-none overflow-y-auto',
          'transition-transform duration-300 ease-out',
          mobileFilters ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="sticky top-0 bg-white z-[1] flex items-center justify-between gap-2 px-5 py-4 border-b border-bone">
          <div className="flex items-center gap-[9px]">
            <SlidersHorizontal size={15} className="text-charcoal" strokeWidth={2} />
            <span className="text-[14.5px] font-bold text-carbon tracking-[-0.01em]">Filters</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[12px] font-medium text-slate hover:text-brand-orange transition-colors duration-200 cursor-pointer p-2 -m-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                <RefreshCcw size={12} /> Reset All
              </button>
            )}
            <button
              onClick={() => setMobileFilters(false)}
              aria-label="Close filters"
              className="size-9 rounded-full bg-cream flex items-center justify-center cursor-pointer hover:bg-bone transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              <X size={14} className="text-charcoal" />
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <EducationFilterPanel
            levels={levels} otherLevels={otherLevels} facetsLoading={facetsLoading}
            activeLevel={activeLevel} onLevelChange={l => { setActiveLevel(l); setActiveOtherSlug(''); }}
            activeOtherSlug={activeOtherSlug} onOtherSlugChange={setActiveOtherSlug}
            activeSubjects={activeSubjects} onToggleSubject={toggleSubject}
            priceRange={priceRange} onPriceRangeChange={setPriceRange}
            activeRatings={activeRatings} onToggleRating={toggleRating}
          />
        </div>
      </div>
    </div>
  );
}
