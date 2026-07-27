import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowLeft, Search, Clock, LayoutGrid, X, TrendingUp, Tag, Star, Sparkles } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { apiGetRecentSearches } from '@/api/services/search';
import { apiGetAllProducts, type MarketplaceProduct } from '@/api/services/marketplace';
import { ProductImage } from '@/components/comman/marketplace/ProductCard';
import { Button } from './Button';
import { SolvexoLogo } from './SolvexoLogo';
import { SkeletonBox } from './SkeletonBox';
import { NotificationBell } from './NotificationBell';
import { ProfileAvatar } from './ProfileAvatar';
import { SignInPreview } from './SignInPreview';
import { MiniCart } from './MiniCart';
import { MiniWishlist } from './MiniWishlist';

export interface BuyerNavbarSearchConfig {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Real category list (e.g. from Marketplace) shown as "Popular Categories" suggestions. */
  categories?: { id: string; name: string }[];
  /** Called when a category suggestion is clicked — lets the host page filter locally instead of falling back to a text search. */
  onCategorySelect?: (id: string) => void;
}

export interface BuyerNavbarProps {
  /** 'full' shows search/wishlist/cart/notifications/account (default). 'minimal' shows only the logo + optional backTo — used on Checkout/OrderSuccess to keep the flow distraction-free. */
  variant?: 'full' | 'minimal';
  /** Short label shown next to the logo, e.g. "Marketplace", "Education", a store name. */
  contextLabel?: string;
  /** Controlled search box — pass when the page filters locally (Marketplace, EducationMarketplace, SellerStorefront). Omit to get an uncontrolled box that navigates to /marketplace?search=... on submit. */
  search?: BuyerNavbarSearchConfig;
  /** Cart-button background override, used by SellerStorefront to match its store theme color. */
  accentColor?: string;
  /** Optional back-link button, e.g. "Continue Shopping" or "Back to Cart". */
  backTo?: { label: string; path: string };
}

const RECENT_KEY = 'solvexo_recent_searches';
const TRENDING_SEARCHES = ['Wireless Earbuds', 'Digital Planner', 'Desk Organizer', 'Handmade Jewelry', 'Watercolor Prints'];

function getLocalRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function pushLocalRecentSearch(term: string) {
  const t = term.trim();
  if (!t) return;
  const next = [t, ...getLocalRecentSearches().filter(s => s.toLowerCase() !== t.toLowerCase())].slice(0, 5);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
}

function useUncontrolledSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const submit = (term?: string) => {
    const q = (term ?? value).trim();
    if (q) navigate(`/marketplace?search=${encodeURIComponent(q)}`);
  };
  return { value, onChange: setValue, submit };
}

// ── Section header — one consistent label style for every dropdown section ──
function SearchSectionLabel({ icon, tone = 'neutral', children }: { icon: React.ReactNode; tone?: 'neutral' | 'brand'; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-[7px] text-[10px] font-bold text-slate uppercase tracking-[0.08em] mb-[10px]">
      <span className={clsx(
        'flex size-[18px] items-center justify-center rounded-full shrink-0',
        tone === 'brand' ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-bone/70 text-graphite',
      )}>
        {icon}
      </span>
      {children}
    </p>
  );
}

// ── Compact suggestion row — Recent/Trending searches as a real row (icon +
// term, full-width, hover fill), not a chip cloud. ──
function SuggestionRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      data-search-item
      onClick={onClick}
      className="w-full flex items-center gap-[11px] px-2 py-[9px] rounded-lg bg-transparent border-none text-left cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:bg-cream"
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-cream text-slate shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-[13px] text-charcoal truncate">{label}</span>
    </button>
  );
}

