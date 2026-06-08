import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowRight, ArrowLeft, Package, Download, ClipboardList, CheckCircle, Search, ShoppingCart, BookOpen, FileText, BarChart2, Pencil, Star, Link2, Mail, Smartphone } from 'lucide-react';
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

const TAGS = ['Common Core', 'Grade 5', 'Full Year', 'Printable', 'Digital', 'Differentiated'];

const REVIEWS = [
  { name: 'Sarah M.', rating: 5, text: "Best purchase I've made for my classroom. Everything is ready to print and use!", date: 'May 2025' },
  { name: 'David R.', rating: 5, text: 'Incredible value. My students improved significantly after using this curriculum.', date: 'Apr 2025' },
  { name: 'Lisa T.', rating: 4, text: 'Very thorough. A few of the assessments needed minor tweaks for my district.', date: 'Mar 2025' },
];

const INFO_ROWS: { Icon: LucideIcon; label: string; value: string }[] = [
  { Icon: Package,       label: "What's included", value: '36 weeks of lessons, 200+ worksheets, assessments, answer keys' },
  { Icon: Download,      label: 'Delivery',         value: 'Instant download after purchase' },
  { Icon: ClipboardList, label: 'License',           value: 'Single classroom use' },
  { Icon: CheckCircle,   label: 'Format',            value: 'PDF, editable Google Slides' },
];

