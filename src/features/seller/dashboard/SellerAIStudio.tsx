import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  PenLine, TrendingUp, BookOpen, Search, Mail, ImagePlus,
  Sparkles, Bot, FileText, CheckCircle, type LucideIcon,
} from 'lucide-react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Types & Data ──────────────────────────────────────────────────────────────
type AITool = 'listing' | 'pricing' | 'worksheet' | 'seo' | 'email' | 'images';

const TOOLS: { id: AITool; Icon: LucideIcon; title: string; desc: string }[] = [
  { id: 'listing',   Icon: PenLine,    title: 'Listing Writer',    desc: 'AI-generated product titles and descriptions'  },
  { id: 'pricing',   Icon: TrendingUp, title: 'Price Optimizer',   desc: 'Smart pricing based on market data'            },
  { id: 'worksheet', Icon: BookOpen,   title: 'Worksheet Builder', desc: 'Generate educational worksheets instantly'     },
  { id: 'seo',       Icon: Search,     title: 'SEO Booster',       desc: 'Optimize tags, titles & search ranking'        },
  { id: 'email',     Icon: Mail,       title: 'Email Campaigns',   desc: 'Write buyer emails and newsletters'            },
  { id: 'images',    Icon: ImagePlus,  title: 'Image Enhancer',    desc: 'Improve product photo quality with AI'         },
];

