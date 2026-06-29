import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Badge } from '@/components/comman/ui/Badge';
import { Card } from '@/components/comman/ui/Card';
import { ArrowRight, ShoppingCart, GraduationCap, Star, Sparkles, BookOpen, BookMarked, Microscope, Heart } from 'lucide-react';
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

const GRADE_LEVELS = ['All Grades', 'PreK', 'K–2', '3–5', '6–8', '9–12', 'Higher Ed', 'Adult Ed'];
const SUBJECTS     = ['All', 'Math', 'ELA', 'Science', 'Social Studies', 'Art', 'SEL'];

const PRODUCTS: {
  name: string; seller: string; price: string;
  grade: string; subject: string; Img: LucideIcon; rating: string; sold: number;
}[] = [
  { name: 'Grade 5 Math Bundle – Full Year', seller: 'TeachersPro', price: '$49.00', grade: 'Grade 5',   subject: 'Math',    Img: BookOpen,   rating: '5.0', sold: 847 },
  { name: 'Reading Comprehension Passages',  seller: 'LiteracyLab', price: '$22.00', grade: 'Grade 3–5', subject: 'ELA',     Img: BookMarked, rating: '4.9', sold: 623 },
  { name: 'Science Inquiry Lab Pack',        seller: 'ScienceFirst', price: '$31.00', grade: 'Grade 6–8', subject: 'Science', Img: Microscope, rating: '4.9', sold: 501 },
  { name: 'Social-Emotional Learning Kit',   seller: 'HeartMinds',   price: '$28.00', grade: 'K–5',       subject: 'SEL',     Img: Heart,      rating: '4.8', sold: 412 },
];

// Reusable filter chip
function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-[5px] rounded-full text-[12px] font-medium cursor-pointer whitespace-nowrap outline-none transition-all duration-150 shrink-0"
      style={{
        border:          `1px solid ${active ? '#2D8A4E' : '#E8E6DC'}`,
        backgroundColor: active ? '#2D8A4E' : '#FFFFFF',
        color:           active ? '#FFFFFF' : '#2C2A28',
      }}
    >
      {label}
    </button>
  );
}

export function EducationMarketplace() {
  const navigate = useNavigate();
  usePageTitle('Education');
  const [activeGrade,   setActiveGrade]   = useState('All Grades');
  const [activeSubject, setActiveSubject] = useState('All');

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
            <span className="text-[13px] text-slate hidden md:inline">Education</span>
          </div>

          {/* Search */}
          <div className="flex-1 flex justify-center px-2 sm:px-4">
            <input
              placeholder="Search resources..."
              className="w-full max-w-[240px] sm:max-w-[360px] lg:max-w-[480px] px-[14px] py-[9px] rounded-lg border border-bone bg-cream text-[13px] text-charcoal outline-none focus:border-[#2D8A4E] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hidden on mobile — BottomNav handles navigation below md */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hidden md:inline-flex">
              Home
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')} className="hidden md:inline-flex">
              Sell on Solvexo
            </Button>

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

      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(120deg, #1A4A2C, #2D7A4E)' }}>
        <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 lg:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8">

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[rgba(255,255,255,0.55)] uppercase tracking-[0.1em] mb-2 font-medium">
              Education Marketplace
            </p>
            <h1
              className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-white mb-[10px] leading-[1.2]"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              Resources Built by Educators,<br className="hidden sm:block" /> for Educators
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[rgba(255,255,255,0.7)] mb-6 leading-[1.7] max-w-[500px]">
              Discover curriculum, lesson plans, worksheets, and more from verified teachers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {}}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                Browse All Resources
              </button>
              <Button variant="primary" size="md" onClick={() => navigate('/onboarding')} className="w-full sm:w-auto">
                Sell Your Resources
              </Button>
            </div>
          </div>

          <div className="text-[rgba(255,255,255,0.6)] hidden md:block shrink-0">
            <GraduationCap size={60} />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-[#F0F9F4] border-b border-bone">
        <div className="px-4 sm:px-6 lg:px-10">

          {/* Grade Level row */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <span className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em] whitespace-nowrap shrink-0 mr-1">
              Grade:
            </span>
            {GRADE_LEVELS.map(g => (
              <FilterChip key={g} label={g} active={activeGrade === g} onClick={() => setActiveGrade(g)} />
            ))}
          </div>

          {/* Subject row — separated so each scrolls independently */}
          <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
            <span className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em] whitespace-nowrap shrink-0 mr-1">
              Subject:
            </span>
            {SUBJECTS.map(s => (
              <FilterChip key={s} label={s} active={activeSubject === s} onClick={() => setActiveSubject(s)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-7">

        {/* Section header */}
        <div className="flex items-center gap-[6px] mb-1">
          <Star size={17} className="text-brand-orange fill-brand-orange shrink-0" />
          <h2 className="text-[16px] sm:text-[18px] font-bold text-carbon">Bestselling Resources</h2>
        </div>
        <p className="text-[12px] sm:text-[13px] text-slate mb-5">
          Top-rated resources trusted by thousands of educators.
        </p>

        {/* Grid: 2-col mobile → 2-col sm → 4-col lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
          {PRODUCTS.map(p => (
            <Card key={p.name} padding="none" hover onClick={() => navigate('/marketplace/1')} className="overflow-hidden">

              {/* Image */}
              <div className="w-full h-[110px] sm:h-[130px] lg:h-[140px] bg-success-bg flex items-center justify-center">
                <p.Img size={28} className="text-success" style={{ display: 'block', flexShrink: 0 }} />
              </div>

              {/* Body */}
              <div className="px-2 pt-2 pb-2 sm:p-[14px]">
                {/* Badges */}
                <div className="flex gap-1 mb-[5px] flex-wrap">
                  <Badge color="green">{p.grade}</Badge>
                  <Badge color="blue">{p.subject}</Badge>
                </div>

                {/* Name */}
                <p className="text-[11px] sm:text-[13px] font-bold text-carbon mb-1 leading-[1.35] line-clamp-2">
                  {p.name}
                </p>

                {/* Meta */}
                <p className="text-[10px] sm:text-[11px] text-slate mb-2 line-clamp-1">
                  <span className="hidden sm:inline">by {p.seller} · </span>
                  <Star size={9} className="inline align-middle text-brand-orange fill-brand-orange" />
                  <span className="ml-[2px]">{p.rating}</span>
                  <span className="hidden sm:inline"> · {p.sold} sold</span>
                </p>

                {/* Price + CTA */}
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[12px] sm:text-[15px] text-carbon shrink-0">{p.price}</span>
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

        {/* ── AI Builder CTA ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
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
          <Button variant="primary" size="md" onClick={() => {}} className="shrink-0 w-full sm:w-auto">
            Try AI Builder <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
      </div>

    </div>
  );
}
