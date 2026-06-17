import { useState } from 'react';
import {
  Palette, LayoutGrid, PanelTop, Package, PanelBottom, Search,
  Monitor, Smartphone, BookOpen, Pencil, Microscope, Lock,
  type LucideIcon,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Types & Data ──────────────────────────────────────────────────────────────
type Section     = 'theme' | 'layout' | 'header' | 'products' | 'footer' | 'seo';
type LayoutStyle = 'Grid' | 'Magazine' | 'Minimal';

const SECTIONS: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: 'theme',    label: 'Theme',    Icon: Palette     },
  { id: 'layout',   label: 'Layout',   Icon: LayoutGrid  },
  { id: 'header',   label: 'Header',   Icon: PanelTop    },
  { id: 'products', label: 'Products', Icon: Package     },
  { id: 'footer',   label: 'Footer',   Icon: PanelBottom },
  { id: 'seo',      label: 'Seo',      Icon: Search      },
];

const THEME_COLORS = [
  { label: 'Primary',    value: '#D97757' },
  { label: 'Background', value: '#FAF9F5' },
  { label: 'Text',       value: '#2C2A28' },
  { label: 'Accent',     value: '#B95A3A' },
];

const LAYOUT_OPTIONS: { id: LayoutStyle; desc: string }[] = [
  { id: 'Grid',     desc: 'Classic product grid, best for large catalogues'             },
  { id: 'Magazine', desc: 'Editorial layout with featured products in hero spots'       },
  { id: 'Minimal',  desc: 'Clean whitespace-focused design for premium brands'          },
];

