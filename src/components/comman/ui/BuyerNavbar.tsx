import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Heart, ArrowLeft, Search, Clock, LayoutGrid, X, Flame } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { TokenStorage } from '@/api/services/auth';
import { apiGetRecentSearches } from '@/api/services/search';
import { Button } from './Button';
import { SolvexoLogo } from './SolvexoLogo';
import { NotificationBell } from './NotificationBell';
import { ProfileAvatar } from './ProfileAvatar';
import { SignInPreview } from './SignInPreview';
import { MiniCart } from './MiniCart';

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

// ── Search box with recent / trending / category suggestions ────────────────
function SearchBox({
  value, onChange, placeholder, categories, onCategorySelect, onSubmit,
}: BuyerNavbarSearchConfig & { onSubmit: (term?: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

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

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (term: string) => {
    onChange(term);
    onSubmit(term);
    setOpen(false);
  };

  const hasSuggestions = recent.length > 0 || TRENDING_SEARCHES.length > 0 || (categories?.length ?? 0) > 0;

  return (
    <div ref={ref} className="relative flex-1 flex justify-center px-2 sm:px-4">
      <div
        className="flex items-center gap-2 px-3 py-[7px] bg-white border border-bone rounded-lg w-full max-w-[240px] sm:max-w-[360px] lg:max-w-[480px] transition-[border-color,box-shadow] duration-150 focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/10"
        onKeyDown={e => { if (e.key === 'Enter') { onSubmit(); setOpen(false); } if (e.key === 'Escape') setOpen(false); }}
      >
        <Search size={13} className="text-slate shrink-0" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Search marketplace...'}
          aria-label={placeholder ?? 'Search marketplace...'}
          className="border-0 outline-none text-[13px] text-carbon placeholder:text-slate bg-transparent w-full min-w-[80px]"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="text-slate hover:text-charcoal bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && hasSuggestions && (
        <div className="dropdown-enter absolute left-2 right-2 sm:left-auto sm:right-auto top-[calc(100%+8px)] w-auto sm:w-[380px] bg-white border border-bone rounded-2xl shadow-[0_20px_48px_rgba(0,0,0,0.14)] overflow-hidden max-h-[70vh] overflow-y-auto">
          {recent.length > 0 && (
            <div className="p-3.5 border-b border-bone">
              <p className="flex items-center gap-[7px] text-[10px] font-bold text-slate uppercase tracking-[0.08em] mb-2.5">
                <span className="flex size-[18px] items-center justify-center rounded-full bg-bone/70 text-graphite">
                  <Clock size={10} />
                </span>
                Recent Searches
              </p>
              <div className="flex flex-wrap gap-[7px]">
                {recent.map(term => (
                  <button
                    key={term}
                    onClick={() => pick(term)}
                    className="px-[11px] py-[6px] rounded-full text-[11.5px] font-medium bg-cream text-charcoal border border-bone hover:border-brand-orange hover:bg-brand-pale-orange hover:text-brand-deep-orange transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories && categories.length > 0 && (
            <div className="p-3.5 border-b border-bone">
              <p className="flex items-center gap-[7px] text-[10px] font-bold text-slate uppercase tracking-[0.08em] mb-2.5">
                <span className="flex size-[18px] items-center justify-center rounded-full bg-bone/70 text-graphite">
                  <LayoutGrid size={10} />
                </span>
                Popular Categories
              </p>
              <div className="flex flex-wrap gap-[7px]">
                {categories.slice(0, 8).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onCategorySelect) { onCategorySelect(cat.id); setOpen(false); }
                      else pick(cat.name);
                    }}
                    className="max-w-[160px] truncate px-[11px] py-[6px] rounded-full text-[11.5px] font-medium bg-white text-charcoal border border-bone hover:border-brand-orange hover:bg-brand-pale-orange hover:text-brand-deep-orange transition-colors cursor-pointer"
                    title={cat.name}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3.5">
            <p className="flex items-center gap-[7px] text-[10px] font-bold text-slate uppercase tracking-[0.08em] mb-2.5">
              <span className="flex size-[18px] items-center justify-center rounded-full bg-brand-pale-orange text-brand-deep-orange">
                <Flame size={10} className="fill-brand-orange/30" />
              </span>
              Trending
            </p>
            <div className="flex flex-wrap gap-[7px]">
              {TRENDING_SEARCHES.map(term => (
                <button
                  key={term}
                  onClick={() => pick(term)}
                  className="px-[11px] py-[6px] rounded-full text-[11.5px] font-medium bg-white text-charcoal border border-bone hover:border-brand-orange hover:bg-brand-pale-orange hover:text-brand-deep-orange transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WishlistButton() {
  const navigate = useNavigate();
  const { wishlistCount } = useWishlistContext();
  return (
    <button
      onClick={() => navigate('/account/profile?tab=wishlist')}
      aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
      className="relative w-9 h-9 rounded-full bg-[#FFF0F5] border border-[#FECDD3] flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-1"
    >
      <Heart size={16} className={wishlistCount > 0 ? 'text-[#E11D48] fill-[#E11D48]' : 'text-[#E11D48] fill-none'} />
      {wishlistCount > 0 && (
        <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </span>
      )}
    </button>
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
    <div className="flex items-center gap-2 shrink-0">
      <SignInPreview />
      <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')} className="hidden md:inline-flex">
        Start Selling
      </Button>
      <button
        onClick={() => navigate('/login')}
        className="md:hidden text-[13px] font-medium text-charcoal border border-bone rounded-md px-3 py-[6px] bg-transparent cursor-pointer hover:bg-cream transition-colors"
      >
        Sign In
      </button>
    </div>
  );
}

// Shrinks slightly and gains a firmer shadow once the page scrolls — the same
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

  const handleSearchSubmit = useCallback((term?: string) => {
    pushLocalRecentSearch(term ?? searchValue);
    if (!search) uncontrolled.submit(term);
  }, [search, searchValue, uncontrolled]);

  return (
    <nav className={clsx(
      'sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-bone transition-shadow duration-200',
      scrolled ? 'shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : 'shadow-xs',
    )}>
      <div className={clsx(
        'flex items-center gap-3 px-4 sm:px-6 lg:px-10 transition-[height] duration-200',
        scrolled ? 'h-[52px]' : 'h-[60px]',
      )}>

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          aria-label="Solvexo home"
          className="flex items-center gap-[6px] shrink-0 cursor-pointer bg-transparent border-none p-0 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-brand-orange/40"
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
            <SearchBox
              value={searchValue}
              onChange={searchOnChange}
              placeholder={search?.placeholder}
              categories={search?.categories}
              onCategorySelect={search?.onCategorySelect}
              onSubmit={handleSearchSubmit}
            />

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {backTo && (
                <Button variant="ghost" size="sm" onClick={() => navigate(backTo.path)} className="hidden md:inline-flex">
                  <ArrowLeft size={14} className="inline align-middle mr-1" />
                  {backTo.label}
                </Button>
              )}
              <WishlistButton />
              <MiniCart accentColor={accentColor} />
              <AccountActions />
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
