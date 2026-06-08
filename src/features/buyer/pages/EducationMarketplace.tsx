import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ArrowRight, ShoppingCart, GraduationCap, Star, Sparkles, BookOpen, BookMarked, Microscope, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
};

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
    <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        gap: 16, paddingLeft: 40, paddingRight: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
          <span style={{ color: C.bone, marginLeft: 4, marginRight: 4 }}>|</span>
          <span style={{ fontSize: 13, color: C.slate }}>Education Marketplace</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input
            placeholder="Search marketplace..."
            style={{
              width: '100%', maxWidth: 440,
              padding: '8px 14px', borderRadius: 8,
              border: `1px solid ${C.bone}`, backgroundColor: C.cream,
              fontSize: 13, color: C.charcoal, outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>Sell on Solvexo</Button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: C.orange,
            fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingCart size={16} style={{ color: '#fff' }} />
          </div>
        </div>
      </nav>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(120deg, #1A4A2C, #2D7A4E)',
        padding: '36px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
          }}>
            EDUCATION MARKETPLACE
          </div>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700,
            color: C.white, marginBottom: 10, lineHeight: 1.25,
          }}>
            Resources Built by Educators,<br />for Educators
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.6 }}>
            Discover curriculum, lesson plans, worksheets, and more from verified teachers.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              backgroundColor: 'transparent', color: C.white,
              border: `1px solid ${C.white}`, cursor: 'pointer',
            }}>
              Browse All Resources
            </button>
            <Button variant="primary" size="md" onClick={() => navigate('/onboarding')}>Sell Your Resources</Button>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)' }}><GraduationCap size={80} /></div>
      </div>

      {/* Grade level + subject filter bar */}
      <div style={{
        padding: '16px 40px',
        backgroundColor: '#F0F9F4',
        borderBottom: `1px solid ${C.bone}`,
        display: 'flex', alignItems: 'center', gap: 0,
        overflowX: 'auto',
      }}>
        {/* Grade Level label */}
        <span style={{
          fontSize: 12, fontWeight: 600, color: C.slate,
          marginRight: 4, whiteSpace: 'nowrap',
        }}>
          Grade Level:
        </span>

        {/* Grade chips */}
        {GRADE_LEVELS.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGrade(g)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', marginRight: 6, whiteSpace: 'nowrap',
              border: `1px solid ${activeGrade === g ? C.success : C.bone}`,
              backgroundColor: activeGrade === g ? C.success : C.white,
              color: activeGrade === g ? C.white : C.charcoal,
              outline: 'none',
            }}
          >
            {g}
          </button>
        ))}

        {/* Subject label */}
        <span style={{
          fontSize: 12, fontWeight: 600, color: C.slate,
          marginLeft: 12, marginRight: 4, whiteSpace: 'nowrap',
        }}>
          Subject:
        </span>

        {/* Subject chips */}
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', marginRight: 6, whiteSpace: 'nowrap',
              border: `1px solid ${activeSubject === s ? C.success : C.bone}`,
              backgroundColor: activeSubject === s ? C.success : C.white,
              color: activeSubject === s ? C.white : C.charcoal,
              outline: 'none',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 40px' }}>
        {/* Section header */}
        <div style={{ fontSize: 18, fontWeight: 700, color: C.carbon, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={18} style={{ color: '#D97757', fill: '#D97757' }} /> Bestselling Resources
        </div>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 20 }}>
          Top-rated resources trusted by thousands of educators.
        </p>

        {/* 4-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {PRODUCTS.map((p) => (
            <Card key={p.name} padding="none" hover onClick={() => navigate('/marketplace/1')}>
              {/* Image area */}
              <div style={{
                height: 140, backgroundColor: C.successBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '12px 12px 0 0',
              }}>
                <p.Img size={56} style={{ color: '#2D8A4E' }} />
              </div>
              {/* Content */}
              <div style={{ padding: 14 }}>
                {/* Grade + Subject badges */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                  <Badge color="green">{p.grade}</Badge>
                  <Badge color="blue">{p.subject}</Badge>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: C.carbon,
                  marginBottom: 4, lineHeight: 1.3,
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: C.slate, marginBottom: 8 }}>
                  by {p.seller} • <Star size={11} style={{ display: 'inline', verticalAlign: 'middle', color: '#D97757', fill: '#D97757' }} /> {p.rating} • {p.sold} sold
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>{p.price}</span>
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
        <div style={{
          background: 'linear-gradient(120deg, #FBECE4, #FFF)',
          borderRadius: 16, padding: 20,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <Sparkles size={48} style={{ color: '#D97757', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.carbon, marginBottom: 4 }}>
              AI Worksheet Builder — Try Free
            </div>
            <p style={{ fontSize: 13, color: C.slate }}>
              Generate custom worksheets, quizzes, and lesson activities in seconds with AI. Save hours of prep time.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => {}}>Try AI Builder <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></Button>
        </div>
      </div>
    </div>
  );
}