const PREVIEW_PRODUCTS: { Icon: LucideIcon; name: string; price: string }[] = [
  { Icon: Pencil,     name: 'Product Name 1', price: '$12.00' },
  { Icon: BookOpen,   name: 'Product Name 2', price: '$24.00' },
  { Icon: Microscope, name: 'Product Name 3', price: '$36.00' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreBuilder() {
  usePageTitle('Store Builder');
  const [activeSection, setActiveSection] = useState<Section>('theme');
  const [layoutStyle,   setLayoutStyle]   = useState<LayoutStyle>('Grid');
  const [font,          setFont]          = useState('Poppins (Current)');

  return (
    <>
      <SellerPageHeader
        title="Store Builder"
        subtitle="Customize your storefront — changes save automatically."
        actions={
          <>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-[12px] font-medium text-slate cursor-pointer">
              Preview
            </button>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-[12px] font-medium text-slate cursor-pointer">
              Undo
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-[12px] font-semibold text-white cursor-pointer">
              Publish Changes
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: '220px 1fr', height: 'calc(100vh - 160px)' }}
        >

          {/* ── LEFT: section list + panel ── */}
          <div className="flex flex-col gap-3 overflow-y-auto">

            {/* Section nav */}
            <div className="bg-white border border-bone rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              {SECTIONS.map((sec, i) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className="w-full flex items-center gap-[10px] px-[14px] py-[11px] text-left cursor-pointer border-none transition-[background] duration-[120ms]"
                  style={{
                    background: activeSection === sec.id ? '#FBECE4' : 'transparent',
                    borderBottom: i < SECTIONS.length - 1 ? '1px solid #F0EEE6' : 'none',
                  }}
                >
                  <sec.Icon size={15} className="shrink-0" style={{ color: activeSection === sec.id ? '#B95A3A' : '#8C8A82' }} />
                  <span className="flex-1 text-[13px] font-medium" style={{ color: activeSection === sec.id ? '#B95A3A' : '#141413' }}>
                    {sec.label}
                  </span>
                  <span className="text-[14px] text-[#C0BDB5]">›</span>
                </button>
              ))}
            </div>

            {/* Theme panel */}
            {activeSection === 'theme' && (
              <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-[13px] font-bold text-[#141413] mb-[14px]">Theme Colors</p>
                <div className="flex flex-col gap-3">
                  {THEME_COLORS.map(tc => (
                    <div key={tc.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-slate">{tc.label}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-[22px] h-[22px] rounded-[5px] border border-bone cursor-pointer shrink-0"
                          style={{ background: tc.value }}
                        />
                        <span className="text-[11px] font-mono text-[#8C8A82]">{tc.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Font */}
                <div className="mt-4">
                  <p className="text-[12px] font-medium text-slate mb-[6px]">Font</p>
                  <select
                    value={font}
                    onChange={e => setFont(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer"
                  >
                    {['Poppins (Current)','Inter','DM Sans','Lato','Playfair Display','Merriweather'].map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Layout panel */}
            {activeSection === 'layout' && (
              <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-[13px] font-bold text-[#141413] mb-3">Layout Style</p>
                <div className="flex flex-col gap-2">
                  {LAYOUT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setLayoutStyle(opt.id)}
                      className="w-full text-left px-3 py-[10px] rounded-lg cursor-pointer transition-all duration-[120ms]"
                      style={{
                        border: `2px solid ${layoutStyle === opt.id ? '#D97757' : '#E8E6DC'}`,
                        background: layoutStyle === opt.id ? '#FBECE4' : '#fff',
                      }}
                    >
                      <p className="text-[13px] font-semibold mb-[2px]" style={{ color: layoutStyle === opt.id ? '#B95A3A' : '#141413' }}>
                        {opt.id}
                      </p>
                      <p className="text-[11px]" style={{ color: layoutStyle === opt.id ? '#B95A3A' : '#8C8A82' }}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generic panel */}
            {(activeSection === 'header' || activeSection === 'products' || activeSection === 'footer' || activeSection === 'seo') && (
              <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-[13px] font-bold text-[#141413] mb-[6px]">
                  {SECTIONS.find(s => s.id === activeSection)?.label} Settings
                </p>
                <p className="text-[12px] text-[#8C8A82]">
                  Advanced settings for this section are coming soon.
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Store preview ── */}
          <div className="flex flex-col border border-bone rounded-xl bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">

            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-4 py-[10px] border-b border-bone bg-[#F5F4F0] shrink-0">
              {/* Traffic lights */}
              <div className="flex items-center gap-[5px] shrink-0">
                <div className="w-[11px] h-[11px] rounded-full bg-[#E05252]" />
                <div className="w-[11px] h-[11px] rounded-full bg-[#E0BE52]" />
                <div className="w-[11px] h-[11px] rounded-full bg-[#52C45A]" />
              </div>

              {/* URL bar */}
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-bone rounded-lg px-[14px] py-1 text-[12px] text-[#8C8A82] min-w-[220px] text-center flex items-center justify-center gap-1">
                  <Lock size={10} /> myshop.solvexo.store
                </div>
              </div>

              {/* Device toggle */}
              <div className="flex items-center gap-1 shrink-0">
                <button className="w-7 h-7 rounded-[6px] flex items-center justify-center bg-brand-pale-orange border-none cursor-pointer">
                  <Monitor size={14} className="text-brand-deep-orange" />
                </button>
                <button className="w-7 h-7 rounded-[6px] flex items-center justify-center bg-[#F0EEE6] border-none cursor-pointer">
                  <Smartphone size={14} className="text-[#8C8A82]" />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-y-auto">

              {/* Store header */}
              <header className="flex items-center justify-between px-8 py-[14px] bg-charcoal border-b border-[#3A3836]">
                <div className="flex items-center gap-[10px]">
                  <div className="w-7 h-7 rounded-[7px] bg-brand-orange flex items-center justify-center text-[12px] font-bold text-white">M</div>
                  <span className="text-[15px] font-bold text-white">My Shop</span>
                </div>
                <nav className="flex items-center gap-6">
                  {['Shop', 'About', 'Contact'].map(link => (
                    <a key={link} href="#" className="text-[13px] text-[#B0AEA8] no-underline">{link}</a>
                  ))}
                </nav>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-[#B0AEA8] cursor-pointer">Search</span>
                  <span className="text-[13px] text-[#B0AEA8] cursor-pointer">Cart (0)</span>
                </div>
              </header>

              {/* Hero */}
              <section className="px-8 py-[60px] text-center bg-brand-pale-orange">
                <h2 className="text-[32px] font-bold text-[#141413] mb-[10px] leading-[1.2]" style={{ fontFamily: 'Georgia, serif' }}>
                  Welcome to My Shop
                </h2>
                <p className="text-[14px] text-[#8C8A82] mb-6">
                  Handcrafted educational resources for modern classrooms.
                </p>
                <button className="px-7 py-[11px] bg-brand-orange border-none rounded-lg text-[14px] font-semibold text-white cursor-pointer">
                  Shop Now
                </button>
              </section>

              {/* Featured Products */}
              <section className="p-8">
                <h3 className="text-[17px] font-bold text-[#141413] mb-5">
                  Featured Products
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {PREVIEW_PRODUCTS.map(p => (
                    <div key={p.name} className="border border-bone rounded-[10px] bg-white overflow-hidden">
                      <div className="h-[120px] bg-[#EAF4EE] flex items-center justify-center">
                        <p.Icon size={38} className="text-[#5A8A6A]" />
                      </div>
                      <div className="px-[14px] py-3">
                        <p className="text-[13px] font-semibold text-[#141413] mb-1">{p.name}</p>
                        <p className="text-[14px] font-bold text-brand-orange">{p.price}</p>
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
