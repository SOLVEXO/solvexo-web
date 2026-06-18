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

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const radius = 32;
  const circ   = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;
  const stroke = score >= 80 ? '#2D8A4E' : score >= 60 ? '#C08B1E' : '#C13030';
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
      <circle cx="42" cy="42" r={radius} fill="none" stroke="#E8E6DC" strokeWidth="7" />
      <circle cx="42" cy="42" r={radius} fill="none" stroke={stroke} strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill="#141413">
        {score}
      </text>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreSEO() {
  usePageTitle('SEO');
  const [selectedId, setSelectedId] = useState('grade5');
  const selected = PRODUCTS.find(p => p.id === selectedId) ?? PRODUCTS[0];

  const scoreColor = selected.score >= 80 ? '#2D8A4E' : selected.score >= 60 ? '#C08B1E' : '#C13030';

  const inputCls = "w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border";
  const labelCls = "text-xs font-medium text-[#4A4945] mb-[5px] block";

  return (
    <>
      <SellerPageHeader
        title="SEO Manager"
        subtitle="Optimize your store and products for search engines."
        actions={
          <>
            <button className="px-[14px] py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer flex items-center gap-[5px]">
              <Sparkles size={12} /> AI SEO Audit
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
              Save All Changes
            </button>
          </>
        }
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-[#E8E6DC] rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">{m.value}</p>
              {m.trend && (
                <p className="text-xs mt-1" style={{ color: m.trendUp ? '#2D8A4E' : '#C08B1E' }}>
                  {m.trendUp ? '▲' : '▼'} {m.trend}
                </p>
              )}
              {m.sub && <p className="text-xs text-[#8C8A82] mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── 2-col layout ── */}
        <div className="flex gap-5 items-start">

          {/* LEFT */}
          <div className="w-[240px] shrink-0 flex flex-col gap-[14px]">

            {/* Product list */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-4 py-[11px] border-b border-[#F0EEE6]">
                <p className="text-[13px] font-semibold text-[#141413]">All Products</p>
              </div>
              {PRODUCTS.map((p, i) => {
                const sc = p.score >= 80 ? '#2D8A4E' : p.score >= 60 ? '#C08B1E' : '#C13030';
                const sb = p.score >= 80 ? '#E3F4EA' : p.score >= 60 ? '#FFF4DC' : '#FDECEA';
                const bc = p.score >= 80 ? '#2D8A4E' : p.score >= 60 ? '#C08B1E' : '#C13030';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="px-4 py-3 cursor-pointer transition-[background] duration-[120ms]"
                    style={{
                      background: selectedId === p.id ? '#FBECE4' : 'transparent',
                      borderBottom: i < PRODUCTS.length - 1 ? '1px solid #F0EEE6' : 'none',
                    }}
                    onMouseEnter={e => { if (selectedId !== p.id) e.currentTarget.style.background = '#FAF9F5'; }}
                    onMouseLeave={e => { if (selectedId !== p.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-[#141413] leading-[1.3]">{p.name}</span>
                      <span
                        className="text-[11px] font-semibold px-2 py-[2px] rounded-[5px] shrink-0 ml-2"
                        style={{ background: sb, color: sc }}
                      >
                        {p.score}/100
                      </span>
                    </div>
                    <div className="h-[5px] bg-[#E8E6DC] rounded-[3px] overflow-hidden">
                      <div className="h-full rounded-[3px]" style={{ width: `${p.score}%`, background: bc }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Store-level SEO */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[18px] py-4">
              <p className="text-[13px] font-semibold text-[#141413] mb-[14px]">Store-level SEO</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Store Meta Title</label>
                  <input defaultValue="My Solvexo Store — Education" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Meta Description</label>
                  <textarea rows={3} defaultValue="High-quality educational worksheets and resources for students and teachers."
                    className={`${inputCls} resize-y leading-[1.5]`} />
                </div>
                <button className="px-[14px] py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
                  Save Store SEO
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex-1 min-w-0 flex flex-col gap-[14px]">

            {/* Score + Tags */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-[18px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ScoreCircle score={selected.score} />
                  <div>
                    <p className="text-[15px] font-bold text-[#141413] mb-1">{selected.name}</p>
                    <p className="text-xs font-medium mb-[10px] flex items-center gap-1" style={{ color: scoreColor }}>
                      {selected.score >= 80
                        ? <><Check size={12} /> Excellent SEO</>
                        : selected.score >= 60
                        ? '~ Good SEO'
                        : <><X size={12} /> Needs Work</>
                      }
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Title', 'Description', 'Keywords', 'Images'].map(tag => (
                        <span key={tag} className="px-[9px] py-[2px] bg-[#F0EEE6] rounded-[5px] text-[11px] text-[#5A5852]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="px-3 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer flex items-center gap-[5px] shrink-0">
                  <Sparkles size={12} /> AI Optimize All
                </button>
              </div>
            </div>

            {/* Search Preview */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[13px] font-semibold text-[#141413] mb-3">Search Preview</p>
              <p className="text-[15px] font-medium text-[#1A72C2] cursor-pointer mb-[3px] leading-[1.4]">
                Grade 5 Math Bundle — Printable Worksheets for Grade 5
              </p>
              <p className="text-xs text-[#2D8A4E] mb-[5px]">
                https://myshop.solvexo.store/products/grade-5-math-bundle
              </p>
              <p className="text-xs text-[#8C8A82] leading-[1.6]">
                Comprehensive Grade 5 math worksheets covering fractions, decimals, geometry, and more. Printable PDF format. Aligned to curriculum standards.
              </p>
            </div>

            {/* SEO Fields */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-[18px]">
              <div className="flex flex-col gap-[14px]">
                {/* SEO Title */}
                <div>
                  <div className="flex justify-between items-center mb-[5px]">
                    <label className="text-xs font-medium text-[#4A4945]">SEO Title</label>
                    <span className="text-[11px] text-[#2D8A4E] font-medium flex items-center gap-[3px]">
                      <Check size={11} /> 58/60 chars
                    </span>
                  </div>
                  <input defaultValue="Grade 5 Math Bundle — Printable Worksheets for Grade 5" className={inputCls} />
                </div>
                {/* Meta Description */}
                <div>
                  <div className="flex justify-between items-center mb-[5px]">
                    <label className="text-xs font-medium text-[#4A4945]">Meta Description</label>
                    <span className="text-[11px] text-[#2D8A4E] font-medium flex items-center gap-[3px]">
                      <Check size={11} /> 148/160 chars
                    </span>
                  </div>
                  <textarea rows={3} defaultValue="Comprehensive Grade 5 math worksheets covering fractions, decimals, geometry, and more. Printable PDF format. Aligned to curriculum standards."
                    className={`${inputCls} resize-y leading-[1.5]`} />
                </div>
                {/* Focus Keywords */}
                <div>
                  <label className={labelCls}>Focus Keywords</label>
                  <input defaultValue="grade 5 math, printable worksheets, math bundle" placeholder="Comma-separated keywords" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Technical SEO Checklist */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[13px] font-semibold text-[#141413] mb-3">Technical SEO Checklist</p>
              <div className="flex flex-col gap-2">
                {SEO_CHECKS.map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <Check size={13} style={{ color: '#2D8A4E', flexShrink: 0 }} />
                    <span className="text-[13px] text-[#4A4945]">{item}</span>
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
