import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PenLine, TrendingUp, BookOpen, Search, Mail, ImagePlus, Sparkles, Bot, FileText, CheckCircle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Divider';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

type AITool = 'listing' | 'pricing' | 'worksheet' | 'seo' | 'email' | 'images';

const TOOLS: { id: AITool; Icon: LucideIcon; title: string; desc: string }[] = [
  { id: 'listing',   Icon: PenLine,    title: 'Listing Writer',    desc: 'Generate compelling product titles and descriptions' },
  { id: 'pricing',   Icon: TrendingUp, title: 'Price Optimizer',   desc: 'Find the optimal price point for your product' },
  { id: 'worksheet', Icon: BookOpen,   title: 'Worksheet Builder', desc: 'Create educational worksheets and assessments' },
  { id: 'seo',       Icon: Search,     title: 'SEO Booster',       desc: 'Optimize your listings for search visibility' },
  { id: 'email',     Icon: Mail,       title: 'Email Campaigns',   desc: 'Write targeted marketing emails for your buyers' },
  { id: 'images',    Icon: ImagePlus,  title: 'Image Enhancer',    desc: 'Generate and enhance product cover images' },
];

export function SellerAIStudio() {
  usePageTitle('AI Studio');
  const [activeAI, setActiveAI] = useState<AITool>('listing');
  const [tone, setTone] = useState<'Professional' | 'Friendly' | 'Academic'>('Professional');
  const [generated, setGenerated] = useState(false);

  const activeTool = TOOLS.find(t => t.id === activeAI)!;

  return (
    <>
      <SellerPageHeader
        title="AI Studio"
        subtitle="AI-powered tools to grow your Solvexo business."
        actions={
          <>
            <Badge color="orange"><Sparkles size={12} className="inline mr-1" />750 credits remaining</Badge>
            <Button variant="secondary" size="sm">Buy Credits</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Credits banner */}
        <div
          className="rounded-xl p-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)' }}
        >
          <div>
            <p className="text-[20px] font-bold text-white mb-1 flex items-center gap-2"><Sparkles size={20} /> Solvexo AI Studio</p>
            <p className="text-[13px]" style={{ color: '#B0AEA8' }}>
              Use AI to write better listings, price smarter, build worksheets, and more.
            </p>
            <div className="mt-4" style={{ maxWidth: 280 }}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: '#B0AEA8' }}>Monthly usage</span>
                <span className="text-[11px] font-semibold" style={{ color: '#D97757' }}>750 / 1,000</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: '#2C2A28' }}>
                <div className="h-full rounded-full" style={{ width: '75%', background: '#D97757' }} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold" style={{ fontSize: 56, color: '#D97757', lineHeight: 1 }}>750</p>
            <p className="text-[13px] mt-1" style={{ color: '#B0AEA8' }}>AI credits left this month</p>
          </div>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-3 gap-3">
          {TOOLS.map(tool => {
            const active = activeAI === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveAI(tool.id); setGenerated(false); }}
                className="text-left p-4 rounded-xl border-2 transition-all cursor-pointer"
                style={{
                  borderColor: active ? '#D97757' : '#E8E6DC',
                  background: active ? '#FBECE4' : '#FFFFFF',
                }}
              >
                <div className="mb-2" style={{ color: active ? '#B95A3A' : '#8C8A82' }}>
                  <tool.Icon size={24} />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: active ? '#B95A3A' : '#141413' }}>
                  {tool.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: active ? '#B95A3A' : '#8C8A82' }}>
                  {tool.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Workspace */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* LEFT: Input panel */}
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4 flex items-center gap-2">
              <activeTool.Icon size={16} /> {activeTool.title} — Inputs
            </p>

            {activeAI === 'listing' && (
              <div className="flex flex-col gap-4">
                <Select label="Product Type">
                  <option>Educational Resource</option>
                  <option>Digital Download</option>
                  <option>Handmade Craft</option>
                  <option>Business Tool</option>
                </Select>
                <Textarea
                  label="Keywords (describe your product)"
                  placeholder="e.g. Grade 5 math fractions worksheets common core..."
                  rows={3}
                />
                <div>
                  <p className="text-[12px] font-medium text-charcoal mb-2">Tone</p>
                  <div className="flex gap-2">
                    {(['Professional', 'Friendly', 'Academic'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer"
                        style={{
                          borderColor: tone === t ? '#D97757' : '#E8E6DC',
                          background: tone === t ? '#FBECE4' : '#FFFFFF',
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
                <Select label="Product">
                  <option>Grade 5 Math Bundle</option>
                  <option>Fractions Mastery Kit</option>
                  <option>Science Lab Worksheets</option>
                </Select>
                <Input label="Current Price ($)" type="number" placeholder="0.00" defaultValue="39.99" />
                <div
                  className="rounded-lg p-3 text-[12px]"
                  style={{ background: '#FBECE4', color: '#B95A3A' }}
                >
                  <p className="font-semibold mb-1 flex items-center gap-1"><TrendingUp size={13} /> AI will analyze:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]" style={{ color: '#8C6050' }}>
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
                <Input label="Subject" placeholder="e.g. Fractions, Algebra, Grammar…" />
                <Select label="Grade Level">
                  <option>Grade 3</option>
                  <option>Grade 4</option>
                  <option>Grade 5</option>
                  <option>Grade 6</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                </Select>
                <Input label="Number of Questions" type="number" placeholder="10" />
                <div>
                  <p className="text-[12px] font-medium text-charcoal mb-2">Include</p>
                  <div className="flex flex-col gap-2">
                    {['Answer Key', 'Word Problems', 'Visual Diagrams', 'Common Core Standards'].map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-brand-orange" />
                        <span className="text-[12px] text-charcoal">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(activeAI === 'seo' || activeAI === 'email' || activeAI === 'images') && (
              <div className="flex flex-col gap-4">
                <Input label="Product or Store Name" placeholder="Enter product or store name…" />
                <Textarea
                  label="Additional Context"
                  placeholder="Describe what you need help with…"
                  rows={4}
                />
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              fullWidth
              className="mt-5"
              onClick={() => setGenerated(true)}
            >
              <Sparkles size={14} className="mr-1.5" />Generate with AI (5 credits)
            </Button>
          </Card>

          {/* RIGHT: Output panel */}
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4 flex items-center gap-2">
              <Sparkles size={16} /> AI Output
            </p>

            {!generated && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3" style={{ color: '#8C8A82' }}><Bot size={40} /></div>
                <p className="text-[14px] font-semibold text-carbon mb-1">Ready to generate</p>
                <p className="text-[12px] text-slate">
                  Fill in the inputs on the left and click<br />"Generate with AI" to see results here.
                </p>
              </div>
            )}

            {generated && activeAI === 'listing' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#4A4845', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Generated Title</p>
                  <div className="rounded-lg p-3 text-[13px] font-semibold text-carbon" style={{ background: '#FAF9F5', border: '1px solid #E8E6DC', borderRadius: 12 }}>
                    Grade 5 Math Mastery Bundle — Fractions, Decimals & Word Problems (Common Core Aligned)
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#4A4845', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Generated Description</p>
                  <div className="rounded-lg p-3 text-[12px] text-charcoal leading-relaxed" style={{ background: '#FAF9F5', border: '1px solid #E8E6DC', borderRadius: 12 }}>
                    Give your Grade 5 students the tools they need to master fractions, decimals, and word problems with this comprehensive, Common Core-aligned worksheet bundle. Designed by experienced educators, each worksheet includes clear instructions, worked examples, and progressive difficulty levels to build confidence and fluency.
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#4A4845', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Suggested Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['grade 5', 'math', 'fractions', 'decimals', 'common core', 'worksheets', 'elementary'].map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" size="sm">Use This</Button>
                  <Button variant="secondary" size="sm" onClick={() => setGenerated(false)}>Regenerate</Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            )}

            {generated && activeAI === 'pricing' && (
              <div className="flex flex-col gap-4">
                <div className="text-center py-3">
                  <div className="flex justify-center" style={{ color: '#D97757' }}><TrendingUp size={36} /></div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#4A4845', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>Optimal Price</p>
                  <p className="font-bold mt-1" style={{ fontSize: 40, color: '#D97757' }}>$49.00</p>
                  <p className="text-[12px] text-slate">Optimal range: $44 – $55</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Underpriced', price: '$39', color: '#1A72C2', bg: '#E6F1FB' },
                    { label: 'Optimal', price: '$49', color: '#2D8A4E', bg: '#EBF7EF' },
                    { label: 'Premium', price: '$59', color: '#D97757', bg: '#FBECE4' },
                  ].map(box => (
                    <div key={box.label} className="rounded-lg p-3 text-center" style={{ background: box.bg }}>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: box.color }}>{box.label}</p>
                      <p className="text-[18px] font-bold" style={{ color: box.color }}>{box.price}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#4A4845', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Market Insights</p>
                  <table className="w-full text-[12px]">
                    <tbody>
                      {[
                        ['Category avg price', '$42.00'],
                        ['Your conversion at $39', '3.2%'],
                        ['Estimated conversion at $49', '2.8%'],
                        ['Expected revenue uplift', '+$18/mo'],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-b border-bone">
                          <td className="py-1.5 text-slate">{label}</td>
                          <td className="py-1.5 font-semibold text-carbon text-right">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="primary" size="sm">Apply Price</Button>
              </div>
            )}

            {generated && activeAI === 'worksheet' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3" style={{ color: '#D97757' }}><FileText size={40} /></div>
                <p className="text-[14px] font-semibold text-carbon mb-1">Worksheet Generated!</p>
                <p className="text-[12px] text-slate mb-4">
                  Your Grade 5 Fractions worksheet with<br />10 questions is ready to download.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm">Download PDF</Button>
                  <Button variant="ghost" size="sm">Preview</Button>
                </div>
              </div>
            )}

            {generated && (activeAI === 'seo' || activeAI === 'email' || activeAI === 'images') && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3" style={{ color: '#2D8A4E' }}><CheckCircle size={40} /></div>
                <p className="text-[14px] font-semibold text-carbon mb-1">Content Generated</p>
                <p className="text-[12px] text-slate">Your AI-generated content is ready.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
