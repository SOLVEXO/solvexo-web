import { useState } from 'react';
import { Button }      from '@/components/ui/Button';
import { Card }        from '@/components/ui/Card';
import { MetricCard }  from '@/components/ui/MetricCard';
import { Badge }       from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Sparkles, Check, X } from 'lucide-react';

// ── Types & Data ──────────────────────────────────────────────────────────────
type Product = {
  id: string;
  name: string;
  score: number;
  scoreColor: 'green' | 'yellow' | 'red';
  barColor: string;
  barWidth: string;
};

const PRODUCTS: Product[] = [
  { id: 'grade5',     name: 'Grade 5 Math Bundle',      score: 88, scoreColor: 'green',  barColor: 'bg-success', barWidth: 'w-[88%]'  },
  { id: 'fractions',  name: 'Fractions Mastery Kit',    score: 62, scoreColor: 'yellow', barColor: 'bg-warning', barWidth: 'w-[62%]'  },
  { id: 'figma',      name: 'Brand Identity Figma Kit', score: 45, scoreColor: 'red',    barColor: 'bg-error',   barWidth: 'w-[45%]'  },
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

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const radius = 32;
  const circ   = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;

  const strokeColor = score >= 80 ? '#2D8A4E' : score >= 60 ? '#C08B1E' : '#C13030';

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="flex-shrink-0">
      <circle cx="42" cy="42" r={radius} fill="none" stroke="#E8E6DC" strokeWidth="7" />
      <circle
        cx="42" cy="42" r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="46" textAnchor="middle" className="text-[14px] font-bold" fontSize="14" fontWeight="700" fill="#141413">
        {score}
      </text>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerSEO() {
  const [selectedId, setSelectedId] = useState<string>('grade5');
  const selected = PRODUCTS.find(p => p.id === selectedId) ?? PRODUCTS[0];

  return (
    <>
      <SellerPageHeader
        title="SEO Manager"
        subtitle="Optimize your store and products for search engines."
        actions={
          <>
            <Button variant="secondary" size="sm"><Sparkles size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />AI SEO Audit</Button>
            <Button variant="primary"   size="sm">Save All Changes</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-5">

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Avg SEO Score"       value="65/100"  trend="3 products need work"            trendUp={false} />
          <MetricCard label="Organic Traffic"     value="1,284"   trend="+22% vs last month"              trendUp />
          <MetricCard label="Search Impressions"  value="48,200"  sub="Last 28 days" />
          <MetricCard label="Click-Through Rate"  value="3.8%"    trend="Avg is 2.1%"                     trendUp />
        </div>

        {/* 2-col layout */}
        <div className="flex gap-6 items-start">

            {/* LEFT — Product List */}
            <div className="w-[260px] flex-shrink-0 flex flex-col gap-4">
              <Card padding="none">
                <div className="px-4 py-3 border-b border-bone">
                  <p className="text-[13px] font-semibold text-carbon">All Products</p>
                </div>
                {PRODUCTS.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={[
                      'px-4 py-3.5 cursor-pointer transition-colors',
                      i < PRODUCTS.length - 1 ? 'border-b border-bone' : '',
                      selectedId === p.id ? 'bg-brand-pale-orange' : 'hover:bg-cream',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-charcoal leading-tight">{p.name}</span>
                      <Badge color={p.scoreColor}>{p.score}/100</Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-bone overflow-hidden">
                      <div className={`h-full rounded-full ${p.barColor} ${p.barWidth} transition-all`} />
                    </div>
                  </div>
                ))}
              </Card>

              {/* Store-level SEO */}
              <Card padding="none">
                <div className="p-4">
                  <p className="text-[13px] font-semibold text-carbon mb-3">Store-level SEO</p>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Store Meta Title"
                      defaultValue="My Solvexo Store — Education"
                    />
                    <div className="w-full">
                      <label className="block text-[12px] font-medium text-charcoal mb-1.5">
                        Meta Description
                      </label>
                      <textarea
                        rows={3}
                        defaultValue="High-quality educational worksheets and resources for students and teachers."
                        className="w-full font-sans text-[13px] text-charcoal placeholder:text-slate px-3 py-2.5 rounded-lg border border-bone bg-white outline-none transition-colors duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 resize-vertical"
                      />
                    </div>
                    <Button variant="secondary" size="sm">Save Store SEO</Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT — Product SEO Detail */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Score + Tags */}
              <Card padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ScoreCircle score={selected.score} />
                    <div>
                      <p className="text-[15px] font-bold text-carbon mb-0.5">{selected.name}</p>
                      <p className="text-[12px] text-success font-medium mb-2">
                        {selected.score >= 80 ? <><Check size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Excellent SEO</> : selected.score >= 60 ? '~ Good SEO' : <><X size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Needs Work</>}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Title', 'Description', 'Keywords', 'Images'].map(tag => (
                          <Badge key={tag} color="gray">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="flex-shrink-0"><Sparkles size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />AI Optimize All</Button>
                </div>
              </Card>

              {/* Search Preview */}
              <div className="p-4 border border-bone rounded-xl bg-white">
                <p className="text-[13px] font-semibold text-carbon mb-3">Search Preview</p>
                <p className="text-[15px] font-medium text-info hover:underline cursor-pointer leading-snug mb-0.5">
                  Grade 5 Math Bundle — Printable Worksheets for Grade 5
                </p>
                <p className="text-[12px] text-success mb-1">
                  https://myshop.solvexo.store/products/grade-5-math-bundle
                </p>
                <p className="text-[12px] text-slate leading-relaxed">
                  Comprehensive Grade 5 math worksheets covering fractions, decimals, geometry, and more.
                  Printable PDF format. Aligned to curriculum standards.
                </p>
              </div>

              {/* SEO Fields */}
              <Card padding="md">
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-medium text-charcoal">SEO Title</label>
                      <span className="text-[11px] text-success font-medium flex items-center gap-1"><Check size={11} />58/60 chars</span>
                    </div>
                    <input
                      defaultValue="Grade 5 Math Bundle — Printable Worksheets for Grade 5"
                      className="w-full font-sans text-[13px] text-charcoal placeholder:text-slate px-3 py-2.5 rounded-lg border border-bone bg-white outline-none transition-colors duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
                    />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-medium text-charcoal">Meta Description</label>
                      <span className="text-[11px] text-success font-medium flex items-center gap-1"><Check size={11} />148/160 chars</span>
                    </div>
                    <textarea
                      rows={3}
                      defaultValue="Comprehensive Grade 5 math worksheets covering fractions, decimals, geometry, and more. Printable PDF format. Aligned to curriculum standards."
                      className="w-full font-sans text-[13px] text-charcoal placeholder:text-slate px-3 py-2.5 rounded-lg border border-bone bg-white outline-none transition-colors duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 resize-vertical"
                    />
                  </div>
                  <Input
                    label="Focus Keywords"
                    defaultValue="grade 5 math, printable worksheets, math bundle"
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </Card>

              {/* Technical SEO Checklist */}
              <div className="p-4 border border-bone rounded-xl bg-white">
                <p className="text-[13px] font-semibold text-carbon mb-3">Technical SEO Checklist</p>
                <div className="flex flex-col gap-2">
                  {SEO_CHECKS.map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <Check size={13} className="text-success flex-shrink-0" />
                      <span className="text-[13px] text-charcoal">{item}</span>
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
