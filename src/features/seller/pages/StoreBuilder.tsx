import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Palette, LayoutGrid, PanelTop, Package, PanelBottom, Search, Monitor, Smartphone, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

type Section = 'theme' | 'layout' | 'header' | 'products' | 'footer' | 'seo';
type LayoutStyle = 'Grid' | 'Magazine' | 'Minimal';

const SECTIONS: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: 'theme',    label: 'Theme Colors',  Icon: Palette     },
  { id: 'layout',   label: 'Layout Style',  Icon: LayoutGrid  },
  { id: 'header',   label: 'Header',        Icon: PanelTop    },
  { id: 'products', label: 'Products Grid', Icon: Package     },
  { id: 'footer',   label: 'Footer',        Icon: PanelBottom },
  { id: 'seo',      label: 'SEO & Meta',    Icon: Search      },
];

const THEME_COLORS = [
  { label: 'Primary',    value: '#D97757' },
  { label: 'Background', value: '#FAF9F5' },
  { label: 'Text',       value: '#141413' },
  { label: 'Accent',     value: '#B95A3A' },
];

const LAYOUT_OPTIONS: { id: LayoutStyle; desc: string }[] = [
  { id: 'Grid',     desc: 'Classic product grid, best for large catalogues' },
  { id: 'Magazine', desc: 'Editorial layout with featured products in hero spots' },
  { id: 'Minimal',  desc: 'Clean whitespace-focused design for premium brands' },
];

const PREVIEW_PRODUCTS = [
  { emoji: '📚', name: 'Math Bundle',       price: '$49.00' },
  { emoji: '✏️', name: 'Writing Prompts',   price: '$12.00' },
  { emoji: '🔬', name: 'Science Worksheets', price: '$15.00' },
];

