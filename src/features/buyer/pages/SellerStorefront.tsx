import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Badge } from '@/components/comman/ui/Badge';
import { Card } from '@/components/comman/ui/Card';
import { TabBar, FilterDropdown } from '@/components/comman/ui';
import type { Tab } from '@/components/comman/ui';
import {
  ShoppingCart, Star, Heart,
  Check, ArrowLeft, BookOpen, Divide, BookMarked,
  Microscope, Map, Pencil, FileText, Ruler,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function SolvexoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#D97757"/>
      <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
      <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
      <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const STORE_TABS: Tab[] = ['All Products', 'Math', 'Reading', 'Science', 'Social Studies', 'Bundles']
  .map(t => ({ id: t, label: t }));

const SORT_OPTIONS = [
  { value: 'best-selling', label: 'Best Selling'   },
  { value: 'newest',       label: 'Newest'          },
  { value: 'price-asc',    label: 'Price: Low–High' },
  { value: 'best-rated',   label: 'Best Rated'      },
];

const PRODUCTS: {
  name: string; price: string; Img: LucideIcon; rating: string;
  ratingCount: number; sold: string; type: 'digital' | 'physical';
}[] = [
  { name: 'Grade 5 Math Bundle',        price: '$49', Img: BookOpen,   rating: '5.0', ratingCount: 847, sold: '847 sold', type: 'digital'  },
  { name: 'Fractions Mastery Kit',      price: '$18', Img: Divide,     rating: '4.9', ratingCount: 623, sold: '623 sold', type: 'digital'  },
  { name: 'Reading Comprehension Pack', price: '$22', Img: BookMarked, rating: '4.9', ratingCount: 501, sold: '501 sold', type: 'digital'  },
  { name: 'Science Lab Worksheets',     price: '$15', Img: Microscope, rating: '4.8', ratingCount: 389, sold: '389 sold', type: 'digital'  },
  { name: 'State Capitals Flash Cards', price: '$9',  Img: Map,        rating: '4.7', ratingCount: 302, sold: '302 sold', type: 'physical' },
  { name: 'Creative Writing Prompts',   price: '$12', Img: Pencil,     rating: '4.8', ratingCount: 278, sold: '278 sold', type: 'digital'  },
  { name: 'Year-End Test Prep Bundle',  price: '$35', Img: FileText,   rating: '5.0', ratingCount: 244, sold: '244 sold', type: 'digital'  },
  { name: 'Geometry Exploration Kit',   price: '$21', Img: Ruler,      rating: '4.9', ratingCount: 198, sold: '198 sold', type: 'digital'  },
];

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: string; count?: number }) {
  const r = parseFloat(rating);
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={10}
          className={i <= Math.round(r) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'}
        />
      ))}
      {count !== undefined && (
        <span className="text-[10px] text-slate ml-[2px] hidden sm:inline">({count})</span>
      )}
    </div>
  );
}