export function ProductDetail() {
  const navigate = useNavigate();
  usePageTitle('Product Detail');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        paddingLeft: 40, paddingRight: 40,
      }}>
        {/* Left: logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
        </div>

        {/* Center: Search bar */}
        <div style={{ width: 440, position: 'relative', flexShrink: 0 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: C.slate, pointerEvents: 'none', display: 'flex',
          }}><Search size={14} /></span>
          <input
            placeholder="Search..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14,
              paddingTop: 9, paddingBottom: 9,
              borderRadius: 20, border: `1px solid ${C.bone}`,
              backgroundColor: C.cream, fontSize: 13, color: C.charcoal,
              outline: 'none', fontFamily: "'Poppins', sans-serif",
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Right: nav actions */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
            <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Marketplace
          </Button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: C.orange, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <ShoppingCart size={16} style={{ color: '#fff' }} />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ padding: '28px 40px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
          <span style={{ color: C.slate, cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>Marketplace</span>
          <span style={{ color: C.slate }}>/</span>
          <span style={{ color: C.slate, cursor: 'pointer' }}>Education</span>
          <span style={{ color: C.slate }}>/</span>
          <span style={{ color: C.slate, cursor: 'pointer' }}>Math</span>
          <span style={{ color: C.slate }}>/</span>
          <span style={{ color: C.charcoal, fontWeight: 700 }}>Grade 5 Math Bundle</span>
        </div>

        {/* 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 36, alignItems: 'start', minWidth: 0 }}>
          {/* LEFT */}
          <div style={{ minWidth: 0 }}>
            {/* Main image */}
            <div style={{
              height: 340, borderRadius: 16,
              background: 'linear-gradient(135deg, #FBECE4, #FFF5EE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <BookOpen size={100} style={{ color: '#D97757' }} />
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {([BookOpen, FileText, BarChart2, Pencil] as LucideIcon[]).map((Icon, i) => (
                <div key={i} style={{
                  width: 70, height: 70, borderRadius: 10,
                  backgroundColor: C.paleOrange,
                  border: `2px solid ${i === 0 ? C.orange : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Icon size={28} style={{ color: '#D97757' }} />
                </div>
              ))}
            </div>

            {/* About This Resource */}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.carbon, marginBottom: 12 }}>About This Resource</h2>
            <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.8, marginBottom: 16 }}>
              This comprehensive Grade 5 Math Bundle covers a complete full-year curriculum aligned with Common Core
              standards. It includes 36 weeks of structured lessons, 200+ ready-to-print worksheets, unit assessments,
              and full answer keys — everything a teacher needs from September through June.
            </p>
            <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.8, marginBottom: 16 }}>
              Each unit builds progressively on prior knowledge, covering fractions, decimals, geometry, data
              analysis, and algebraic thinking. All materials are fully editable in Google Slides so you can
              customize them for your classroom.
            </p>

            {/* Tags — exact reference: paleOrange bg, deepOrange text, bone border */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: C.paleOrange, color: C.deepOrange,
                    fontSize: 11, fontWeight: 500, padding: '3px 8px',
                    borderRadius: 6, border: `1px solid ${C.bone}`,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: C.bone, margin: '16px 0' }} />

            {/* About the Seller */}
            <div style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 14 }}>About the Seller</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                backgroundColor: C.successBg, color: C.success,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0,
                fontFamily: "'Poppins', sans-serif",
              }}>
                TP
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 4 }}>TeachersPro</div>
                <div style={{ fontSize: 12, color: C.slate, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Star size={12} style={{ color: '#D97757', fill: '#D97757' }} /> 5.0 • 2,140 sales • Member since 2021
                </div>
                <p style={{ fontSize: 12, color: C.slate, lineHeight: 1.6, marginBottom: 10 }}>
                  TeachersPro is a team of certified educators creating premium K–12 learning resources.
                  All materials are classroom-tested and fully standards-aligned.
                </p>
                <Button variant="ghost" size="sm" onClick={() => navigate('/seller/teacherspro')}>View Store <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></Button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: C.bone, margin: '16px 0' }} />

            {/* Reviews */}
            <div style={{ fontSize: 15, fontWeight: 700, color: C.carbon, marginBottom: 16 }}>Reviews (847)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {REVIEWS.map((r, i) => (
                <div
                  key={r.name}
                  style={{
                    paddingBottom: 16, marginBottom: 16,
                    borderBottom: i < REVIEWS.length - 1 ? `1px solid ${C.bone}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Avatar name={r.name} size={28} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: C.carbon }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: C.orange }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <span style={{ fontSize: 11, color: C.slate }}>{r.date}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.charcoal, lineHeight: 1.6, paddingLeft: 38 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: sticky card */}
          <div style={{ position: 'sticky', top: 80, minWidth: 0 }}>
            <Card padding="none">
              <div style={{ padding: '24px 24px 0' }}>
                <Badge color="green">Education</Badge>
                <h1 style={{
                  fontFamily: "'Lora', Georgia, serif", fontSize: 21, fontWeight: 700,
                  color: C.carbon, marginTop: 12, marginBottom: 6, lineHeight: 1.35,
                  wordBreak: 'break-word', overflowWrap: 'break-word',
                }}>
                  Grade 5 Math Bundle – Full Year
                </h1>
                <p style={{ fontSize: 12, color: C.slate, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  by TeachersPro
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    • <Star size={11} style={{ color: '#D97757', fill: '#D97757' }} /> 5.0 (847 reviews)
                  </span>
                </p>

                {/* Price */}
                <div style={{ fontSize: 32, fontWeight: 800, color: C.carbon, marginBottom: 4, letterSpacing: '-0.5px' }}>$49.00</div>
                <div style={{ fontSize: 12, color: C.success, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={13} /> Instant digital download
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  <Button variant="primary" size="lg" fullWidth style={{ justifyContent: 'center' }}>
                    Buy Now <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }} /> $49.00
                  </Button>
                  <Button variant="secondary" size="md" fullWidth style={{ justifyContent: 'center' }}>
                    Add to Cart
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: C.bone }} />

              {/* Info rows */}
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {INFO_ROWS.map((row) => (
                  <div key={row.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: C.paleOrange, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <row.Icon size={15} style={{ color: '#D97757' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: C.charcoal, marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 11, color: C.slate, overflowWrap: 'break-word', lineHeight: 1.55 }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: C.bone }} />

              {/* Share */}
              <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: C.slate, flex: 1 }}>Share this listing</span>
                {([Link2, Mail, Smartphone] as LucideIcon[]).map((Icon, i) => (
                  <button key={i} style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: C.cream, border: `1px solid ${C.bone}`,
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: C.slate,
                  }}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
