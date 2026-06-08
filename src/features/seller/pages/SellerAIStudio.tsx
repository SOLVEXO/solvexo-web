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

const poppins = "'Poppins', sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid #E8E6DC', borderRadius: 8,
  outline: 'none', fontFamily: poppins, color: '#2C2A28',
  background: '#fff', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#4A4945',
  marginBottom: 6, display: 'block', fontFamily: poppins,
};

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
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', background: '#FBECE4', borderRadius: 6,
              fontSize: 12, fontWeight: 600, color: '#C96847', fontFamily: poppins,
            }}>
              <Sparkles size={12} /> 750 credits remaining
            </span>
            <button style={{
              padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC',
              borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945',
              cursor: 'pointer', fontFamily: poppins,
            }}>
              Buy Credits
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Credits banner ── */}
        <div style={{
          borderRadius: 12, padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)',
        }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} /> Solvexo AI Studio
            </p>
            <p style={{ fontSize: 13, color: '#B0AEA8' }}>
              Your intelligent co-pilot for listings, pricing, content &amp; education.
            </p>
            <div style={{ marginTop: 16, maxWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#B0AEA8' }}>Monthly usage</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#D97757' }}>750 / 1,000</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#3A3836' }}>
                <div style={{ height: '100%', borderRadius: 3, width: '75%', background: '#D97757' }} />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 56, fontWeight: 700, color: '#D97757', lineHeight: 1 }}>750</p>
            <p style={{ fontSize: 13, color: '#B0AEA8', marginTop: 4 }}>AI credits left this month</p>
          </div>
        </div>

        {/* ── Tool selector (2 rows × 3 cols) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {TOOLS.map(tool => {
            const active = activeAI === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveAI(tool.id); setGenerated(false); }}
                style={{
                  textAlign: 'left', padding: '18px 20px',
                  borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${active ? '#D97757' : '#E8E6DC'}`,
                  background: active ? '#FBECE4' : '#fff',
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: poppins,
                }}
              >
                <div style={{ marginBottom: 10, color: active ? '#B95A3A' : '#8C8A82' }}>
                  <tool.Icon size={24} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: active ? '#B95A3A' : '#141413', marginBottom: 4 }}>
                  {tool.title}
                </p>
                <p style={{ fontSize: 12, color: active ? '#B95A3A' : '#8C8A82' }}>
                  {tool.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Workspace: Input + Output ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* LEFT: Input panel */}
          <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <activeTool.Icon size={15} /> {activeTool.title} — Input
            </p>

            {activeAI === 'listing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Product Type */}
                <div>
                  <label style={labelStyle}>Product Type</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Educational Resource</option>
                    <option>Digital Download</option>
                    <option>Handmade Craft</option>
                    <option>Business Tool</option>
                  </select>
                </div>

                {/* Keywords */}
                <div>
                  <label style={labelStyle}>Product Keywords / Topic</label>
                  <textarea
                    rows={4}
                    defaultValue="Grade 5 math, fractions, decimals, full year curriculum, common core, printable worksheets"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                {/* Tone */}
                <div>
                  <label style={labelStyle}>Tone</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Professional', 'Friendly', 'Academic'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12,
                          fontWeight: 500, cursor: 'pointer', fontFamily: poppins,
                          border: `1px solid ${tone === t ? '#D97757' : '#E8E6DC'}`,
                          background: tone === t ? '#FBECE4' : '#fff',
                          color: tone === t ? '#B95A3A' : '#8C8A82',
                          transition: 'all 0.12s',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Product</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Grade 5 Math Bundle</option>
                    <option>Fractions Mastery Kit</option>
                    <option>Science Lab Worksheets</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Current Price ($)</label>
                  <input type="number" defaultValue="39.99" style={inputStyle} />
                </div>
                <div style={{ background: '#FBECE4', borderRadius: 8, padding: 12, fontSize: 12, color: '#B95A3A' }}>
                  <p style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={13} /> AI will analyze:</p>
                  <ul style={{ paddingLeft: 16, color: '#8C6050', fontSize: 11, lineHeight: 2 }}>
                    <li>Competitor pricing in your category</li>
                    <li>Your historical sales conversion</li>
                    <li>Demand trends and seasonality</li>
                    <li>Buyer segment willingness to pay</li>
                  </ul>
                </div>
              </div>
            )}

            {activeAI === 'worksheet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Subject</label>
                  <input placeholder="e.g. Fractions, Algebra, Grammar…" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Grade Level</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Number of Questions</label>
                  <input type="number" placeholder="10" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Include</label>
                  {['Answer Key','Word Problems','Visual Diagrams','Common Core Standards'].map(item => (
                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: '#D97757' }} />
                      <span style={{ fontSize: 12, color: '#4A4945' }}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(activeAI === 'seo' || activeAI === 'email' || activeAI === 'images') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Product or Store Name</label>
                  <input placeholder="Enter product or store name…" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Additional Context</label>
                  <textarea rows={4} placeholder="Describe what you need help with…" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={() => setGenerated(true)}
              style={{
                width: '100%', marginTop: 20, padding: '13px 0',
                background: '#D97757', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: poppins,
              }}
            >
              <Sparkles size={14} /> Generate with AI (5 credits)
            </button>
          </div>

          {/* RIGHT: Output panel */}
          <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} /> AI Output — Preview
            </p>

            {/* Empty state */}
            {!generated && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
                <Bot size={40} style={{ color: '#8C8A82', marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 6 }}>Ready to generate</p>
                <p style={{ fontSize: 12, color: '#8C8A82', lineHeight: 1.6 }}>
                  Fill in the inputs on the left and click<br />"Generate with AI" to see results here.
                </p>
              </div>
            )}

            {/* Listing output */}
            {generated && activeAI === 'listing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Generated Title</p>
                  <div style={{ background: '#FAF9F5', border: '1px solid #E8E6DC', borderRadius: 8, padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#141413', lineHeight: 1.5 }}>
                    Grade 5 Math Mastery Bundle — Complete Full-Year Curriculum with Worksheets, Assessments &amp; Answer Keys | Common Core Aligned
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Generated Description</p>
                  <div style={{ background: '#FAF9F5', border: '1px solid #E8E6DC', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#4A4945', lineHeight: 1.7 }}>
                    Transform your Grade 5 classroom with this comprehensive, ready-to-use math curriculum designed to take students from foundational concepts to grade-level mastery. This all-in-one bundle covers <strong>36 weeks</strong> of instruction across fractions, decimals, geometry, measurement, and data analysis...
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Suggested Tags</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['grade 5 math','common core','full year curriculum','fractions worksheets','math assessment','5th grade','printable','differentiated'].map(tag => (
                      <span key={tag} style={{ padding: '3px 10px', background: '#F0EEE6', borderRadius: 5, fontSize: 11, color: '#5A5852', fontFamily: poppins }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button style={{ flex: 1, padding: '10px 0', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
                    Use This
                  </button>
                  <button onClick={() => setGenerated(false)} style={{ padding: '10px 18px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                    Regenerate
                  </button>
                  <button style={{ padding: '10px 18px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* Pricing output */}
            {generated && activeAI === 'pricing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <TrendingUp size={36} style={{ color: '#D97757', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Optimal Price</p>
                  <p style={{ fontSize: 40, fontWeight: 700, color: '#D97757', lineHeight: 1 }}>$49.00</p>
                  <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>Optimal range: $44 – $55</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { label: 'Underpriced', price: '$39', color: '#1A72C2', bg: '#E6F1FB' },
                    { label: 'Optimal',     price: '$49', color: '#2D8A4E', bg: '#EBF7EF' },
                    { label: 'Premium',     price: '$59', color: '#D97757', bg: '#FBECE4' },
                  ].map(box => (
                    <div key={box.label} style={{ background: box.bg, borderRadius: 8, padding: '10px 0', textAlign: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: box.color, marginBottom: 4 }}>{box.label}</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: box.color }}>{box.price}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Market Insights</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: poppins }}>
                    <tbody>
                      {[['Category avg price','$42.00'],['Your conversion at $39','3.2%'],['Estimated conversion at $49','2.8%'],['Expected revenue uplift','+$18/mo']].map(([label, value]) => (
                        <tr key={label} style={{ borderBottom: '1px solid #F0EEE6' }}>
                          <td style={{ padding: '7px 0', color: '#8C8A82' }}>{label}</td>
                          <td style={{ padding: '7px 0', fontWeight: 600, color: '#141413', textAlign: 'right' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button style={{ padding: '10px 0', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
                  Apply Price
                </button>
              </div>
            )}

            {/* Worksheet output */}
            {generated && activeAI === 'worksheet' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
                <FileText size={40} style={{ color: '#D97757', marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 6 }}>Worksheet Generated!</p>
                <p style={{ fontSize: 12, color: '#8C8A82', lineHeight: 1.6, marginBottom: 16 }}>
                  Your Grade 5 Fractions worksheet with<br />10 questions is ready to download.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '9px 18px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>Download PDF</button>
                  <button style={{ padding: '9px 18px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Preview</button>
                </div>
              </div>
            )}

            {/* Generic output */}
            {generated && (activeAI === 'seo' || activeAI === 'email' || activeAI === 'images') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
                <CheckCircle size={40} style={{ color: '#2D8A4E', marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 6 }}>Content Generated</p>
                <p style={{ fontSize: 12, color: '#8C8A82' }}>Your AI-generated content is ready.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}