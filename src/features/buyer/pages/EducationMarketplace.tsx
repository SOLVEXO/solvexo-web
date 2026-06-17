import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
const SUBJECTS = ['All', 'Math', 'ELA', 'Science', 'Social Studies', 'Art', 'SEL'];

const PRODUCTS: { name: string; seller: string; price: string; grade: string; subject: string; Img: LucideIcon; rating: string; sold: number }[] = [
  { name: 'Grade 5 Math Bundle – Full Year', seller: 'TeachersPro', price: '$49.00', grade: 'Grade 5', subject: 'Math', Img: BookOpen,   rating: '5.0', sold: 847 },
  { name: 'Reading Comprehension Passages', seller: 'LiteracyLab', price: '$22.00', grade: 'Grade 3–5', subject: 'ELA', Img: BookMarked, rating: '4.9', sold: 623 },
  { name: 'Science Inquiry Lab Pack', seller: 'ScienceFirst', price: '$31.00', grade: 'Grade 6–8', subject: 'Science', Img: Microscope,  rating: '4.9', sold: 501 },
  { name: 'Social-Emotional Learning Kit', seller: 'HeartMinds', price: '$28.00', grade: 'K–5', subject: 'SEL', Img: Heart,       rating: '4.8', sold: 412 },
];

export function EducationMarketplace() {
  const navigate = useNavigate();
  usePageTitle('Education');
  const [activeGrade, setActiveGrade] = useState('All Grades');
  const [activeSubject, setActiveSubject] = useState('All');

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center gap-4 px-10">
        <div className="flex items-center gap-2 flex-shrink-0">
          <SolvexoIcon size={28} />
          <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
          <span className="font-bold text-[15px] text-brand-orange">o</span>
          <span className="text-bone mx-1">|</span>
          <span className="text-[13px] text-[#8C8A82]">Education Marketplace</span>
        </div>
        <div className="flex-1 flex justify-center">
          <input
            placeholder="Search marketplace..."
            className="w-full max-w-[440px] px-[14px] py-2 rounded-lg border border-bone bg-cream text-[13px] text-charcoal outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>Sell on Solvexo</Button>
          <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center cursor-pointer">
            <ShoppingCart size={16} className="text-white" />
          </div>
        </div>
      </nav>

      {/* Hero banner */}
      <div
        className="px-10 py-9 flex items-center justify-between"
        style={{ background: 'linear-gradient(120deg, #1A4A2C, #2D7A4E)' }}
      >
        <div>
          <div className="text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[0.1em] mb-2">
            EDUCATION MARKETPLACE
          </div>
          <h1
            className="text-[30px] font-bold text-white mb-[10px] leading-[1.25]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Resources Built by Educators,<br />for Educators
          </h1>
          <p className="text-[13px] text-[rgba(255,255,255,0.7)] mb-5 leading-[1.6]">
            Discover curriculum, lesson plans, worksheets, and more from verified teachers.
          </p>
          <div className="flex gap-[10px]">
            <button className="px-5 py-[10px] rounded-lg text-[13px] font-medium bg-transparent text-white border border-white cursor-pointer">
              Browse All Resources
            </button>
            <Button variant="primary" size="md" onClick={() => navigate('/onboarding')}>Sell Your Resources</Button>
          </div>
        </div>
        <div className="text-[rgba(255,255,255,0.6)]"><GraduationCap size={80} /></div>
      </div>

      {/* Grade level + subject filter bar */}
      <div
        className="px-10 py-4 border-b border-bone flex items-center gap-0 overflow-x-auto"
        style={{ backgroundColor: '#F0F9F4' }} /* education-specific green tint */
      >
        {/* Grade Level label */}
        <span className="text-[12px] font-semibold text-[#8C8A82] mr-1 whitespace-nowrap">
          Grade Level:
        </span>

        {/* Grade chips */}
        {GRADE_LEVELS.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGrade(g)}
            className="px-3 py-[5px] rounded-[20px] text-[12px] font-medium cursor-pointer mr-[6px] whitespace-nowrap outline-none"
            style={{
              border: `1px solid ${activeGrade === g ? '#2D8A4E' : '#E8E6DC'}`,
              backgroundColor: activeGrade === g ? '#2D8A4E' : '#FFFFFF',
              color: activeGrade === g ? '#FFFFFF' : '#2C2A28',
            }}
          >
            {g}
          </button>
        ))}

        {/* Subject label */}
        <span className="text-[12px] font-semibold text-[#8C8A82] ml-3 mr-1 whitespace-nowrap">
          Subject:
        </span>

        {/* Subject chips */}
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className="px-3 py-[5px] rounded-[20px] text-[12px] font-medium cursor-pointer mr-[6px] whitespace-nowrap outline-none"
            style={{
              border: `1px solid ${activeSubject === s ? '#2D8A4E' : '#E8E6DC'}`,
              backgroundColor: activeSubject === s ? '#2D8A4E' : '#FFFFFF',
              color: activeSubject === s ? '#FFFFFF' : '#2C2A28',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-10 py-6">
        {/* Section header */}
        <div className="text-[18px] font-bold text-[#141413] mb-1 flex items-center gap-[6px]">
          <Star size={18} className="text-brand-orange fill-brand-orange" /> Bestselling Resources
        </div>
        <p className="text-[13px] text-[#8C8A82] mb-5">
          Top-rated resources trusted by thousands of educators.
        </p>

        {/* 4-col grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          {PRODUCTS.map((p) => (
            <Card key={p.name} padding="none" hover onClick={() => navigate('/marketplace/1')}>
              {/* Image area */}
              <div className="h-[140px] bg-success-bg flex items-center justify-center rounded-t-[12px]">
                <p.Img size={56} className="text-success" />
              </div>
              {/* Content */}
              <div className="p-[14px]">
                {/* Grade + Subject badges */}
                <div className="flex gap-1 mb-[6px] flex-wrap">
                  <Badge color="green">{p.grade}</Badge>
                  <Badge color="blue">{p.subject}</Badge>
                </div>
                <div className="text-[13px] font-bold text-[#141413] mb-1 leading-[1.3]">
                  {p.name}
                </div>
                <div className="text-[11px] text-[#8C8A82] mb-2">
                  by {p.seller} • <Star size={11} className="inline align-middle text-brand-orange fill-brand-orange" /> {p.rating} • {p.sold} sold
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[15px] text-[#141413]">{p.price}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* AI Worksheet Builder CTA */}
        <div
          className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: 'linear-gradient(120deg, #FBECE4, #FFF)' }}
        >
          <Sparkles size={48} className="text-brand-orange flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[16px] font-bold text-[#141413] mb-1">
              AI Worksheet Builder — Try Free
            </div>
            <p className="text-[13px] text-[#8C8A82]">
              Generate custom worksheets, quizzes, and lesson activities in seconds with AI. Save hours of prep time.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => {}}>Try AI Builder <ArrowRight size={14} className="inline align-middle ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}