export function StoreBuilder() {
  usePageTitle('Store Builder');
  const [activeSection, setActiveSection] = useState<Section>('theme');
  const [layoutStyle, setLayoutStyle]     = useState<LayoutStyle>('Grid');
  const [font, setFont]                   = useState('Inter');

  return (
    <>
      <SellerPageHeader
        title="Store Builder"
        subtitle="Customize your storefront — changes save automatically."
        actions={
          <>
            <Button variant="ghost"     size="sm">Preview</Button>
            <Button variant="secondary" size="sm">Undo</Button>
            <Button variant="primary"   size="sm">Publish Changes</Button>
          </>
        }
      />

      <div className="p-7">
        <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr', height: 'calc(100vh - 200px)' }}>
          {/* LEFT: section list + panel */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* Section list */}
            <Card padding="none">
              {SECTIONS.map((sec, i) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${i < SECTIONS.length - 1 ? 'border-b border-bone' : ''}`}
                  style={{
                    background: activeSection === sec.id ? '#FBECE4' : 'transparent',
                  }}
                >
                  <sec.Icon size={16} style={{ color: activeSection === sec.id ? '#B95A3A' : '#8C8A82', flexShrink: 0 }} />
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: activeSection === sec.id ? '#B95A3A' : '#141413' }}
                  >
                    {sec.label}
                  </span>
                  <span className="ml-auto text-[12px] text-slate">›</span>
                </button>
              ))}
            </Card>

            {/* Theme panel */}
            {activeSection === 'theme' && (
              <Card>
                <p className="text-[13px] font-bold text-carbon mb-4">Theme Colors</p>
                <div className="flex flex-col gap-3">
                  {THEME_COLORS.map(tc => (
                    <div key={tc.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-charcoal">{tc.label}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-bone cursor-pointer"
                          style={{ background: tc.value }}
                        />
                        <span className="text-[11px] font-mono text-slate">{tc.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Select label="Font" value={font} onChange={e => setFont(e.target.value)}>
                    <option>Inter</option>
                    <option>DM Sans</option>
                    <option>Lato</option>
                    <option>Playfair Display</option>
                    <option>Merriweather</option>
                  </Select>
                </div>
              </Card>
            )}

            {/* Layout panel */}
            {activeSection === 'layout' && (
              <Card>
                <p className="text-[13px] font-bold text-carbon mb-4">Layout Style</p>
                <div className="flex flex-col gap-2">
                  {LAYOUT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setLayoutStyle(opt.id)}
                      className="w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: layoutStyle === opt.id ? '#D97757' : '#E8E6DC',
                        background:  layoutStyle === opt.id ? '#FBECE4' : '#FFFFFF',
                      }}
                    >
                      <p className="text-[13px] font-semibold" style={{ color: layoutStyle === opt.id ? '#B95A3A' : '#141413' }}>
                        {opt.id}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: layoutStyle === opt.id ? '#B95A3A' : '#8C8A82' }}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Generic panel for other sections */}
            {(activeSection === 'header' || activeSection === 'products' || activeSection === 'footer' || activeSection === 'seo') && (
              <Card>
                <p className="text-[13px] font-bold text-carbon mb-2">
                  {SECTIONS.find(s => s.id === activeSection)?.label} Settings
                </p>
                <p className="text-[12px] text-slate">
                  Advanced settings for this section are coming soon.
                </p>
              </Card>
            )}
          </div>

          {/* RIGHT: Store preview */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-bone bg-white">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-bone bg-[#F5F4F0] flex-shrink-0">
              {/* Traffic light dots */}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#E05252' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#E0BE52' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#52C45A' }} />
              </div>
              {/* URL bar */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white border border-bone rounded-lg px-3 py-1 text-[12px] text-slate" style={{ minWidth: 220, textAlign: 'center' }}>
                  🔒 myshop.solvexo.store
                </div>
              </div>
              {/* Desktop/mobile toggle */}
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded flex items-center justify-center bg-brand-pale-orange cursor-pointer"><Monitor size={14} /></button>
                <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-bone cursor-pointer"><Smartphone size={14} /></button>
              </div>
            </div>

            {/* Store preview content */}
            <div className="flex-1 overflow-y-auto">
              {/* Store header */}
              <header className="flex items-center justify-between px-8 py-4 border-b" style={{ background: '#2C2A28', borderColor: '#3A3836' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white" style={{ background: '#D97757' }}>M</div>
                  <span className="text-[14px] font-bold text-white">My Shop</span>
                </div>
                <nav className="flex items-center gap-6">
                  {['Shop', 'About', 'Contact'].map(link => (
                    <a key={link} href="#" className="text-[12px] text-[#B0AEA8] hover:text-white transition-colors">{link}</a>
                  ))}
                </nav>
                <div className="flex items-center gap-3">
                  <button className="text-[#8C8A82] hover:text-white cursor-pointer"><Search size={14} /></button>
                  <button className="text-[#8C8A82] hover:text-white cursor-pointer"><Package size={14} /></button>
                </div>
              </header>

              {/* Hero */}
              <section className="px-8 py-12 text-center" style={{ background: '#FBECE4' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#D97757' }}>Welcome</p>
                <h2 className="text-[28px] font-bold text-carbon mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Welcome to My Shop</h2>
                <p className="text-[14px] text-slate mb-6">Discover amazing educational resources and digital downloads.</p>
                <button
                  className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer"
                  style={{ background: '#D97757' }}
                >
                  Shop Now
                </button>
              </section>

              {/* Products */}
              <section className="px-8 py-8">
                <h3 className="text-[16px] font-bold text-carbon mb-5">Featured Products</h3>
                <div className="grid grid-cols-3 gap-4">
                  {PREVIEW_PRODUCTS.map(p => (
                    <div key={p.name} className="rounded-xl border border-bone bg-white overflow-hidden">
                      <div
                        className="flex items-center justify-center"
                        style={{ height: 100, background: '#FBECE4', fontSize: 36 }}
                      >
                        {p.emoji}
                      </div>
                      <div className="p-3">
                        <p className="text-[12px] font-semibold text-carbon">{p.name}</p>
                        <p className="text-[13px] font-bold mt-0.5" style={{ color: '#D97757' }}>{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
