import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Badge } from '@/components/comman/ui/Badge';
import { Card } from '@/components/comman/ui/Card';
import { TabBar, FilterDropdown } from '@/components/comman/ui';
import type { Tab } from '@/components/comman/ui';
import { ShoppingCart, BookOpen, Star, Divide, BookMarked, Microscope, Map, Pencil, FileText, Ruler, Check } from 'lucide-react';
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

const PRODUCTS: { name: string; price: string; Img: LucideIcon; rating: string; sold: string }[] = [
  { name: 'Grade 5 Math Bundle',        price: '$49', Img: BookOpen,   rating: '5.0', sold: '847sold' },
  { name: 'Fractions Mastery Kit',      price: '$18', Img: Divide,     rating: '4.9', sold: '623sold' },
  { name: 'Reading Comprehension Pack', price: '$22', Img: BookMarked, rating: '4.9', sold: '501sold' },
  { name: 'Science Lab Worksheets',     price: '$15', Img: Microscope, rating: '4.8', sold: '389sold' },
  { name: 'State Capitals Flash Cards', price: '$9',  Img: Map,        rating: '4.7', sold: '302sold' },
  { name: 'Creative Writing Prompts',   price: '$12', Img: Pencil,     rating: '4.8', sold: '278sold' },
  { name: 'Year-End Test Prep Bundle',  price: '$35', Img: FileText,   rating: '5.0', sold: '244sold' },
  { name: 'Geometry Exploration Kit',   price: '$21', Img: Ruler,      rating: '4.9', sold: '198sold' },
];

export function SellerStorefront() {
  const navigate  = useNavigate();
  usePageTitle('Storefront');
  const [activeTab, setActiveTab] = useState('All Products');
  const [sortBy,    setSortBy]    = useState('best-selling');

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center gap-4 px-10">
        <div className="flex items-center gap-2 flex-shrink-0">
          <SolvexoIcon size={28} />
          <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
          <span className="font-bold text-[15px] text-brand-orange">o</span>
          <span className="text-bone mx-1">|</span>
          <span className="text-[13px] text-slate">Marketplace</span>
        </div>
        <div className="flex-1 flex justify-center">
          <input
            placeholder="Search marketplace..."
            className="w-full max-w-[440px] px-[14px] py-2 rounded-lg border border-bone bg-cream text-[13px] text-charcoal outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>← Marketplace</Button>
          <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center cursor-pointer">
            <ShoppingCart size={16} className="text-white" />
          </div>
        </div>
      </nav>

      {/* ── Store Banner ───────────────────────────────────────────────────── */}
      <div className="px-10 py-9 flex items-center gap-6 bg-gradient-to-br from-[#1A4A2C] to-[#2D7A4E]">
        <div className="w-20 h-20 rounded-[20px] bg-white flex items-center justify-center flex-shrink-0">
          <BookOpen size={40} className="text-brand-orange" />
        </div>

        <div className="flex-1">
          <div className="text-[26px] font-bold text-white mb-[6px]">TeachersPro</div>
          <div className="text-[13px] text-[rgba(255,255,255,0.75)] mb-[10px]">
            Veteran educator • 2,140 sales •{' '}
            <Star size={12} className="inline align-middle text-brand-orange fill-brand-orange" />{' '}
            5.0 • Member since 2021
          </div>
          <div className="flex gap-2">
            <Badge color="green">
              <Check size={10} className="inline align-middle mr-[3px]" />Top Seller
            </Badge>
            <Badge color="blue">Education Specialist</Badge>
          </div>
        </div>

        <div className="ml-auto flex flex-col gap-2 items-end">
          <button className="px-[14px] py-[6px] rounded-lg text-[12px] font-medium bg-transparent text-white border border-white cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            Follow Store
          </button>
          <Button variant="primary" size="sm">Message Seller</Button>
        </div>
      </div>

      {/* ── Store Tabs ─────────────────────────────────────────────────────── */}
      <div className="bg-white">
        <TabBar tabs={STORE_TABS} active={activeTab} onChange={setActiveTab} className="px-10" />
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="px-10 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-bold text-[#141413]">47 Products</span>
          <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {PRODUCTS.map(p => (
            <Card key={p.name} padding="none" hover onClick={() => navigate('/marketplace/1')}>
              <div className="h-[130px] bg-success-bg flex items-center justify-center rounded-t-[10px]">
                <p.Img size={48} className="text-success" />
              </div>
              <div className="p-[14px]">
                <div className="text-[12px] font-bold text-[#141413] leading-[1.4] mb-1">
                  {p.name}
                </div>
                <div className="flex items-center gap-[3px] text-[11px] text-slate mb-2">
                  <Star size={11} className="text-brand-orange fill-brand-orange" />
                  {p.rating} • {p.sold}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[14px] text-[#141413]">{p.price}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={e => e.stopPropagation()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
