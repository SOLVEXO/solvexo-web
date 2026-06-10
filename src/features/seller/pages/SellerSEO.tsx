import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Sparkles, Check, X } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
type Product = { id: string; name: string; score: number };

const PRODUCTS: Product[] = [
  { id: 'grade5',    name: 'Grade 5 Math Bundle',      score: 88 },
  { id: 'fractions', name: 'Fractions Mastery Kit',    score: 62 },
  { id: 'figma',     name: 'Brand Identity Figma Kit', score: 45 },
];

const SEO_CHECKS = [
  'Product has images with alt text',
  'URL slug is keyword-friendly',
  'Structured data / schema markup enabled',
  'Product linked from other pages',
  'Page load speed: Fast',
  'Mobile preview looks correct',
  'Canonical URL configured',
];

const metrics = [
  { label: 'Avg SEO Score',      value: '65/100', trend: '3 products need work', sub: null,           trendUp: false },
  { label: 'Organic Traffic',    value: '1,284',  trend: '+22% vs last month',   sub: null,           trendUp: true  },
  { label: 'Search Impressions', value: '48,200', trend: null,                   sub: 'Last 28 days', trendUp: false },
  { label: 'Click-Through Rate', value: '3.8%',   trend: 'Avg is 2.1%',          sub: null,           trendUp: true  },
] as const;

const poppins = "'Poppins', sans-serif";

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E8E6DC',
  borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  border: '1px solid #E8E6DC', borderRadius: 8,
  outline: 'none', fontFamily: poppins, color: '#2C2A28',
  background: '#fff', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#4A4945',
  marginBottom: 5, display: 'block', fontFamily: poppins,
};

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const radius = 32;
  const circ   = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;
  const stroke = score >= 80 ? '#2D8A4E' : score >= 60 ? '#C08B1E' : '#C13030';
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
      <circle cx="42" cy="42" r={radius} fill="none" stroke="#E8E6DC" strokeWidth="7" />
      <circle cx="42" cy="42" r={radius} fill="none" stroke={stroke} strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill="#141413" fontFamily={poppins}>
        {score}
      </text>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerSEO() {
  usePageTitle('SEO');
  const [selectedId, setSelectedId] = useState('grade5');
  const selected = PRODUCTS.find(p => p.id === selectedId) ?? PRODUCTS[0];

  const scoreColor = selected.score >= 80 ? '#2D8A4E' : selected.score >= 60 ? '#C08B1E' : '#C13030';

  return (
    <>
      <SellerPageHeader
        title="SEO Manager"
        subtitle="Optimize your store and products for search engines."
        actions={
          <>
            <button style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={12} /> AI SEO Audit
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              Save All Changes
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
              {m.trend && (
                <p style={{ fontSize: 12, color: m.trendUp ? '#2D8A4E' : '#C08B1E', marginTop: 4 }}>
                  {m.trendUp ? '▲' : '▼'} {m.trend}
                </p>
              )}
              {m.sub && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── 2-col layout ── */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT */}
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Product list */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F0EEE6' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#141413' }}>All Products</p>
              </div>
              {PRODUCTS.map((p, i) => {
                const sc = p.score >= 80 ? '#2D8A4E' : p.score >= 60 ? '#C08B1E' : '#C13030';
                const sb = p.score >= 80 ? '#E3F4EA' : p.score >= 60 ? '#FFF4DC' : '#FDECEA';
                const bc = p.score >= 80 ? '#2D8A4E' : p.score >= 60 ? '#C08B1E' : '#C13030';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
                      background: selectedId === p.id ? '#FBECE4' : 'transparent',
                      borderBottom: i < PRODUCTS.length - 1 ? '1px solid #F0EEE6' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (selectedId !== p.id) e.currentTarget.style.background = '#FAF9F5'; }}
                    onMouseLeave={e => { if (selectedId !== p.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#141413', lineHeight: 1.3 }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: sb, color: sc, flexShrink: 0, marginLeft: 8 }}>
                        {p.score}/100
                      </span>
                    </div>
                    <div style={{ height: 5, background: '#E8E6DC', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${p.score}%`, height: '100%', background: bc, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Store-level SEO */}
            <div style={{ ...cardStyle, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 14 }}>Store-level SEO</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Store Meta Title</label>
                  <input defaultValue="My Solvexo Store — Education" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Meta Description</label>
                  <textarea rows={3} defaultValue="High-quality educational worksheets and resources for students and teachers."
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                </div>
                <button style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                  Save Store SEO
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Score + Tags */}
            <div style={{ ...cardStyle, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <ScoreCircle score={selected.score} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 4 }}>{selected.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: scoreColor, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {selected.score >= 80
                        ? <><Check size={12} /> Excellent SEO</>
                        : selected.score >= 60
                        ? '~ Good SEO'
                        : <><X size={12} /> Needs Work</>
                      }
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Title', 'Description', 'Keywords', 'Images'].map(tag => (
                        <span key={tag} style={{ padding: '2px 9px', background: '#F0EEE6', borderRadius: 5, fontSize: 11, color: '#5A5852', fontFamily: poppins }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button style={{ padding: '7px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <Sparkles size={12} /> AI Optimize All
                </button>
              </div>
            </div>

            {/* Search Preview */}
            <div style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 12 }}>Search Preview</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#1A72C2', cursor: 'pointer', marginBottom: 3, lineHeight: 1.4 }}>
                Grade 5 Math Bundle — Printable Worksheets for Grade 5
              </p>
              <p style={{ fontSize: 12, color: '#2D8A4E', marginBottom: 5 }}>
                https://myshop.solvexo.store/products/grade-5-math-bundle
              </p>
              <p style={{ fontSize: 12, color: '#8C8A82', lineHeight: 1.6 }}>
                Comprehensive Grade 5 math worksheets covering fractions, decimals, geometry, and more. Printable PDF format. Aligned to curriculum standards.
              </p>
            </div>

            {/* SEO Fields */}
            <div style={{ ...cardStyle, padding: '18px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* SEO Title */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>SEO Title</label>
                    <span style={{ fontSize: 11, color: '#2D8A4E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={11} /> 58/60 chars
                    </span>
                  </div>
                  <input defaultValue="Grade 5 Math Bundle — Printable Worksheets for Grade 5" style={inputStyle} />
                </div>
                {/* Meta Description */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Meta Description</label>
                    <span style={{ fontSize: 11, color: '#2D8A4E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={11} /> 148/160 chars
                    </span>
                  </div>
                  <textarea rows={3} defaultValue="Comprehensive Grade 5 math worksheets covering fractions, decimals, geometry, and more. Printable PDF format. Aligned to curriculum standards."
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                </div>
                {/* Focus Keywords */}
                <div>
                  <label style={labelStyle}>Focus Keywords</label>
                  <input defaultValue="grade 5 math, printable worksheets, math bundle" placeholder="Comma-separated keywords" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Technical SEO Checklist */}
            <div style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 12 }}>Technical SEO Checklist</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SEO_CHECKS.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={13} style={{ color: '#2D8A4E', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#4A4945', fontFamily: poppins }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}