// shared input / label class strings
const inputCls = 'w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border';
const labelCls = 'text-xs font-medium text-[#4A4945] mb-[6px] block';

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerAIStudio() {
  usePageTitle('AI Studio');
  const [activeAI,  setActiveAI]  = useState<AITool>('listing');
  const [tone,      setTone]      = useState<'Professional' | 'Friendly' | 'Academic'>('Professional');
  const [generated, setGenerated] = useState(true); // default show output like screenshot
  const activeTool = TOOLS.find(t => t.id === activeAI)!;

  return (
    <>
      <SellerPageHeader
        title="AI Studio"
        subtitle="AI-powered tools to grow your Solvexo business."
        actions={
          <>
            <span className="inline-flex items-center gap-[5px] px-3 py-[5px] bg-brand-pale-orange rounded-md text-xs font-semibold text-[#C96847]">
              <Sparkles size={12} /> 750 credits remaining
            </span>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Buy Credits
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Credits banner ── */}
        <div
          className="rounded-xl px-7 py-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)' }}
        >
          <div>
            <p className="text-xl font-bold text-white mb-[6px] flex items-center gap-2">
              <Sparkles size={20} /> Solvexo AI Studio
            </p>
            <p className="text-[13px] text-[#B0AEA8]">
              Your intelligent co-pilot for listings, pricing, content &amp; education.
            </p>
            <div className="mt-4 max-w-[280px]">
              <div className="flex justify-between mb-[6px]">
                <span className="text-[11px] text-[#B0AEA8]">Monthly usage</span>
                <span className="text-[11px] font-semibold text-brand-orange">750 / 1,000</span>
              </div>
              <div className="h-[6px] rounded-[3px] bg-[#3A3836]">
                <div className="h-full rounded-[3px] w-[75%] bg-brand-orange" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[56px] font-bold text-brand-orange leading-none">750</p>
            <p className="text-[13px] text-[#B0AEA8] mt-1">AI credits left this month</p>
          </div>
        </div>

        {/* ── Tool selector (2 rows × 3 cols) ── */}
        <div className="grid grid-cols-3 gap-3">
          {TOOLS.map(tool => {
            const active = activeAI === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveAI(tool.id); setGenerated(false); }}
                className="text-left px-5 py-[18px] rounded-[10px] cursor-pointer transition-[border-color,background] duration-150"
                style={{
                  border: `2px solid ${active ? '#D97757' : '#E8E6DC'}`,
                  background: active ? '#FBECE4' : '#fff',
                }}
              >
                <div className="mb-[10px]" style={{ color: active ? '#B95A3A' : '#8C8A82' }}>
                  <tool.Icon size={24} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: active ? '#B95A3A' : '#141413' }}>
                  {tool.title}
                </p>
                <p className="text-xs" style={{ color: active ? '#B95A3A' : '#8C8A82' }}>
                  {tool.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Workspace: Input + Output ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* LEFT: Input panel */}
          <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-sm font-bold text-charcoal mb-5 flex items-center gap-2">
              <activeTool.Icon size={15} /> {activeTool.title} — Input
            </p>

            {activeAI === 'listing' && (
              <div className="flex flex-col gap-4">
                {/* Product Type */}
                <div>
                  <label className={labelCls}>Product Type</label>
                  <select className={`${inputCls} cursor-pointer`}>
                    <option>Educational Resource</option>
                    <option>Digital Download</option>
                    <option>Handmade Craft</option>
                    <option>Business Tool</option>
                  </select>
                </div>

                {/* Keywords */}
                <div>
                  <label className={labelCls}>Product Keywords / Topic</label>
                  <textarea
                    rows={4}
                    defaultValue="Grade 5 math, fractions, decimals, full year curriculum, common core, printable worksheets"
                    className={`${inputCls} resize-y leading-[1.5]`}
                  />
                </div>

                {/* Tone */}
                <div>
                  <label className={labelCls}>Tone</label>
                  <div className="flex gap-2">
                    {(['Professional', 'Friendly', 'Academic'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-[0.12s]"
                        style={{
                          border: `1px solid ${tone === t ? '#D97757' : '#E8E6DC'}`,
                          background: tone === t ? '#FBECE4' : '#fff',
                          color: tone === t ? '#B95A3A' : '#8C8A82',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeAI === 'pricing' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Product</label>
                  <select className={`${inputCls} cursor-pointer`}>
                    <option>Grade 5 Math Bundle</option>
                    <option>Fractions Mastery Kit</option>
                    <option>Science Lab Worksheets</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Current Price ($)</label>
                  <input type="number" defaultValue="39.99" className={inputCls} />
                </div>
                <div className="bg-brand-pale-orange rounded-lg p-3 text-xs text-[#B95A3A]">
                  <p className="font-semibold mb-[6px] flex items-center gap-1"><TrendingUp size={13} /> AI will analyze:</p>
                  <ul className="pl-4 text-[#8C6050] text-[11px] leading-loose list-disc">
                    <li>Competitor pricing in your category</li>
                    <li>Your historical sales conversion</li>
                    <li>Demand trends and seasonality</li>
                    <li>Buyer segment willingness to pay</li>
                  </ul>
                </div>
              </div>
            )}

            {activeAI === 'worksheet' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Subject</label>
                  <input placeholder="e.g. Fractions, Algebra, Grammar…" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Grade Level</label>
                  <select className={`${inputCls} cursor-pointer`}>
                    {['Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Number of Questions</label>
                  <input type="number" placeholder="10" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Include</label>
                  {['Answer Key','Word Problems','Visual Diagrams','Common Core Standards'].map(item => (
                    <label key={item} className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input type="checkbox" defaultChecked style={{ accentColor: '#D97757' }} />
                      <span className="text-xs text-[#4A4945]">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(activeAI === 'seo' || activeAI === 'email' || activeAI === 'images') && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Product or Store Name</label>
                  <input placeholder="Enter product or store name…" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Additional Context</label>
                  <textarea rows={4} placeholder="Describe what you need help with…" className={`${inputCls} resize-y`} />
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={() => setGenerated(true)}
              className="w-full mt-5 py-[13px] bg-brand-orange border-0 rounded-lg text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-[6px]"
            >
              <Sparkles size={14} /> Generate with AI (5 credits)
            </button>
          </div>

          {/* RIGHT: Output panel */}
          <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-sm font-bold text-charcoal mb-5 flex items-center gap-2">
              <Sparkles size={15} /> AI Output — Preview
            </p>

            {/* Empty state */}
            {!generated && (
              <div className="flex flex-col items-center justify-center py-[60px] text-center">
                <Bot size={40} className="text-slate mb-3" />
                <p className="text-sm font-semibold text-charcoal mb-[6px]">Ready to generate</p>
                <p className="text-xs text-slate leading-[1.6]">
                  Fill in the inputs on the left and click<br />"Generate with AI" to see results here.
                </p>
              </div>
            )}

            {/* Listing output */}
            {generated && activeAI === 'listing' && (
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div>
                  <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-2">Generated Title</p>
                  <div className="bg-[#FAF9F5] border border-bone rounded-lg px-[14px] py-3 text-[13px] font-semibold text-charcoal leading-[1.5]">
                    Grade 5 Math Mastery Bundle — Complete Full-Year Curriculum with Worksheets, Assessments &amp; Answer Keys | Common Core Aligned
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-2">Generated Description</p>
                  <div className="bg-[#FAF9F5] border border-bone rounded-lg px-[14px] py-3 text-xs text-[#4A4945] leading-[1.7]">
                    Transform your Grade 5 classroom with this comprehensive, ready-to-use math curriculum designed to take students from foundational concepts to grade-level mastery. This all-in-one bundle covers <strong>36 weeks</strong> of instruction across fractions, decimals, geometry, measurement, and data analysis...
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-2">Suggested Tags</p>
                  <div className="flex flex-wrap gap-[6px]">
                    {['grade 5 math','common core','full year curriculum','fractions worksheets','math assessment','5th grade','printable','differentiated'].map(tag => (
                      <span key={tag} className="px-[10px] py-[3px] bg-[#F0EEE6] rounded-[5px] text-[11px] text-[#5A5852]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-[10px] bg-brand-orange border-0 rounded-lg text-[13px] font-semibold text-white cursor-pointer">
                    Use This
                  </button>
                  <button onClick={() => setGenerated(false)} className="px-[18px] py-[10px] bg-white border border-bone rounded-lg text-xs text-[#4A4945] cursor-pointer">
                    Regenerate
                  </button>
                  <button className="px-[18px] py-[10px] bg-white border border-bone rounded-lg text-xs text-[#4A4945] cursor-pointer">
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* Pricing output */}
            {generated && activeAI === 'pricing' && (
              <div className="flex flex-col gap-4">
                <div className="text-center py-3">
                  <TrendingUp size={36} className="text-brand-orange mx-auto mb-2" />
                  <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-1">Optimal Price</p>
                  <p className="text-[40px] font-bold text-brand-orange leading-none">$49.00</p>
                  <p className="text-xs text-slate mt-1">Optimal range: $44 – $55</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Underpriced', price: '$39', color: '#1A72C2', bg: '#E6F1FB' },
                    { label: 'Optimal',     price: '$49', color: '#2D8A4E', bg: '#EBF7EF' },
                    { label: 'Premium',     price: '$59', color: '#D97757', bg: '#FBECE4' },
                  ].map(box => (
                    <div key={box.label} className="rounded-lg py-[10px] text-center" style={{ background: box.bg }}>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: box.color }}>{box.label}</p>
                      <p className="text-lg font-bold" style={{ color: box.color }}>{box.price}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-2">Market Insights</p>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      {[['Category avg price','$42.00'],['Your conversion at $39','3.2%'],['Estimated conversion at $49','2.8%'],['Expected revenue uplift','+$18/mo']].map(([label, value]) => (
                        <tr key={label} className="border-b border-[#F0EEE6]">
                          <td className="py-[7px] text-slate">{label}</td>
                          <td className="py-[7px] font-semibold text-charcoal text-right">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="py-[10px] bg-brand-orange border-0 rounded-lg text-[13px] font-semibold text-white cursor-pointer">
                  Apply Price
                </button>
              </div>
            )}

            {/* Worksheet output */}
            {generated && activeAI === 'worksheet' && (
              <div className="flex flex-col items-center justify-center py-[60px] text-center">
                <FileText size={40} className="text-brand-orange mb-3" />
                <p className="text-sm font-semibold text-charcoal mb-[6px]">Worksheet Generated!</p>
                <p className="text-xs text-slate leading-[1.6] mb-4">
                  Your Grade 5 Fractions worksheet with<br />10 questions is ready to download.
                </p>
                <div className="flex gap-2">
                  <button className="px-[18px] py-[9px] bg-brand-orange border-0 rounded-lg text-xs font-semibold text-white cursor-pointer">Download PDF</button>
                  <button className="px-[18px] py-[9px] bg-white border border-bone rounded-lg text-xs text-[#4A4945] cursor-pointer">Preview</button>
                </div>
              </div>
            )}

            {/* Generic output */}
            {generated && (activeAI === 'seo' || activeAI === 'email' || activeAI === 'images') && (
              <div className="flex flex-col items-center justify-center py-[60px] text-center">
                <CheckCircle size={40} className="text-[#2D8A4E] mb-3" />
                <p className="text-sm font-semibold text-charcoal mb-[6px]">Content Generated</p>
                <p className="text-xs text-slate">Your AI-generated content is ready.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