export function SellerStorefront() {
  const navigate  = useNavigate();
  usePageTitle('Storefront');
  const [activeTab,  setActiveTab]  = useState('All Products');
  const [sortBy,     setSortBy]     = useState('best-selling');
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const toggleWishlist = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setWishlisted(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone">
        <div className="h-[60px] flex items-center gap-3 px-4 sm:px-6 lg:px-10">

          {/* Logo */}
          <div className="flex items-center gap-[6px] shrink-0">
            <SolvexoIcon size={28} />
            <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
            <span className="font-bold text-[15px] text-brand-orange">o</span>
            <span className="text-bone mx-1 hidden md:inline">|</span>
            <span className="text-[13px] text-slate hidden md:inline">Marketplace</span>
          </div>

          {/* Search */}
          <div className="flex-1 flex justify-center px-2 sm:px-4">
            <input
              placeholder="Search store..."
              className="w-full max-w-[240px] sm:max-w-[360px] lg:max-w-[480px] px-[14px] py-[9px] rounded-lg border border-bone bg-cream text-[13px] text-charcoal outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/marketplace')}
              className="hidden md:inline-flex"
            >
              <ArrowLeft size={13} className="mr-1" /> Marketplace
            </Button>

            {/* Wishlist */}
            <div
              onClick={() => navigate('/account/profile?tab=wishlist')}
              className="relative w-9 h-9 rounded-full bg-[#FFF0F5] border border-[#FECDD3] flex items-center justify-center cursor-pointer shrink-0"
            >
              <Heart size={16} className={wishlisted.size > 0 ? 'text-[#E11D48] fill-[#E11D48]' : 'text-[#E11D48] fill-none'} />
              {wishlisted.size > 0 && (
                <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] rounded-[9px] bg-[#E11D48] text-white text-[10px] font-bold leading-[18px] text-center px-1 shadow-[0_0_0_2px_#fff]">
                  {wishlisted.size > 99 ? '99+' : wishlisted.size}
                </span>
              )}
            </div>

            {/* Cart */}
            <div
              onClick={() => navigate('/cart')}
              className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center cursor-pointer shrink-0"
            >
              <ShoppingCart size={16} className="text-white" />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Store Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1A4A2C] to-[#2D7A4E]">
        <div className="px-4 sm:px-6 lg:px-10 py-7 sm:py-9 lg:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">

            {/* Store logo */}
            <div className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-[18px] sm:rounded-[20px] bg-white flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
              <BookOpen size={36} className="text-brand-orange" />
            </div>

            {/* Store info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] sm:text-[26px] font-bold text-white mb-[6px] leading-tight">
                TeachersPro
              </h1>
              <div className="text-[12px] sm:text-[13px] text-[rgba(255,255,255,0.75)] mb-[10px]">
                Veteran educator &nbsp;·&nbsp; 2,140 sales &nbsp;·&nbsp;
                <Star size={12} className="inline align-middle text-brand-orange fill-brand-orange mx-[3px]" />
                5.0 &nbsp;·&nbsp; Member since 2021
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge color="green">
                  <Check size={10} className="inline align-middle mr-[3px]" />Top Seller
                </Badge>
                <Badge color="blue">Education Specialist</Badge>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-row sm:flex-col gap-2 items-center sm:items-end shrink-0">
              <button className="px-[14px] py-[7px] rounded-lg text-[12px] sm:text-[13px] font-medium bg-transparent text-white border border-[rgba(255,255,255,0.5)] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors whitespace-nowrap">
                Follow Store
              </button>
              <Button variant="primary" size="sm">Message Seller</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Store Tabs ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-bone overflow-x-auto scrollbar-hide">
        <TabBar tabs={STORE_TABS} active={activeTab} onChange={setActiveTab} className="px-4 sm:px-6 lg:px-10" />
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">

        {/* Count + sort row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] text-slate">47 Products</span>
          <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        </div>

        <div className="flex gap-5 lg:gap-6 items-start">

          {/* ── Products area ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Grid: 2-col mobile → 3-col md → 4-col xl */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[10px] sm:gap-3 lg:gap-[14px]">
              {PRODUCTS.map(p => (
                <Card key={p.name} padding="none" hover onClick={() => navigate('/marketplace/1')} className="overflow-hidden">

                  {/* Image */}
                  <div className="relative w-full h-[110px] sm:h-[150px] lg:h-[170px] bg-success-bg flex items-center justify-center">
                    <p.Img size={28} className="text-success" style={{ display: 'block', flexShrink: 0 }} />

                    {/* Wishlist button */}
                    <button
                      onClick={e => toggleWishlist(e, p.name)}
                      className="absolute top-[6px] right-[6px] w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[rgba(255,255,255,0.92)] flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.12)] cursor-pointer border-none"
                    >
                      <Heart
                        size={11}
                        className={clsx(
                          'transition-[color,fill] duration-150',
                          wishlisted.has(p.name) ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate fill-none',
                        )}
                      />
                    </button>

                    {/* Type badge */}
                    <span className={clsx(
                      'absolute top-[6px] left-[6px] px-[5px] py-[2px] rounded-[4px] text-[9px] font-semibold border leading-none',
                      p.type === 'digital'
                        ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
                        : 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]',
                    )}>
                      {p.type === 'digital' ? 'Digital' : 'Physical'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-2 pt-2 pb-2 sm:px-3 sm:pt-[10px] sm:pb-3">
                    <p className="font-bold text-[11px] sm:text-[13px] text-carbon mb-[3px] leading-[1.4] line-clamp-2">
                      {p.name}
                    </p>
                    <StarRating rating={p.rating} count={p.ratingCount} />
                    <div className="flex items-center justify-between gap-1 mt-[6px] sm:mt-[10px]">
                      <span className="font-bold text-[12px] sm:text-[15px] text-carbon shrink-0">{p.price}</span>
                      {/* icon only on sm/md, full text on lg+ */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex"
                      >
                        <ShoppingCart size={11} />
                        <span className="hidden lg:inline">Add to Cart</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