// ── Recommended product row — 56×56 thumbnail + title + category + rating +
// price, not a cropped image strip. Reuses ProductImage (same component
// ProductCard/MegaMenuBar use) inside a fixed-size frame — ProductImage's
// own base classes force `w-full`, so it must be wrapped in a sized box
// rather than sized directly, or it stretches to its flex row's full width. ──
function RecommendedProductRow({ product, categoryName, onClick }: { product: MarketplaceProduct; categoryName: string; onClick: () => void }) {
  const dv        = (product.variants ?? []).find(v => v.isDefault) ?? product.variants?.[0];
  const price     = dv?.price ?? null;
  const compareAt = dv?.compareAtPrice ?? null;
  return (
    <button
      data-search-item
      onClick={onClick}
      className="group w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-transparent border-none text-left cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:bg-cream"
    >
      <span className="w-14 h-14 rounded-[10px] overflow-hidden shrink-0 bg-brand-pale-orange">
        <ProductImage images={product.images ?? []} name={product.name} className="w-full h-full object-cover" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-carbon leading-snug line-clamp-1 group-hover:text-brand-deep-orange transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-[6px] mt-[3px] min-w-0">
          <span className="text-[10.5px] text-slate truncate">{categoryName}</span>
          <span className="text-bone shrink-0">•</span>
          <span className="flex items-center gap-[3px] text-[10.5px] text-slate shrink-0">
            <Star size={9} className={product.averageRating > 0 ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'} />
            {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-[2px] shrink-0">
        <span className="text-[13px] font-bold text-carbon">{price != null ? `$${price.toLocaleString()}` : '—'}</span>
        {compareAt != null && price != null && compareAt > price && (
          <span className="text-[10px] text-slate line-through">${compareAt.toLocaleString()}</span>
        )}
      </div>
    </button>
  );
}

// ── Search box with recent / trending / category / product suggestions ──────
function SearchBox({
  value, onChange, placeholder, categories, onCategorySelect, onSubmit, autoFocus,
}: BuyerNavbarSearchConfig & { onSubmit: (term?: string) => void; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [pool, setPool] = useState<MarketplaceProduct[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const poolFetched = useRef(false);
  const [isMac] = useState(() => typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent));

  useEffect(() => {
    if (!open) return;

    const local = getLocalRecentSearches();
    if (TokenStorage.isLoggedIn()) {
      // Account-synced history when the backend has it; merge in anything
      // typed this session that hasn't round-tripped to the server yet.
      apiGetRecentSearches(5)
        .then(res => {
          const synced = res.data.map(r => r.query);
          const extra = local.filter(t => !synced.some(s => s.toLowerCase() === t.toLowerCase()));
          setRecent([...synced, ...extra].slice(0, 5));
        })
        .catch(() => setRecent(local));
    } else {
      setRecent(local);
    }

    // Recommended-products pool — fetched once per mount (not on every open),
    // reusing the same public listing endpoint Homepage/Marketplace already
    // call for their own "trending"/"top picks" rails. Filtered client-side
    // by the typed query below — no new endpoint, no backend change.
    if (!poolFetched.current) {
      poolFetched.current = true;
      setPoolLoading(true);
      apiGetAllProducts(1, 20)
        .then(res => setPool(res.data.products))
        .catch(() => {})
        .finally(() => setPoolLoading(false));
    }

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Global ⌘K / Ctrl+K — focuses and opens the search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const pick = (term: string) => {
    onChange(term);
    onSubmit(term);
    setOpen(false);
  };

  const goToProduct = (id: string) => {
    setOpen(false);
    navigate(`/marketplace/${id}`);
  };

  // Arrow-key navigation across every suggestion — moves real DOM focus (not
  // a simulated highlight), so Enter/Space on a focused item just works via
  // native button semantics, and Tab order stays correct for free.
  const moveFocus = (dir: 'down' | 'up') => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-search-item]') ?? []);
    if (items.length === 0) return;
    const active = document.activeElement;
    const idx = items.indexOf(active as HTMLElement);
    if (dir === 'down') {
      items[idx === -1 ? 0 : Math.min(idx + 1, items.length - 1)]?.focus();
    } else {
      if (idx <= 0) inputRef.current?.focus();
      else items[idx - 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); moveFocus('down'); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus('up'); }
    else if (e.key === 'Enter' && document.activeElement === inputRef.current) { onSubmit(); setOpen(false); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const query = value.trim().toLowerCase();
  const recommended = query
    ? pool.filter(p => p.name.toLowerCase().includes(query)).slice(0, 4)
    : [...pool]
        .sort((a, b) => (b.purchaseCount + b.averageRating * 10) - (a.purchaseCount + a.averageRating * 10))
        .slice(0, 4);

  const typeLabel = (p: MarketplaceProduct) => {
    const t = p.productType ?? p.type ?? 'physical';
    return t === 'physical' ? 'Physical' : t === 'educational' ? 'Educational' : 'Digital';
  };
  // Real category name when the host page has the list (Marketplace) —
  // falls back to the product type (Physical/Digital/Educational) where it
  // doesn't (Education Marketplace, Seller Store), so the row never shows a
  // raw id or goes blank.
  const categoryNameFor = (p: MarketplaceProduct) => categories?.find(c => c.id === p.categoryId)?.name ?? typeLabel(p);

  const hasSuggestions = recent.length > 0 || TRENDING_SEARCHES.length > 0 || (categories?.length ?? 0) > 0 || recommended.length > 0 || poolLoading;

  return (
    <div ref={ref} className="relative flex-1 flex justify-center px-2 sm:px-4" onKeyDown={handleKeyDown}>
      {/* Input and dropdown share this one sized wrapper so they're always
         exactly the same width — the dropdown reads as an extension of the
         input, not a separately-floating box. */}
      {/* No base max-width — on mobile this only renders inside the full-width
         expanded search row (mobileSearchOpen), where a 240px cap would leave
         no room for the 56px product-row thumbnails; sm+ still caps it to sit
         comfortably between the logo and the account icons. */}
      <div className="relative w-full sm:max-w-[360px] lg:max-w-[480px]">
        <div
          className={clsx(
            'group relative flex items-center gap-[9px] px-[14px] py-[9px] bg-white border rounded-xl w-full',
            'transition-[border-color,box-shadow,background-color] duration-200 ease-out',
            open
              ? 'border-brand-orange shadow-[0_2px_12px_rgba(217,119,87,0.12)] ring-[3px] ring-brand-orange/10'
              : 'border-bone hover:border-[#DEDBD0]',
          )}
        >
          <Search size={15} className={clsx('shrink-0 transition-colors duration-200', open ? 'text-brand-orange' : 'text-slate')} />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={panelId}
            aria-autocomplete="list"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? 'Search products, categories, stores…'}
            aria-label={placeholder ?? 'Search products, categories, stores'}
            autoFocus={autoFocus}
            className="border-0 outline-none text-[13.5px] text-carbon placeholder:text-slate/80 bg-transparent w-full min-w-0"
          />
          {value ? (
            <button
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="text-slate hover:text-charcoal bg-transparent border-none cursor-pointer p-0 shrink-0 transition-colors"
            >
              <X size={14} />
            </button>
          ) : !open && (
            <kbd className="hidden sm:flex items-center gap-[2px] text-[10px] font-semibold text-slate/70 bg-cream border border-bone rounded-[5px] px-[6px] py-[2px] shrink-0 leading-none">
              {isMac ? '⌘' : 'Ctrl'}K
            </kbd>
          )}
        </div>

        {open && hasSuggestions && (
          <div
            id={panelId}
            role="listbox"
            aria-label="Search suggestions"
            className="dropdown-enter absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-bone rounded-2xl overflow-y-auto overscroll-contain shadow-[0_6px_20px_-4px_rgba(20,15,10,0.08)] max-h-[460px]"
          >
            {recent.length > 0 && (
              <div className="px-3 py-3 border-b border-bone">
                <div className="px-1"><SearchSectionLabel icon={<Clock size={10} />}>Recent Searches</SearchSectionLabel></div>
                <div className="flex flex-col">
                  {recent.map(term => (
                    <SuggestionRow key={term} icon={<Clock size={13} />} label={term} onClick={() => pick(term)} />
                  ))}
                </div>
              </div>
            )}

            <div className="px-3 py-3 border-b border-bone">
              <div className="px-1"><SearchSectionLabel icon={<TrendingUp size={10} />} tone="brand">Trending Searches</SearchSectionLabel></div>
              <div className="flex flex-col">
                {TRENDING_SEARCHES.map(term => (
                  <SuggestionRow key={term} icon={<TrendingUp size={13} />} label={term} onClick={() => pick(term)} />
                ))}
              </div>
            </div>

            {categories && categories.length > 0 && (
              <div className="px-4 py-3 border-b border-bone">
                <SearchSectionLabel icon={<LayoutGrid size={10} />}>Popular Categories</SearchSectionLabel>
                <div className="flex flex-wrap gap-[7px]">
                  {categories.slice(0, 8).map(cat => (
                    <button
                      key={cat.id}
                      data-search-item
                      onClick={() => {
                        if (onCategorySelect) { onCategorySelect(cat.id); setOpen(false); }
                        else pick(cat.name);
                      }}
                      className="flex items-center gap-[6px] max-w-[170px] px-[12px] py-[7px] rounded-full text-[11.5px] font-medium bg-white text-charcoal border border-bone hover:border-brand-orange hover:bg-brand-pale-orange hover:text-brand-deep-orange focus-visible:outline-none focus-visible:border-brand-orange focus-visible:bg-brand-pale-orange transition-colors duration-150 cursor-pointer"
                      title={cat.name}
                    >
                      <Tag size={11} className="shrink-0 text-brand-orange" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(recommended.length > 0 || poolLoading) && (
              <div className="px-3 py-3">
                <div className="px-1"><SearchSectionLabel icon={<Sparkles size={10} />}>{query ? 'Matching Products' : 'Recommended Products'}</SearchSectionLabel></div>
                {poolLoading && recommended.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 px-2 py-2">
                        <SkeletonBox width={56} height={56} rounded="10px" />
                        <div className="flex-1 flex flex-col gap-[6px]">
                          <SkeletonBox width="70%" height={11} rounded="4px" />
                          <SkeletonBox width="35%" height={9} rounded="4px" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-[2px]">
                    {recommended.map(p => (
                      <RecommendedProductRow key={p._id} product={p} categoryName={categoryNameFor(p)} onClick={() => goToProduct(p._id)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountActions() {
  const navigate = useNavigate();
  if (TokenStorage.isLoggedIn()) {
    return (
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ProfileAvatar />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      <SignInPreview />
      <div className="hidden md:inline-flex">
        <Button variant="primary" size="sm" onClick={() => navigate('/onboard')}>
          Start Selling
        </Button>
      </div>
      <button
        onClick={() => navigate('/login')}
        className="md:hidden text-[13px] font-medium text-charcoal border border-bone rounded-md px-[10px] py-[6px] bg-transparent cursor-pointer hover:bg-cream transition-colors"
      >
        Sign In
      </button>
    </div>
  );
}

// Shrinks slightly and gains a solid background + border once the page scrolls — the same
// "compact sticky header" behavior applies everywhere BuyerNavbar is used
// (Marketplace, Product Detail, Seller Storefront, Category/Search views).
function useCompactOnScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

export function BuyerNavbar({ variant = 'full', contextLabel, search, accentColor, backTo }: BuyerNavbarProps) {
  const navigate = useNavigate();
  const uncontrolled = useUncontrolledSearch();
  const scrolled = useCompactOnScroll();
  const searchValue    = search?.value    ?? uncontrolled.value;
  const searchOnChange = search?.onChange ?? uncontrolled.onChange;
  // Below sm (~640px) there isn't room for logo + a real search input + wishlist/cart/
  // account icons in one row (confirmed via measurement: they need ~110px more than a
  // 320-375px viewport has) — so on mobile the search collapses to a single icon button
  // that expands to a full-width row in its place, same pattern as Amazon/Shopify mobile.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = useCallback((term?: string) => {
    pushLocalRecentSearch(term ?? searchValue);
    if (!search) uncontrolled.submit(term);
  }, [search, searchValue, uncontrolled]);

  return (
    <nav className={clsx(
      'sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 border-b',
      scrolled ? 'bg-white border-bone' : 'bg-white/90 border-transparent',
    )}>
      <div className={clsx(
        'flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-10 transition-[height] duration-200',
        scrolled ? 'h-[52px]' : 'h-[60px]',
      )}>

        {/* Logo — hidden while the mobile search row is expanded so the input gets full width */}
        <button
          onClick={() => navigate('/')}
          aria-label="Solvexo home"
          className={clsx(
            'items-center gap-[6px] shrink-0 cursor-pointer bg-transparent border-none p-0 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-brand-orange/40',
            mobileSearchOpen ? 'hidden sm:flex' : 'flex',
          )}
        >
          <SolvexoLogo size={scrolled ? 24 : 28} className="transition-[width,height] duration-200" />
          {contextLabel && (
            <>
              <span className="text-bone mx-1 hidden md:inline">|</span>
              <span className="text-[13px] text-slate hidden md:inline">{contextLabel}</span>
            </>
          )}
        </button>

        {variant === 'minimal' ? (
          <div className="flex-1 flex items-center justify-end">
            {backTo && (
              <Button variant="ghost" size="sm" onClick={() => navigate(backTo.path)}>
                <ArrowLeft size={14} className="inline align-middle mr-1" />
                {backTo.label}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Single SearchBox instance — its container is always visible at sm+,
                and on mobile only shown once the search icon below is tapped. */}
            <div className={clsx('min-w-0 justify-center', mobileSearchOpen ? 'flex flex-1' : 'hidden sm:flex sm:flex-1')}>
              <SearchBox
                value={searchValue}
                onChange={searchOnChange}
                placeholder={search?.placeholder}
                categories={search?.categories}
                onCategorySelect={search?.onCategorySelect}
                onSubmit={term => { handleSearchSubmit(term); setMobileSearchOpen(false); }}
                autoFocus={mobileSearchOpen}
              />
            </div>

            {!mobileSearchOpen && (
              <button
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search"
                className="sm:hidden ml-auto shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-charcoal cursor-pointer hover:bg-cream transition-colors"
              >
                <Search size={18} />
              </button>
            )}
            {mobileSearchOpen && (
              <button
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close search"
                className="sm:hidden shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-cream text-charcoal cursor-pointer"
              >
                <X size={18} />
              </button>
            )}

            {/* Actions — hidden on mobile while search is expanded so the input gets full width */}
            <div className={clsx('items-center gap-1 sm:gap-2 shrink-0', mobileSearchOpen ? 'hidden sm:flex' : 'flex')}>
              {backTo && (
                <div className="hidden md:inline-flex">
                  <Button variant="ghost" size="sm" onClick={() => navigate(backTo.path)}>
                    <ArrowLeft size={14} className="inline align-middle mr-1" />
                    {backTo.label}
                  </Button>
                </div>
              )}
              <MiniWishlist />
              <MiniCart accentColor={accentColor} />
              <AccountActions />
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
