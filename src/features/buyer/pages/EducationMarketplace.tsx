import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductsByCategory } from '@/hooks/marketplace/useProductsByCategory';
import { useEducationFacets } from '@/hooks/marketplace/useEducationFacets';
import { useBanners } from '@/hooks/useBanners';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { apiGenerateWorksheetTrial } from '@/api/services/marketplace';
import { EDUCATION_LEVELS } from '@/api/services/product';
import { Button } from '@/components/comman/ui/Button';
import { ProductCard, ProductCardSkeleton } from '@/components/comman/marketplace/ProductCard';
import { FilterAccordionSection, FilterChipPill } from '@/components/comman/marketplace/FilterAccordionSection';
import { BannerCarousel } from '@/components/comman/marketplace/BannerCarousel';
import { BuyerNavbar, AppDownloadBanner, Footer, FilterDropdown, Modal, DealsBanner } from '@/components/comman/ui';
import { ArrowRight, Sparkles, SlidersHorizontal, Loader2 } from 'lucide-react';

const SUBJECTS = ['Math', 'ELA', 'Science', 'Social Studies', 'Art', 'SEL'];

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

  const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#B5B3AC] outline-none';

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
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterAccordionSection title="Education Level">
        <div className="flex flex-wrap gap-[7px]">
          <FilterChipPill label="All" active={activeLevel === ''} onClick={() => onLevelChange('')} />
          {!facetsLoading && levels.map(l => (
            <FilterChipPill
              key={l.level}
              label={`${LEVEL_LABEL[l.level] ?? l.level} (${l.count})`}
              active={activeLevel === l.level}
              onClick={() => onLevelChange(l.level)}
            />
          ))}
        </div>
      </FilterAccordionSection>

      {activeLevel === 'other' && otherLevels.length > 0 && (
        <FilterAccordionSection title="Other">
          <div className="flex flex-wrap gap-[7px]">
            <FilterChipPill label="All" active={activeOtherSlug === ''} onClick={() => onOtherSlugChange('')} />
            {otherLevels.map(o => (
              <FilterChipPill
                key={o.slug}
                label={`${o.displayName} (${o.count})`}
                active={activeOtherSlug === o.slug}
                onClick={() => onOtherSlugChange(o.slug)}
              />
            ))}
          </div>
        </FilterAccordionSection>
      )}

      <FilterAccordionSection title="Subject">
        <div className="flex flex-wrap gap-[7px]">
          {SUBJECTS.map(s => (
            <FilterChipPill key={s} label={s} active={activeSubjects.includes(s)} onClick={() => onToggleSubject(s)} />
          ))}
        </div>
      </FilterAccordionSection>
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
  const [searchQuery,     setSearchQuery]     = useState('');
  const [sortBy,          setSortBy]          = useState('newest');
  const [showAiTrial,     setShowAiTrial]     = useState(false);
  const [mobileFilters,   setMobileFilters]   = useState(false);

  const { levels, otherLevels, loading: facetsLoading } = useEducationFacets();
  const { banners } = useBanners();

  const { products, total, loading, error } = useProductsByCategory(
    1, 24, undefined, 'educational',
    activeLevel || undefined,
    activeLevel === 'other' ? (activeOtherSlug || undefined) : undefined,
  );

  const toggleSubject = useCallback((s: string) => {
    setActiveSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);

  const filtered = products
    .filter(p => {
      const matchesSearch = !searchQuery
        || p.name.toLowerCase().includes(searchQuery.toLowerCase())
        || (p.sellerName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = activeSubjects.length === 0
        || activeSubjects.some(s => (p.tags ?? []).some(t => t.toLowerCase() === s.toLowerCase()));
      return matchesSearch && matchesSubject;
    })
    .sort((a, b) => {
      const priceOf = (p: typeof a) => (p.variants.find(v => v.isDefault) ?? p.variants[0])?.price ?? 0;
      if (sortBy === 'price-asc')  return priceOf(a) - priceOf(b);
      if (sortBy === 'price-desc') return priceOf(b) - priceOf(a);
      if (sortBy === 'best-rated') return b.averageRating - a.averageRating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const activeFilterCount = (activeLevel ? 1 : 0) + (activeOtherSlug ? 1 : 0) + activeSubjects.length;
  const clearFilters = () => { setActiveLevel(''); setActiveOtherSlug(''); setActiveSubjects([]); };

  return (
    <div className="min-h-screen bg-cream">

      <BuyerNavbar
        contextLabel="Education"
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search resources...' }}
      />

      <DealsBanner />

      {/* ── Admin-managed promo banners — same platform-wide Banner list shown on
          Homepage/Marketplace; there's no per-page scoping, so whatever admin
          uploads there shows here too. Hidden entirely when none are active. ── */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden h-[140px] sm:h-[180px] border-b border-bone">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-bone">
        <div className="px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-carbon">Education Marketplace</h1>
            <p className="text-[12px] text-slate mt-0.5">Curriculum, lesson plans, worksheets and more from verified educators.</p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/onboarding')} className="shrink-0">
            Sell Your Resources
          </Button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        {/* Mobile: filter + sort bar */}
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setMobileFilters(true)}
            className={`flex items-center gap-2 px-3 py-[9px] rounded-[10px] border text-[13px] font-medium transition-colors ${
              activeFilterCount > 0 ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'bg-white border-bone text-charcoal hover:bg-cream'
            }`}
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            Filters
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        </div>

        <div className="flex gap-5 lg:gap-6 items-start">

          {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-[210px] xl:w-[230px] shrink-0 sticky top-[68px] self-start">
            <div className="bg-white rounded-[16px] border border-bone overflow-hidden">
              <div className="px-5 pt-[18px] pb-4 border-b border-bone flex items-center justify-between">
                <div className="flex items-center gap-[7px]">
                  <div className="size-7 rounded-[7px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={13} className="text-brand-orange" strokeWidth={2.2} />
                  </div>
                  <span className="text-[14px] font-bold text-carbon">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center px-[4px] leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-[11px] font-medium text-brand-orange hover:opacity-70 transition-opacity cursor-pointer">
                    Clear
                  </button>
                )}
              </div>
              <div className="px-5 py-5">
                <EducationFilterPanel
                  levels={levels} otherLevels={otherLevels} facetsLoading={facetsLoading}
                  activeLevel={activeLevel} onLevelChange={l => { setActiveLevel(l); setActiveOtherSlug(''); }}
                  activeOtherSlug={activeOtherSlug} onOtherSlugChange={setActiveOtherSlug}
                  activeSubjects={activeSubjects} onToggleSubject={toggleSubject}
                />
              </div>
            </div>
          </aside>

          {/* ── Products area ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-[13px] text-slate">
                {!loading && (error ? 'Error loading' : `Showing ${filtered.length} of ${total} resources`)}
              </span>
              <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>
            <p className="lg:hidden text-[12px] text-slate mb-3">
              {!loading && !error && `${filtered.length} of ${total} resources`}
            </p>

            {error && !loading && (
              <div className="p-6 flex flex-col items-center gap-3 text-center bg-error-bg rounded-[12px] border border-[#FECACA] text-error text-[13px]">
                <span>Couldn't load resources right now — please try again shortly.</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[10px] sm:gap-3 lg:gap-[14px]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : filtered.map(p => {
                    const defVariant = p.variants.find(v => v.isDefault) ?? p.variants[0];
                    const vId = defVariant?._id ?? '';
                    return (
                      <ProductCard
                        key={p._id}
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
              <div className="text-center py-[60px] text-slate text-[14px]">
                No educational resources match your filters yet.
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

            <div className="mt-6">
              <AppDownloadBanner />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────────────── */}
      {mobileFilters && (
        <Modal title="Filters" onClose={() => setMobileFilters(false)}>
          <EducationFilterPanel
            levels={levels} otherLevels={otherLevels} facetsLoading={facetsLoading}
            activeLevel={activeLevel} onLevelChange={l => { setActiveLevel(l); setActiveOtherSlug(''); }}
            activeOtherSlug={activeOtherSlug} onOtherSlugChange={setActiveOtherSlug}
            activeSubjects={activeSubjects} onToggleSubject={toggleSubject}
          />
        </Modal>
      )}

      {showAiTrial && <WorksheetTrialModal onClose={() => setShowAiTrial(false)} />}

      <Footer />
    </div>
  );
}
